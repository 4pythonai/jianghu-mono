<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class ScoreBoard extends MY_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
        $this->load->model('MTeamGame');
    }

    public function getScoreBoard() {
        $params = $this->readJsonBody();
        $game_id = $params['game_id'] ?? null;
        $group_id = $params['group_id'] ?? null;

        if (!$game_id) {
            $this->respondError(400, '缺少 game_id');
            return;
        }

        $game = $this->getGameRow($game_id);
        if (!$game) {
            $this->respondError(404, '赛事不存在');
            return;
        }

        $match_format = $game['match_format'] ?? null;
        $game_type = $game['game_type'] ?? 'common';
        $layout = $this->isMatchFormat($match_format) ? 'horizontal' : 'vertical';
        $total_holes = $this->getTotalHoles($game_id, $game['holeList'] ?? null);
        if (!$total_holes) {
            // Match play defaults to 18 holes when holeList is missing.
            $total_holes = 18;
        }

        if ($layout === 'horizontal') {
            // Match play summary mode: when multiple groups exist and no group_id is provided,
            // return aggregated points + matches list instead of erroring.
            if (!$group_id) {
                $summary = $this->tryBuildMatchPlaySummaryData($game_id, $match_format, $game_type, $total_holes);
                if (isset($summary['error'])) {
                    $this->respondError($summary['code'], $summary['error']);
                    return;
                }
                if ($summary) {
                    $data = array_merge([
                        'layout' => $layout,
                        'match_format' => $match_format,
                        'game_type' => $game_type
                    ], $summary);
                    $this->respondOk($data);
                    return;
                }
            }

            $result = $this->buildMatchPlayData($game_id, $group_id, $match_format, $game_type, $total_holes);
            if (isset($result['error'])) {
                $this->respondError($result['code'], $result['error']);
                return;
            }
            $data = array_merge([
                'layout' => $layout,
                'match_format' => $match_format,
                'game_type' => $game_type
            ], $result);
            $this->respondOk($data);
            return;
        }

        $data = $this->buildStrokePlayData($game_id, $match_format, $game_type, $total_holes);
        $data = array_merge([
            'layout' => $layout,
            'match_format' => $match_format,
            'game_type' => $game_type
        ], $data);
        $this->respondOk($data);
    }

    private function tryBuildMatchPlaySummaryData($game_id, $match_format, $game_type, $total_holes) {
        // Prefer groups that already have match results; fallback to game groups.
        $group_ids = $this->getMatchGroupIds($game_id);
        if (count($group_ids) <= 1) {
            $group_ids = $this->getGameGroupIds($game_id);
        }
        if (count($group_ids) <= 1) {
            return null;
        }

        return $this->buildMatchPlaySummaryData($game_id, $match_format, $game_type, $total_holes);
    }

    private function buildMatchPlaySummaryData($game_id, $match_format, $game_type, $total_holes) {
        $groups = $this->getGroupsWithMembers($game_id);
        if (count($groups) <= 1) {
            return ['error' => '未找到分组', 'code' => 404];
        }

        // Summary is always team-vs-team. Resolve the two tags in a stable order.
        $tags = $this->getOrderedTags($game_id);
        if (count($tags) < 2) {
            return ['error' => '分队不足', 'code' => 409];
        }
        if (count($tags) > 2) {
            return ['error' => '比洞赛仅支持两方对阵', 'code' => 409];
        }

        $left_tag = $tags[0];
        $right_tag = $tags[1];

        $match_result_map = $this->getMatchResultRowsMap($game_id);
        $score_index = $this->getScoresIndexByGameId($game_id);

        $points_left = 0.0;
        $points_right = 0.0;
        $matches = [];

        foreach ($groups as $group) {
            $gid = (int) ($group['group_id'] ?? 0);
            if (!$gid) {
                continue;
            }

            $members = $group['members'] ?? [];
            if ($match_format === 'individual_match') {
                $sides = $this->buildIndividualMatchSidesForSummary($members, $left_tag, $right_tag);
            } else {
                $sides = $this->buildMatchSides($game_id, $match_format, $members);
            }

            if (isset($sides['error'])) {
                return $sides;
            }

            $match_result = $match_result_map[$gid] ?? null;
            $computed = $this->computeMatchResultRowFromScores(
                $match_format,
                $gid,
                $members,
                $sides['left'],
                $sides['right'],
                $score_index,
                $total_holes
            );
            $effective_match_result = $this->fillMissingMatchResultFields($match_result, $computed);
            $result_payload = $this->buildMatchResultPayload($effective_match_result, $sides['left'], $sides['right'], $match_format);

            // Only count points for finished matches.
            $status = $effective_match_result['status'] ?? null;
            $winner_side = $result_payload['result']['winner_side'] ?? null;
            if ($status === 'finished' && $winner_side) {
                if ($winner_side === 'left') {
                    $points_left += 1.0;
                } elseif ($winner_side === 'right') {
                    $points_right += 1.0;
                } elseif ($winner_side === 'draw') {
                    $points_left += 0.5;
                    $points_right += 0.5;
                }
            }

            $match_entry = array_merge([
                'group_id' => $gid,
                'group_name' => $group['group_name'] ?? '',
                'left' => $sides['left'],
                'right' => $sides['right'],
            ], $result_payload);

            $match_entry['status'] = $effective_match_result['status'] ?? null;
            $match_entry['holes_played'] = isset($effective_match_result['holes_played']) ? (int) $effective_match_result['holes_played'] : null;
            $match_entry['holes_remaining'] = isset($effective_match_result['holes_remaining']) ? (int) $effective_match_result['holes_remaining'] : null;

            $matches[] = $match_entry;
        }

        return [
            'mode' => 'summary',
            'left' => [
                'tag_id' => $left_tag['tag_id'],
                'tag_name' => $left_tag['tag_name'],
                'tag_color' => $left_tag['tag_color']
            ],
            'right' => [
                'tag_id' => $right_tag['tag_id'],
                'tag_name' => $right_tag['tag_name'],
                'tag_color' => $right_tag['tag_color']
            ],
            'points' => [
                'left' => $points_left,
                'right' => $points_right
            ],
            'matches' => $matches
        ];
    }

    private function fillMissingMatchResultFields($match_result, $fallback) {
        if (!$match_result) {
            return $fallback;
        }
        if (!$fallback) {
            return $match_result;
        }
        $merged = $match_result;
        foreach (['winner_side', 'result_code', 'status', 'holes_played', 'holes_remaining'] as $key) {
            if (!isset($merged[$key]) || $merged[$key] === null || $merged[$key] === '') {
                if (isset($fallback[$key])) {
                    $merged[$key] = $fallback[$key];
                }
            }
        }
        return $merged;
    }

    private function getScoresIndexByGameId($game_id) {
        $rows = $this->db->select('group_id, user_id, hindex, score')
            ->from('t_game_score')
            ->where('gameid', $game_id)
            ->where('score >', 0)
            ->get()
            ->result_array();

        $index = [];
        foreach ($rows as $row) {
            $group_id = (int) ($row['group_id'] ?? 0);
            $user_id = (int) ($row['user_id'] ?? 0);
            $hindex = (int) ($row['hindex'] ?? 0);
            $score = (int) ($row['score'] ?? 0);
            if (!$group_id || !$user_id || !$hindex || $score <= 0) {
                continue;
            }
            if (!isset($index[$group_id])) {
                $index[$group_id] = [];
            }
            if (!isset($index[$group_id][$user_id])) {
                $index[$group_id][$user_id] = [];
            }
            // keep last (should be unique by gameid/user_id/hole_id/hindex anyway)
            $index[$group_id][$user_id][$hindex] = $score;
        }
        return $index;
    }

    private function computeMatchResultRowFromScores($match_format, $group_id, $members, $left, $right, $score_index, $total_holes) {
        if (!$group_id || !$total_holes) {
            return null;
        }

        $left_user_ids = $this->resolveSideUserIds($match_format, $members, $left, 'left');
        $right_user_ids = $this->resolveSideUserIds($match_format, $members, $right, 'right');
        if (empty($left_user_ids) || empty($right_user_ids)) {
            return null;
        }

        $holes_played = 0;
        $left_wins = 0;
        $right_wins = 0;

        for ($h = 1; $h <= $total_holes; $h++) {
            $left_score = $this->getSideHoleScore($score_index, $group_id, $left_user_ids, $h);
            $right_score = $this->getSideHoleScore($score_index, $group_id, $right_user_ids, $h);

            // A hole is considered played only when both sides have a score.
            if ($left_score === null || $right_score === null) {
                continue;
            }

            $holes_played++;
            if ($left_score < $right_score) {
                $left_wins++;
            } elseif ($right_score < $left_score) {
                $right_wins++;
            }

            $lead = abs($left_wins - $right_wins);
            $remain = $total_holes - $holes_played;
            if ($lead > $remain) {
                return $this->buildComputedMatchRow($left_wins, $right_wins, $holes_played, $remain, true);
            }
        }

        if ($holes_played === 0) {
            return null;
        }

        $remain = $total_holes - $holes_played;
        $finished = $holes_played >= $total_holes;
        return $this->buildComputedMatchRow($left_wins, $right_wins, $holes_played, $remain, $finished);
    }

    private function resolveSideUserIds($match_format, $members, $side, $side_name) {
        if ($match_format === 'individual_match') {
            $user_id = isset($side['user_id']) ? (int) $side['user_id'] : 0;
            return $user_id ? [$user_id] : [];
        }

        $tag_id = isset($side['tag_id']) ? (int) $side['tag_id'] : 0;
        if (!$tag_id || !is_array($members)) {
            return [];
        }

        $user_ids = [];
        foreach ($members as $m) {
            $m_tag_id = isset($m['tag_id']) ? (int) $m['tag_id'] : 0;
            $m_user_id = isset($m['user_id']) ? (int) $m['user_id'] : 0;
            if ($m_user_id && $m_tag_id === $tag_id) {
                $user_ids[] = $m_user_id;
            }
        }
        return array_values(array_unique($user_ids));
    }

    private function getSideHoleScore($score_index, $group_id, $user_ids, $hindex) {
        $group_id = (int) $group_id;
        $hindex = (int) $hindex;
        if (!$group_id || !$hindex || empty($user_ids)) {
            return null;
        }
        if (!isset($score_index[$group_id])) {
            return null;
        }

        $best = null;
        foreach ($user_ids as $uid) {
            $uid = (int) $uid;
            if (!$uid) {
                continue;
            }
            $score = $score_index[$group_id][$uid][$hindex] ?? null;
            if (!$score) {
                continue;
            }
            $score = (int) $score;
            if ($best === null || $score < $best) {
                $best = $score;
            }
        }
        return $best;
    }

    private function buildComputedMatchRow($left_wins, $right_wins, $holes_played, $holes_remaining, $finished) {
        $delta = (int) $left_wins - (int) $right_wins;
        $lead = abs($delta);

        $winner_side = null;
        if ($delta > 0) {
            $winner_side = 'left';
        } elseif ($delta < 0) {
            $winner_side = 'right';
        } else {
            $winner_side = 'draw';
        }

        $status = $finished ? 'finished' : 'playing';

        $result_code = null;
        if ($lead === 0) {
            $result_code = 'AS';
        } else if ($finished && $holes_remaining > 0) {
            $result_code = $lead . '&' . (int) $holes_remaining;
        } else {
            // Use UP/DN from left side perspective (align with DB schema)
            if ($winner_side === 'left') {
                $result_code = $lead . 'UP';
            } else if ($winner_side === 'right') {
                $result_code = $lead . 'DN';
            } else {
                $result_code = 'AS';
            }
        }

        return [
            'winner_side' => $winner_side,
            'result_code' => $result_code,
            'status' => $status,
            'holes_played' => (int) $holes_played,
            'holes_remaining' => (int) $holes_remaining
        ];
    }

    private function getOrderedTags($game_id) {
        $tag_map = $this->getTagMap($game_id);
        $tags = [];
        foreach ($tag_map as $tag_id => $tag_info) {
            $tags[] = [
                'tag_id' => (int) $tag_id,
                'tag_name' => $tag_info['tag_name'] ?? '',
                'tag_color' => $tag_info['tag_color'] ?? null,
                'tag_order' => $tag_info['tag_order'] ?? 0
            ];
        }
        usort($tags, function ($a, $b) {
            return ($a['tag_order'] ?? 0) <=> ($b['tag_order'] ?? 0);
        });
        return $tags;
    }

    private function getMatchResultRowsMap($game_id) {
        $rows = $this->db->select('group_id, winner_side, result_code, status, holes_played, holes_remaining')
            ->from('t_game_match_result')
            ->where('game_id', $game_id)
            ->get()
            ->result_array();

        $map = [];
        foreach ($rows as $row) {
            if (!isset($row['group_id'])) {
                continue;
            }
            $map[(int) $row['group_id']] = $row;
        }
        return $map;
    }

    private function buildIndividualMatchSidesForSummary($members, $left_tag, $right_tag) {
        $players = array_values($members);
        if (count($players) < 2) {
            return ['error' => '分组人数不足', 'code' => 409];
        }
        if (count($players) > 2) {
            return ['error' => '比洞赛仅支持两名球员', 'code' => 409];
        }

        $left_tag_id = (int) ($left_tag['tag_id'] ?? 0);
        $right_tag_id = (int) ($right_tag['tag_id'] ?? 0);

        $left_player = null;
        $right_player = null;
        foreach ($players as $p) {
            $tag_id = (int) ($p['tag_id'] ?? 0);
            if ($tag_id === $left_tag_id) {
                $left_player = $p;
            } elseif ($tag_id === $right_tag_id) {
                $right_player = $p;
            }
        }

        // Fallback: keep stable ordering if tags are missing.
        if (!$left_player) {
            $left_player = $players[0];
        }
        if (!$right_player) {
            $right_player = ($players[0]['user_id'] ?? null) === ($left_player['user_id'] ?? null) ? $players[1] : $players[0];
        }

        return [
            'left' => [
                'user_id' => $left_player['user_id'],
                'show_name' => $left_player['show_name'],
                'avatar' => $left_player['avatar'],
                'tag_id' => $left_player['tag_id'] ?? null,
                'tag_name' => $left_player['tag_name'] ?? '',
                'tag_color' => $left_player['tag_color'] ?? null
            ],
            'right' => [
                'user_id' => $right_player['user_id'],
                'show_name' => $right_player['show_name'],
                'avatar' => $right_player['avatar'],
                'tag_id' => $right_player['tag_id'] ?? null,
                'tag_name' => $right_player['tag_name'] ?? '',
                'tag_color' => $right_player['tag_color'] ?? null
            ]
        ];
    }

    private function buildStrokePlayData($game_id, $match_format, $game_type, $total_holes) {
        $row_type = $this->isTagStrokeFormat($match_format) ? 'tag' : 'player';

        if ($row_type === 'player') {
            $player_rows = $this->buildPlayerRows($game_id, $total_holes);
            return [
                'row_type' => $row_type,
                'rows' => $player_rows
            ];
        }

        $tag_rows = $this->buildTagRows($game_id, $total_holes);
        return [
            'row_type' => $row_type,
            'rows' => $tag_rows
        ];
    }

    private function buildMatchPlayData($game_id, $group_id, $match_format, $game_type, $total_holes) {
        $resolved_group_id = $this->resolveMatchGroupId($game_id, $group_id);
        if (isset($resolved_group_id['error'])) {
            return $resolved_group_id;
        }

        $group = $this->getGroupById($game_id, $resolved_group_id);
        if (!$group) {
            return ['error' => '分组不存在', 'code' => 404];
        }

        $left_right = $this->buildMatchSides($game_id, $match_format, $group['members']);
        if (isset($left_right['error'])) {
            return $left_right;
        }

        $match_result = $this->getMatchResultRow($game_id, $resolved_group_id);
        $score_index = $this->getScoresIndexByGameId($game_id);
        $computed = $this->computeMatchResultRowFromScores(
            $match_format,
            (int) $resolved_group_id,
            $group['members'] ?? [],
            $left_right['left'],
            $left_right['right'],
            $score_index,
            $total_holes
        );
        $effective_match_result = $this->fillMissingMatchResultFields($match_result, $computed);
        $result_payload = $this->buildMatchResultPayload($effective_match_result, $left_right['left'], $left_right['right'], $match_format);

        $data = array_merge([
            'group_id' => $resolved_group_id,
            'group_name' => $group['group_name']
        ], $left_right, $result_payload);

        $data['status'] = $effective_match_result['status'] ?? null;
        $data['holes_played'] = isset($effective_match_result['holes_played']) ? (int) $effective_match_result['holes_played'] : null;
        $data['holes_remaining'] = isset($effective_match_result['holes_remaining']) ? (int) $effective_match_result['holes_remaining'] : null;

        return $data;
    }

    private function buildPlayerRows($game_id, $total_holes) {
        $score_stats = $this->getPlayerScoreStats($game_id);
        $players = $this->getPlayersFromGroups($game_id);
        $player_ids = array_unique(array_merge(array_keys($score_stats), array_keys($players)));
        $user_map = $this->getUserMap($player_ids, $players);

        $rows = [];
        foreach ($player_ids as $user_id) {
            $stats = $score_stats[$user_id] ?? ['score' => 0, 'thru' => 0];
            $user = $user_map[$user_id] ?? ['show_name' => '', 'avatar' => ''];
            $thru_label = $this->formatThruLabel($stats['thru'], $total_holes);
            $rows[] = [
                'user_id' => $user_id,
                'show_name' => $user['show_name'],
                'avatar' => $user['avatar'],
                'score' => $stats['score'],
                'thru' => $stats['thru'],
                'thru_label' => $thru_label
            ];
        }

        return $this->applyRanking($rows);
    }

    private function buildTagRows($game_id, $total_holes) {
        $groups = $this->getGroupsWithMembers($game_id);
        $tag_map = $this->getTagMap($game_id);
        $combos = $this->buildTagCombinations($groups, $tag_map);
        $scores = $this->getScoreRows($game_id);

        foreach ($scores as $score_row) {
            $combo_key = $this->resolveComboKey($combos['user_combo_map'], $score_row);
            if (!$combo_key || !isset($combos['rows'][$combo_key])) {
                continue;
            }
            $this->updateComboScore($combos['rows'][$combo_key], $score_row);
        }

        $rows = [];
        foreach ($combos['rows'] as $combo) {
            $score_summary = $this->finalizeComboScore($combo, $total_holes);
            $rows[] = array_merge($combo['row'], $score_summary);
        }

        return $this->applyRanking($rows);
    }

    private function buildTagCombinations($groups, $tag_map) {
        $rows = [];
        $user_combo_map = [];

        foreach ($groups as $group) {
            foreach ($group['members'] as $member) {
                $tag_id = $member['tag_id'];
                if (!$tag_id) {
                    continue;
                }
                // 使用纯 tag_id 作为 combo_key，使每个 tag 只出现一次
                $combo_key = (string) $tag_id;
                if (!isset($rows[$combo_key])) {
                    $tag_info = $tag_map[$tag_id] ?? ['tag_name' => $member['tag_name'], 'tag_color' => $member['tag_color']];
                    $rows[$combo_key] = [
                        'row' => [
                            'tag_id' => $tag_id,
                            'tag_name' => $tag_info['tag_name'],
                            'tag_color' => $tag_info['tag_color'],
                            'members' => [],
                            'groups' => []
                        ],
                        'hole_scores' => [],
                        'group_hole_scores' => [],  // 按 group_id 分组的 hole_scores
                        'group_ids' => []  // 用于追踪已添加的 group
                    ];
                }
                // 记录该 tag 涉及的所有分组（去重）
                if (!in_array($group['group_id'], $rows[$combo_key]['group_ids'])) {
                    $rows[$combo_key]['group_ids'][] = $group['group_id'];
                    $rows[$combo_key]['row']['groups'][] = [
                        'group_id' => $group['group_id'],
                        'group_name' => $group['group_name']
                    ];
                    $rows[$combo_key]['group_hole_scores'][$group['group_id']] = [];
                }
                $rows[$combo_key]['row']['members'][] = [
                    'user_id' => $member['user_id'],
                    'show_name' => $member['show_name'],
                    'avatar' => $member['avatar']
                ];
                $user_combo_map[$group['group_id'] . ':' . $member['user_id']] = $combo_key;
            }
        }

        return [
            'rows' => $rows,
            'user_combo_map' => $user_combo_map
        ];
    }

    private function resolveComboKey($user_combo_map, $score_row) {
        $group_id = $score_row['group_id'];
        $user_id = $score_row['user_id'];
        if (!$group_id || !$user_id) {
            return null;
        }
        return $user_combo_map[$group_id . ':' . $user_id] ?? null;
    }

    private function updateComboScore(&$combo, $score_row) {
        $hole_id = $score_row['hole_id'];
        $group_id = $score_row['group_id'];
        if (!$hole_id) {
            return;
        }
        $score = (int) $score_row['score'];
        $par = isset($score_row['par']) ? (int) $score_row['par'] : 0;

        // 更新全局 hole_scores（用于计算总成绩，取最好成绩）
        if (!isset($combo['hole_scores'][$hole_id])) {
            $combo['hole_scores'][$hole_id] = ['score' => $score, 'par' => $par];
        } else if ($score < $combo['hole_scores'][$hole_id]['score']) {
            $combo['hole_scores'][$hole_id] = ['score' => $score, 'par' => $par];
        }

        // 按 group_id 分组记录 hole_scores（用于计算已完成分组数）
        if ($group_id && isset($combo['group_hole_scores'][$group_id])) {
            if (!isset($combo['group_hole_scores'][$group_id][$hole_id])) {
                $combo['group_hole_scores'][$group_id][$hole_id] = ['score' => $score, 'par' => $par];
            } else if ($score < $combo['group_hole_scores'][$group_id][$hole_id]['score']) {
                $combo['group_hole_scores'][$group_id][$hole_id] = ['score' => $score, 'par' => $par];
            }
        }
    }

    private function finalizeComboScore($combo, $total_holes) {
        $sum_score = 0;
        $sum_par = 0;
        foreach ($combo['hole_scores'] as $hole) {
            $sum_score += $hole['score'];
            $sum_par += $hole['par'];
        }

        // 计算已完成的分组数（每组打完 total_holes 洞视为完成）
        $completed_groups = 0;
        $total_groups = count($combo['group_hole_scores']);
        foreach ($combo['group_hole_scores'] as $group_holes) {
            $holes_played = count($group_holes);
            if ($total_holes > 0 && $holes_played >= $total_holes) {
                $completed_groups++;
            }
        }

        return [
            'score' => $sum_score - $sum_par,
            'thru' => $completed_groups,
            'thru_label' => $completed_groups . '组'
        ];
    }

    private function buildMatchSides($game_id, $match_format, $members) {
        if ($match_format === 'individual_match') {
            $players = array_values($members);
            if (count($players) < 2) {
                return ['error' => '分组人数不足', 'code' => 409];
            }
            if (count($players) > 2) {
                return ['error' => '比洞赛仅支持两名球员', 'code' => 409];
            }
            $left_player = $players[0];
            $right_player = $players[1];
            return [
                'left' => [
                    'user_id' => $left_player['user_id'],
                    'show_name' => $left_player['show_name'],
                    'avatar' => $left_player['avatar']
                ],
                'right' => [
                    'user_id' => $right_player['user_id'],
                    'show_name' => $right_player['show_name'],
                    'avatar' => $right_player['avatar']
                ]
            ];
        }

        $tag_map = $this->getTagMap($game_id);
        $tag_groups = [];
        foreach ($members as $member) {
            $tag_id = $member['tag_id'];
            if (!$tag_id) {
                continue;
            }
            if (!isset($tag_groups[$tag_id])) {
                $tag_info = $tag_map[$tag_id] ?? ['tag_name' => $member['tag_name'], 'tag_color' => $member['tag_color'], 'tag_order' => 0];
                $tag_groups[$tag_id] = [
                    'tag_id' => $tag_id,
                    'tag_name' => $tag_info['tag_name'],
                    'tag_color' => $tag_info['tag_color'],
                    'tag_order' => $tag_info['tag_order'],
                    'members' => []
                ];
            }
            $tag_groups[$tag_id]['members'][] = [
                'user_id' => $member['user_id'],
                'show_name' => $member['show_name'],
                'avatar' => $member['avatar']
            ];
        }

        $tags = array_values($tag_groups);
        usort($tags, function ($a, $b) {
            return ($a['tag_order'] ?? 0) <=> ($b['tag_order'] ?? 0);
        });

        if (count($tags) < 2) {
            return ['error' => '分组分队不足', 'code' => 409];
        }
        if (count($tags) > 2) {
            return ['error' => '比洞赛仅支持两方对阵', 'code' => 409];
        }

        return [
            'left' => $tags[0],
            'right' => $tags[1]
        ];
    }

    private function buildMatchResultPayload($match_result, $left, $right, $match_format) {
        if (!$match_result) {
            return ['result' => null];
        }

        $winner_side = $this->mapWinnerSide($match_result['winner_side'] ?? null, $left, $right);
        $result_text = $match_result['result_code'] ?? null;

        return [
            'result' => [
                'text' => $result_text,
                'winner_side' => $winner_side
            ]
        ];
    }

    private function mapWinnerSide($winner_side, $left, $right) {
        if (!$winner_side) {
            return null;
        }
        // DB stores up/down/draw, API expects left/right/draw
        if (in_array($winner_side, ['up', 'down', 'draw'], true)) {
            if ($winner_side === 'up') {
                return 'left';
            }
            if ($winner_side === 'down') {
                return 'right';
            }
            return 'draw';
        }
        if (in_array($winner_side, ['left', 'right', 'draw'], true)) {
            return $winner_side;
        }
        if (is_numeric($winner_side)) {
            $value = (int) $winner_side;
            if (isset($left['tag_id']) && $value === (int) $left['tag_id']) {
                return 'left';
            }
            if (isset($right['tag_id']) && $value === (int) $right['tag_id']) {
                return 'right';
            }
            if (isset($left['user_id']) && $value === (int) $left['user_id']) {
                return 'left';
            }
            if (isset($right['user_id']) && $value === (int) $right['user_id']) {
                return 'right';
            }
        }
        return null;
    }

    private function resolveMatchGroupId($game_id, $group_id) {
        if ($group_id) {
            return (int) $group_id;
        }

        $group_ids = $this->getMatchGroupIds($game_id);
        if (count($group_ids) === 1) {
            return (int) $group_ids[0];
        }
        if (count($group_ids) > 1) {
            return ['error' => '缺少[group_id]参数', 'code' => 400];
        }

        $group_ids = $this->getGameGroupIds($game_id);
        if (count($group_ids) === 1) {
            return (int) $group_ids[0];
        }
        if (count($group_ids) > 1) {
            return ['error' => 'CountOfGroupIds>1', 'code' => 400];
        }

        return ['error' => '未找到分组', 'code' => 404];
    }

    private function getMatchGroupIds($game_id) {
        $rows = $this->db->select('DISTINCT(group_id) as group_id')
            ->from('t_game_match_result')
            ->where('game_id', $game_id)
            ->get()
            ->result_array();

        return array_values(array_filter(array_map(function ($row) {
            return $row['group_id'] ?? null;
        }, $rows)));
    }

    private function getGameGroupIds($game_id) {
        $rows = $this->db->select('groupid')
            ->from('t_game_group')
            ->where('gameid', $game_id)
            ->order_by('groupid', 'ASC')
            ->get()
            ->result_array();

        return array_map(function ($row) {
            return $row['groupid'];
        }, $rows);
    }

    private function getMatchResultRow($game_id, $group_id) {
        return $this->db->where('game_id', $game_id)
            ->where('group_id', $group_id)
            ->get('t_game_match_result')
            ->row_array();
    }

    private function getGroupById($game_id, $group_id) {
        $groups = $this->getGroupsWithMembers($game_id);
        foreach ($groups as $group) {
            if ((int) $group['group_id'] === (int) $group_id) {
                return $group;
            }
        }
        return null;
    }

    private function getGroupsWithMembers($game_id) {
        $rows = $this->db->select('g.groupid, g.group_name, gu.user_id, gu.tag_id, u.display_name, u.avatar, t.tag_name, t.color')
            ->from('t_game_group g')
            ->join('t_game_group_user gu', 'g.groupid = gu.groupid', 'left')
            ->join('t_user u', 'gu.user_id = u.id', 'left')
            ->join('t_team_game_tags t', 'gu.tag_id = t.id', 'left')
            ->where('g.gameid', $game_id)
            ->order_by('g.groupid', 'ASC')
            ->order_by('gu.id', 'ASC')
            ->get()
            ->result_array();

        $groups = [];
        foreach ($rows as $row) {
            $group_id = $row['groupid'];
            if (!isset($groups[$group_id])) {
                $groups[$group_id] = [
                    'group_id' => $group_id,
                    'group_name' => $row['group_name'] ?? '',
                    'members' => []
                ];
            }
            if (!$row['user_id']) {
                continue;
            }
            $groups[$group_id]['members'][] = [
                'user_id' => $row['user_id'],
                'show_name' => $row['display_name'] ?? '',
                'avatar' => $row['avatar'] ?? '',
                'tag_id' => $row['tag_id'] ?? null,
                'tag_name' => $row['tag_name'] ?? '',
                'tag_color' => $row['color'] ?? null
            ];
        }

        return array_values($groups);
    }

    private function getPlayersFromGroups($game_id) {
        $groups = $this->getGroupsWithMembers($game_id);
        $players = [];
        foreach ($groups as $group) {
            foreach ($group['members'] as $member) {
                $players[$member['user_id']] = [
                    'show_name' => $member['show_name'],
                    'avatar' => $member['avatar']
                ];
            }
        }
        return $players;
    }

    private function getUserMap($user_ids, $existing) {
        $user_map = $existing;
        $missing_ids = array_values(array_filter($user_ids, function ($user_id) use ($user_map) {
            return !isset($user_map[$user_id]);
        }));

        if (empty($missing_ids)) {
            return $user_map;
        }

        $rows = $this->db->select('id, display_name, avatar')
            ->from('t_user')
            ->where_in('id', $missing_ids)
            ->get()
            ->result_array();

        foreach ($rows as $row) {
            $user_map[$row['id']] = [
                'show_name' => $row['display_name'] ?? '',
                'avatar' => $row['avatar'] ?? ''
            ];
        }

        return $user_map;
    }

    private function getPlayerScoreStats($game_id) {
        $rows = $this->db->select('user_id, SUM(IF(score > 0, score, 0)) as total_score, SUM(IF(score > 0, IFNULL(par, 0), 0)) as total_par, COUNT(DISTINCT IF(score > 0, hole_id, NULL)) as holes_played')
            ->from('t_game_score')
            ->where('gameid', $game_id)
            ->group_by('user_id')
            ->get()
            ->result_array();

        $stats = [];
        foreach ($rows as $row) {
            $score = (int) $row['total_score'] - (int) $row['total_par'];
            $stats[$row['user_id']] = [
                'score' => $score,
                'thru' => (int) $row['holes_played']
            ];
        }

        return $stats;
    }

    private function getScoreRows($game_id) {
        return $this->db->select('group_id, user_id, hole_id, score, par')
            ->from('t_game_score')
            ->where('gameid', $game_id)
            ->where('score >', 0)
            ->get()
            ->result_array();
    }

    private function getTagMap($game_id) {
        $rows = $this->db->select('id, tag_name, color, tag_order')
            ->from('t_team_game_tags')
            ->where('game_id', $game_id)
            ->order_by('tag_order', 'ASC')
            ->get()
            ->result_array();

        $map = [];
        foreach ($rows as $row) {
            $map[$row['id']] = [
                'tag_name' => $row['tag_name'],
                'tag_color' => $row['color'] ?? null,
                'tag_order' => $row['tag_order'] ?? 0
            ];
        }

        return $map;
    }

    private function formatThruLabel($thru, $total_holes) {
        if ($total_holes > 0 && $thru >= $total_holes) {
            return 'F';
        }
        return (string) $thru;
    }

    private function applyRanking($rows) {
        usort($rows, function ($a, $b) {
            if ($a['score'] === $b['score']) {
                return ($b['thru'] ?? 0) <=> ($a['thru'] ?? 0);
            }
            return $a['score'] <=> $b['score'];
        });

        $score_counts = [];
        foreach ($rows as $row) {
            $key = (string) $row['score'];
            $score_counts[$key] = ($score_counts[$key] ?? 0) + 1;
        }

        $last_score = null;
        $last_rank = 0;
        foreach ($rows as $index => &$row) {
            if ($row['score'] === $last_score) {
                $rank = $last_rank;
            } else {
                $rank = $index + 1;
                $last_score = $row['score'];
                $last_rank = $rank;
            }
            $row['rank'] = $rank;
            $score_key = (string) $row['score'];
            $row['rank_label'] = ($score_counts[$score_key] ?? 0) > 1 ? 'T' . $rank : (string) $rank;
        }
        unset($row);

        return $rows;
    }

    private function getTotalHoles($game_id, $hole_list) {
        if ($hole_list) {
            $decoded = json_decode($hole_list, true);
            if (is_array($decoded) && count($decoded) > 0) {
                return count($decoded);
            }
        }

        $court_count = $this->db->where('gameid', $game_id)->count_all_results('t_game_court');
        if ($court_count === 1) {
            return 9;
        }
        if ($court_count > 1) {
            return 18;
        }
        return 0;
    }

    private function isMatchFormat($match_format) {
        if (!$match_format) {
            return false;
        }
        return strpos($match_format, '_match') !== false;
    }

    private function isTagStrokeFormat($match_format) {
        return in_array($match_format, [
            'fourball_bestball_stroke',
            'fourball_scramble_stroke',
            'foursome_stroke'
        ], true);
    }

    private function getGameRow($game_id) {
        return $this->db->select('id, game_type, match_format, holeList')
            ->from('t_game')
            ->where('id', $game_id)
            ->get()
            ->row_array();
    }

    private function readJsonBody() {
        $payload = json_decode(file_get_contents('php://input'), true);
        return is_array($payload) ? $payload : [];
    }

    private function respondOk($data) {
        echo json_encode([
            'code' => 200,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);
    }

    private function respondError($code, $message) {
        echo json_encode([
            'code' => $code,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
    }
}
