<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * MScoreboard Model
 *
 * Handles scoreboard data retrieval and calculations for golf games.
 * Supports multiple match formats:
 * - Stroke play: individual_stroke, fourball_bestball_stroke, fourball_scramble_stroke, foursome_stroke
 * - Match play: individual_match, fourball_bestball_match, fourball_scramble_match, foursome_match
 *
 * This model contains three main categories of methods:
 * 1. Database Query Methods: Pure data retrieval from database tables
 * 2. Business Logic Methods: Calculations, transformations, and match result computations
 * 3. Data Transformation Methods: Complex data structuring and aggregation
 *
 * @package    Golf_Jianghu
 * @subpackage Models
 * @category   Scoreboard
 */
class MScoreboard extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    // ============================================
    // Database Query Methods
    // ============================================

    /**
     * Get all scores indexed by group, user, and hole
     *
     * @param int $game_id Game ID
     * @return array Indexed score structure [group_id][user_id][hindex] = score
     */
    public function getScoresIndexByGameId($game_id) {
        $rows = $this->db->select('group_id, user_id, hindex, score')
            ->from('t_game_score')
            ->where('gameid', $game_id)
            ->where('score >', 0)
            ->where('hindex IS NOT NULL')
            ->where('hindex >', 0)
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

    /**
     * Get match result rows mapped by group ID
     *
     * @param int $game_id Game ID
     * @return array Map of group_id => match_result_row
     */
    public function getMatchResultRowsMap($game_id) {
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

    /**
     * Get distinct group IDs from match results
     *
     * @param int $game_id Game ID
     * @return array Array of group IDs
     */
    public function getMatchGroupIds($game_id) {
        $rows = $this->db->select('DISTINCT(group_id) as group_id')
            ->from('t_game_match_result')
            ->where('game_id', $game_id)
            ->get()
            ->result_array();

        return array_values(array_filter(array_map(function ($row) {
            return $row['group_id'] ?? null;
        }, $rows)));
    }

    /**
     * Get group IDs from game groups table
     *
     * @param int $game_id Game ID
     * @return array Array of group IDs
     */
    public function getGameGroupIds($game_id) {
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

    /**
     * Get single match result row for a specific group
     *
     * @param int $game_id Game ID
     * @param int $group_id Group ID
     * @return array|null Match result row or null
     */
    public function getMatchResultRow($game_id, $group_id) {
        return $this->db->where('game_id', $game_id)
            ->where('group_id', $group_id)
            ->get('t_game_match_result')
            ->row_array();
    }

    /**
     * Get all groups with their members for a game
     *
     * @param int $game_id Game ID
     * @return array Array of groups with members
     */
    public function getGroupsWithMembers($game_id) {
        $rows = $this->db->select('g.groupid, g.group_name, gu.user_id, gu.tag_id, gu.combo_id, u.display_name, u.avatar, t.tag_name, t.color')
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
                'tag_color' => $row['color'] ?? null,
                'combo_id' => $row['combo_id'] ?? null
            ];
        }

        return array_values($groups);
    }

    /**
     * Get user information map, filling in missing users from database
     *
     * @param array $user_ids Array of user IDs to fetch
     * @param array $existing Existing user data to merge with
     * @return array Map of user_id => ['show_name', 'avatar']
     */
    public function getUserMap($user_ids, $existing) {
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

    /**
     * Get aggregated player score statistics
     *
     * @param int $game_id Game ID
     * @return array Map of user_id => ['score', 'thru']
     */
    public function getPlayerScoreStats($game_id) {
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

    /**
     * Get all score rows for a game
     *
     * @param int $game_id Game ID
     * @return array Array of score rows
     */
    public function getScoreRows($game_id) {
        return $this->db->select('group_id, user_id, hole_id, score, par')
            ->from('t_game_score')
            ->where('gameid', $game_id)
            ->where('score >', 0)
            ->get()
            ->result_array();
    }

    /**
     * Get tag map for a game
     *
     * @param int $game_id Game ID
     * @return array Map of tag_id => ['tag_name', 'tag_color', 'tag_order']
     */
    public function getTagMap($game_id) {
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

    /**
     * Get total holes for a game from holeList or court count
     *
     * @param int $game_id Game ID
     * @param string|null $hole_list JSON encoded hole list
     * @return int Total number of holes
     */
    public function getTotalHoles($game_id, $hole_list) {
        if ($hole_list) {
            $decoded = json_decode($hole_list, true);
            if (is_array($decoded) && count($decoded) > 0) {
                return count($decoded);
            }
        }

        $court_count = (int) $this->db->where('gameid', $game_id)->count_all_results('t_game_court');
        if ($court_count === 1) {
            return 9;
        }
        if ($court_count > 1) {
            return 18;
        }
        return 0;
    }

    /**
     * Get game row by ID
     *
     * @param int $game_id Game ID
     * @return array|null Game row or null
     */
    public function getGameRow($game_id) {
        return $this->db->select('id, game_type, match_format, holeList, top_n_ranking')
            ->from('t_game')
            ->where('id', $game_id)
            ->get()
            ->row_array();
    }

    /**
     * Get ordered tags for a game
     *
     * @param int $game_id Game ID
     * @return array Array of tags ordered by tag_order
     */
    public function getOrderedTags($game_id) {
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

    /**
     * Get count of tags for a game
     *
     * @param int $game_id Game ID
     * @return int Number of tags
     */
    public function getTagCount($game_id) {
        $tag_map = $this->getTagMap($game_id);
        return count($tag_map);
    }

    // ============================================
    // Business Logic Methods
    // ============================================

    /**
     * Compute match result from scores
     *
     * @param string $match_format Match format type
     * @param int $group_id Group ID
     * @param array $members Group members
     * @param array $left Left side data
     * @param array $right Right side data
     * @param array $score_index Score index structure
     * @param int $total_holes Total holes in game
     * @return array|null Match result row or null
     */
    public function computeMatchResultRowFromScores($match_format, $group_id, $members, $left, $right, $score_index, $total_holes) {
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

    /**
     * Build computed match row from wins and holes data
     *
     * @param int $left_wins Number of holes won by left side
     * @param int $right_wins Number of holes won by right side
     * @param int $holes_played Number of holes played
     * @param int $holes_remaining Number of holes remaining
     * @param bool $finished Whether match is finished
     * @return array Match result row
     */
    public function buildComputedMatchRow($left_wins, $right_wins, $holes_played, $holes_remaining, $finished) {
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

    /**
     * Get best score for a side on a specific hole
     *
     * @param array $score_index Score index structure
     * @param int $group_id Group ID
     * @param array $user_ids User IDs for this side
     * @param int $hindex Hole index
     * @return int|null Best score or null
     */
    public function getSideHoleScore($score_index, $group_id, $user_ids, $hindex) {
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
            if ($score === null) {
                continue;
            }
            $score = (int) $score;
            if ($best === null || $score < $best) {
                $best = $score;
            }
        }
        return $best;
    }

    /**
     * Resolve user IDs for a match side
     *
     * @param string $match_format Match format type
     * @param array $members Group members
     * @param array $side Side data (tag or user)
     * @param string $side_name Side name ('left' or 'right')
     * @return array Array of user IDs
     */
    public function resolveSideUserIds($match_format, $members, $side, $side_name) {
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

    /**
     * Apply ranking to rows based on score and thru
     *
     * @param array $rows Array of rows with 'score' and 'thru' fields
     * @return array Ranked rows with 'rank' and 'rank_label' fields added
     */
    public function applyRanking($rows) {
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

    /**
     * Format thru label (F for finished, number otherwise)
     *
     * @param int $thru Holes played
     * @param int $total_holes Total holes in game
     * @return string Formatted label
     */
    public function formatThruLabel($thru, $total_holes) {
        if ($total_holes > 0 && $thru >= $total_holes) {
            return 'F';
        }
        return (string) $thru;
    }

    /**
     * Build tag combinations for stroke play
     *
     * @param array $groups Groups with members
     * @param array $tag_map Tag information map
     * @param string $row_type Row type ('tag' or 'combo')
     * @return array ['rows' => combo rows, 'user_combo_map' => user to combo mapping]
     */
    public function buildTagCombinations($groups, $tag_map, $row_type = 'tag') {
        $rows = [];
        $user_combo_map = [];
        $is_combo_mode = ($row_type === 'combo');

        foreach ($groups as $group) {
            foreach ($group['members'] as $member) {
                $tag_id = $member['tag_id'];
                $combo_id = $member['combo_id'] ?? null;
                $group_id = $group['group_id'];

                // 生成 combo_key：combo模式用虚拟tag, tag模式用真实tag_id
                if ($is_combo_mode && $combo_id) {
                    // Combo模式：group_id + combo_id 作为虚拟tag
                    $combo_key = 'combo_' . $group_id . '_' . $combo_id;
                } else {
                    // Tag模式：使用tag_id
                    if (!$tag_id) {
                        continue;
                    }
                    $combo_key = (string) $tag_id;
                }

                // 初始化行数据
                if (!isset($rows[$combo_key])) {
                    if ($is_combo_mode) {
                        // Combo模式：使用 combo_id, group_id, group_name
                        $rows[$combo_key] = [
                            'row' => [
                                'combo_id' => $combo_id,
                                'group_id' => $group_id,
                                'group_name' => $group['group_name'],
                                'members' => []
                            ],
                            'hole_scores' => [],
                            'group_hole_scores' => [$group_id => []],
                            'group_members' => [$group_id => []]
                        ];
                    } else {
                        // Tag模式：使用 tag_id, tag_name, tag_color, groups
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
                            'group_hole_scores' => [],
                            'group_members' => []
                        ];
                    }
                }

                // Tag模式：记录group信息
                if (!$is_combo_mode) {
                    if (!in_array($group_id, array_keys($rows[$combo_key]['group_hole_scores'] ?? []))) {
                        $rows[$combo_key]['row']['groups'][] = [
                            'group_id' => $group_id,
                            'group_name' => $group['group_name']
                        ];
                        $rows[$combo_key]['group_hole_scores'][$group_id] = [];
                        $rows[$combo_key]['group_members'][$group_id] = [];
                    }
                }

                // 添加成员
                $rows[$combo_key]['group_members'][$group_id][] = [
                    'user_id' => $member['user_id'],
                    'show_name' => $member['show_name'],
                    'avatar' => $member['avatar']
                ];
                $rows[$combo_key]['row']['members'][] = [
                    'user_id' => $member['user_id'],
                    'show_name' => $member['show_name'],
                    'avatar' => $member['avatar']
                ];

                $user_combo_map[$group_id . ':' . $member['user_id']] = $combo_key;
            }
        }

        return [
            'rows' => $rows,
            'user_combo_map' => $user_combo_map
        ];
    }

    /**
     * Update combo score with a score row
     *
     * @param array $combo Combo data (passed by reference)
     * @param array $score_row Score row
     * @return void
     */
    public function updateComboScore(&$combo, $score_row) {
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

    /**
     * Finalize combo score and calculate rankings
     *
     * @param array $combo Combo data
     * @param int $total_holes Total holes in game
     * @return array Score summary with combos
     */
    public function finalizeComboScore($combo, $total_holes) {
        // 计算已完成的分组数，并构建每个分组的组合详情
        $completed_groups = 0;
        $combos = [];
        $total_score_sum = 0;  // 总分 = 各组分数之和
        $total_holes_played = 0;  // 总洞数 = 各组已打洞数之和

        foreach ($combo['group_hole_scores'] as $group_id => $group_holes) {
            $holes_played = count($group_holes);
            $is_finished = $total_holes > 0 && $holes_played >= $total_holes;
            if ($is_finished) {
                $completed_groups++;
            }

            // 计算该分组的成绩
            $group_score = 0;
            $group_par = 0;
            foreach ($group_holes as $hole) {
                $group_score += $hole['score'];
                $group_par += $hole['par'];
            }

            $group_score_diff = $group_score - $group_par;
            $total_score_sum += $group_score_diff;  // 累加各组分数
            $total_holes_played += $holes_played;  // 累加各组已打洞数

            // 获取该分组的成员和名称
            $group_members = $combo['group_members'][$group_id] ?? [];
            $group_info = null;

            // Combo模式直接从 row 获取，Tag模式从 groups 数组查找
            if (isset($combo['row']['combo_id'])) {
                // Combo模式：row 中已有 group_id 和 group_name
                $group_info = [
                    'group_id' => $combo['row']['group_id'],
                    'group_name' => $combo['row']['group_name']
                ];
            } else {
                // Tag模式：从 groups 数组查找
                $groups = $combo['row']['groups'] ?? [];
                foreach ($groups as $g) {
                    if ($g['group_id'] == $group_id) {
                        $group_info = $g;
                        break;
                    }
                }
            }

            $combos[] = [
                'group_id' => (int) $group_id,
                'group_name' => $group_info['group_name'] ?? '',
                'members' => $group_members,
                'score' => $group_score_diff,
                'thru' => $holes_played,
                'thru_label' => $is_finished ? 'F' : (string) $holes_played,
                'rank' => 0,  // 稍后计算
                'rank_label' => ''
            ];
        }

        // 对 combos 按 score 排序并分配排名
        usort($combos, function ($a, $b) {
            return $a['score'] - $b['score'];
        });
        $rank = 0;
        $prev_score = null;
        $same_rank_count = 0;
        foreach ($combos as $idx => &$c) {
            if ($prev_score === null || $c['score'] !== $prev_score) {
                $rank = $idx + 1;
                $same_rank_count = 1;
            } else {
                $same_rank_count++;
            }
            $c['rank'] = $rank;
            $c['rank_label'] = $same_rank_count > 1 || ($idx > 0 && $combos[$idx - 1]['score'] === $c['score'])
                ? 'T' . $rank
                : (string) $rank;
            $prev_score = $c['score'];
        }
        unset($c);

        return [
            'score' => $total_score_sum,  // 修改：使用各组分数之和
            'thru' => $total_holes_played,  // 修改：使用总洞数
            'thru_label' => $total_holes_played > 0 ? (string) $total_holes_played : '0',
            'combos' => $combos
        ];
    }

    /**
     * Resolve combo key from user combo map
     *
     * @param array $user_combo_map User to combo mapping
     * @param array $score_row Score row
     * @return string|null Combo key or null
     */
    public function resolveComboKey($user_combo_map, $score_row) {
        $group_id = $score_row['group_id'];
        $user_id = $score_row['user_id'];
        if (!$group_id || !$user_id) {
            return null;
        }
        return $user_combo_map[$group_id . ':' . $user_id] ?? null;
    }

    /**
     * Fill missing match result fields with fallback values
     *
     * @param array|null $match_result Stored match result
     * @param array|null $fallback Computed fallback values
     * @return array|null Merged result
     */
    public function fillMissingMatchResultFields($match_result, $fallback) {
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

    /**
     * Build match sides (left/right) for match play
     *
     * @param int $game_id Game ID
     * @param string $match_format Match format type
     * @param array $members Group members
     * @return array Left and right sides or error
     */
    public function buildMatchSides($game_id, $match_format, $members) {
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

    /**
     * Build match result payload for API response
     *
     * @param array|null $match_result Match result data
     * @param array $left Left side data
     * @param array $right Right side data
     * @param string $match_format Match format type
     * @return array Result payload
     */
    public function buildMatchResultPayload($match_result, $left, $right, $match_format) {
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

    /**
     * Map winner side from database format to API format
     *
     * @param mixed $winner_side Winner side value from database
     * @param array $left Left side data
     * @param array $right Right side data
     * @return string|null Mapped winner side ('left', 'right', 'draw', or null)
     */
    public function mapWinnerSide($winner_side, $left, $right) {
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

    /**
     * Build individual match sides for summary mode
     *
     * @param array $members Group members
     * @param array $left_tag Left tag info
     * @param array $right_tag Right tag info
     * @return array Left and right sides or error
     */
    public function buildIndividualMatchSidesForSummary($members, $left_tag, $right_tag) {
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

    // ============================================
    // Data Transformation Methods
    // ============================================

    /**
     * Try to build G1 team + player combined data structure
     *
     * @param int $game_id Game ID
     * @param array $game Game row
     * @param int $total_holes Total holes
     * @return array|null Combined data or null if not applicable
     */
    public function tryBuildG1TeamPlayerData($game_id, $game, $total_holes) {
        // Require at least 2 tags with members
        $tag_members = $this->getTagMembersFromGroups($game_id);
        if (count($tag_members) < 2) {
            return null;
        }

        $n = isset($game['top_n_ranking']) && $game['top_n_ranking'] ? (int) $game['top_n_ranking'] : null;
        if (!$n) {
            $min_size = null;
            foreach ($tag_members as $tag) {
                $size = count($tag['user_ids']);
                if ($min_size === null || $size < $min_size) {
                    $min_size = $size;
                }
            }
            $n = (int) ($min_size ?? 0);
        }
        if ($n <= 0) {
            // No valid N to compute teams
            return null;
        }

        $player_rows = $this->buildG1PlayerRowsWithTag($game_id, $total_holes);
        $player_score_map = [];
        $player_thru_map = [];
        foreach ($player_rows as $row) {
            $uid = (int) ($row['user_id'] ?? 0);
            if (!$uid) {
                continue;
            }
            $player_score_map[$uid] = (int) ($row['score'] ?? 0);
            $player_thru_map[$uid] = (int) ($row['thru'] ?? 0);
        }

        $team_rows = [];
        foreach ($tag_members as $tag_id => $tag_info) {
            $team_size = count($tag_info['user_ids']);
            $forfeit = $team_size < $n;

            $team_score = null;
            if (!$forfeit) {
                $candidates = [];
                foreach ($tag_info['user_ids'] as $uid) {
                    $candidates[] = [
                        'user_id' => $uid,
                        'score' => $player_score_map[$uid] ?? 0,
                        'thru' => $player_thru_map[$uid] ?? 0
                    ];
                }
                usort($candidates, function ($a, $b) {
                    if ((int) $a['score'] === (int) $b['score']) {
                        return ((int) $b['thru']) <=> ((int) $a['thru']);
                    }
                    return ((int) $a['score']) <=> ((int) $b['score']);
                });
                $top = array_slice($candidates, 0, $n);
                $sum = 0;
                foreach ($top as $p) {
                    $sum += (int) $p['score'];
                }
                $team_score = $sum;
            }

            $team_rows[] = [
                'tag_id' => (int) $tag_id,
                'tag_name' => $tag_info['tag_name'] ?? '',
                'tag_color' => $tag_info['tag_color'] ?? null,
                'score' => $forfeit ? PHP_INT_MAX : (int) $team_score,
                'valid_n' => (int) $n,
                'forfeit' => $forfeit
            ];
        }

        // Sort teams: forfeit last, then score asc
        usort($team_rows, function ($a, $b) {
            $af = !empty($a['forfeit']);
            $bf = !empty($b['forfeit']);
            if ($af !== $bf) {
                return $af ? 1 : -1;
            }
            return ((int) $a['score']) <=> ((int) $b['score']);
        });

        // Rank non-forfeit teams, then put forfeits at last rank
        $non_forfeit = array_values(array_filter($team_rows, function ($r) {
            return empty($r['forfeit']);
        }));
        $forfeits = array_values(array_filter($team_rows, function ($r) {
            return !empty($r['forfeit']);
        }));

        $ranked_non_forfeit = $this->applyRanking(array_map(function ($r) {
            return array_merge($r, ['thru' => 0]);
        }, $non_forfeit));

        $ranked_forfeits = [];
        if (!empty($forfeits)) {
            $last_rank = count($ranked_non_forfeit) + 1;
            $label = count($forfeits) > 1 ? ('T' . $last_rank) : (string) $last_rank;
            foreach ($forfeits as $r) {
                $r['rank'] = $last_rank;
                $r['rank_label'] = $label;
                $ranked_forfeits[] = $r;
            }
        }

        $ranked_team_rows = array_merge($ranked_non_forfeit, $ranked_forfeits);

        return [
            'mode' => 'team_player',
            'team' => [
                'row_type' => 'tag',
                'n' => (int) $n,
                'rows' => $ranked_team_rows
            ],
            'player' => [
                'row_type' => 'player',
                'rows' => $player_rows
            ]
        ];
    }

    /**
     * Get tag members from groups
     *
     * @param int $game_id Game ID
     * @return array Map of tag_id => tag info with user_ids
     */
    public function getTagMembersFromGroups($game_id) {
        $groups = $this->getGroupsWithMembers($game_id);
        $tag_members = [];
        foreach ($groups as $group) {
            foreach (($group['members'] ?? []) as $m) {
                $tag_id = isset($m['tag_id']) ? (int) $m['tag_id'] : 0;
                $user_id = isset($m['user_id']) ? (int) $m['user_id'] : 0;
                if (!$tag_id || !$user_id) {
                    continue;
                }
                if (!isset($tag_members[$tag_id])) {
                    $tag_members[$tag_id] = [
                        'tag_id' => $tag_id,
                        'tag_name' => $m['tag_name'] ?? '',
                        'tag_color' => $m['tag_color'] ?? null,
                        'user_ids' => []
                    ];
                }
                $tag_members[$tag_id]['user_ids'][$user_id] = $user_id;
            }
        }
        // normalize user_ids to indexed list and keep only tags with members
        foreach ($tag_members as $tag_id => &$info) {
            $info['user_ids'] = array_values($info['user_ids']);
        }
        unset($info);
        return $tag_members;
    }

    /**
     * Build G1 player rows with tag information
     *
     * @param int $game_id Game ID
     * @param int $total_holes Total holes
     * @return array Ranked player rows with tag info
     */
    public function buildG1PlayerRowsWithTag($game_id, $total_holes) {
        $score_stats = $this->getPlayerScoreStats($game_id);
        $groups = $this->getGroupsWithMembers($game_id);

        $players = [];
        $user_tag_map = [];
        foreach ($groups as $group) {
            foreach (($group['members'] ?? []) as $member) {
                $uid = (int) ($member['user_id'] ?? 0);
                if (!$uid) {
                    continue;
                }
                $players[$uid] = [
                    'show_name' => $member['show_name'] ?? '',
                    'avatar' => $member['avatar'] ?? ''
                ];
                if (!isset($user_tag_map[$uid]) && isset($member['tag_id'])) {
                    $user_tag_map[$uid] = [
                        'tag_id' => $member['tag_id'] ?? null,
                        'tag_name' => $member['tag_name'] ?? '',
                        'tag_color' => $member['tag_color'] ?? null
                    ];
                }
            }
        }

        $player_ids = array_unique(array_merge(array_keys($score_stats), array_keys($players)));
        $user_map = $this->getUserMap($player_ids, $players);

        $rows = [];
        foreach ($player_ids as $user_id) {
            $stats = $score_stats[$user_id] ?? ['score' => 0, 'thru' => 0];
            $user = $user_map[$user_id] ?? ['show_name' => '', 'avatar' => ''];
            $thru_label = $this->formatThruLabel($stats['thru'], $total_holes);
            $tag = $user_tag_map[$user_id] ?? ['tag_id' => null, 'tag_name' => '', 'tag_color' => null];
            $rows[] = [
                'user_id' => $user_id,
                'show_name' => $user['show_name'],
                'avatar' => $user['avatar'],
                'score' => $stats['score'],
                'thru' => $stats['thru'],
                'thru_label' => $thru_label,
                'tag_id' => $tag['tag_id'],
                'tag_name' => $tag['tag_name'],
                'tag_color' => $tag['tag_color']
            ];
        }

        return $this->applyRanking($rows);
    }

    /**
     * Try to build match play summary data
     *
     * @param int $game_id Game ID
     * @param string $match_format Match format type
     * @param string $game_type Game type
     * @param int $total_holes Total holes
     * @return array|null Summary data or null if not applicable
     */
    public function tryBuildMatchPlaySummaryData($game_id, $match_format, $game_type, $total_holes) {
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

    /**
     * Build match play summary data
     *
     * @param int $game_id Game ID
     * @param string $match_format Match format type
     * @param string $game_type Game type
     * @param int $total_holes Total holes
     * @return array Summary data with points and matches
     */
    public function buildMatchPlaySummaryData($game_id, $match_format, $game_type, $total_holes) {
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

    /**
     * Build stroke play data structure
     *
     * @param int $game_id Game ID
     * @param string $match_format Match format type
     * @param string $game_type Game type
     * @param int $total_holes Total holes
     * @return array Stroke play data
     */
    public function buildStrokePlayData($game_id, $match_format, $game_type, $total_holes) {
        $row_type = $this->isTagStrokeFormat($match_format) ? 'tag' : 'player';

        if ($row_type === 'player') {
            $player_rows = $this->buildPlayerRows($game_id, $total_holes);
            return [
                'row_type' => $row_type,
                'rows' => $player_rows
            ];
        }

        // For G2/G3/G4, check tag count: 1 tag -> combo mode, >=2 tags -> tag mode
        if ($this->isTagStrokeFormat($match_format)) {
            $tag_count = $this->getTagCount($game_id);
            if ($tag_count === 1) {
                $row_type = 'combo';
            }
        }

        $tag_rows = $this->buildTagRows($game_id, $total_holes, $row_type);
        return [
            'row_type' => $row_type,
            'rows' => $tag_rows
        ];
    }

    /**
     * Build match play data structure
     *
     * @param int $game_id Game ID
     * @param int|null $group_id Group ID
     * @param string $match_format Match format type
     * @param string $game_type Game type
     * @param int $total_holes Total holes
     * @return array Match play data or error
     */
    public function buildMatchPlayData($game_id, $group_id, $match_format, $game_type, $total_holes) {
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

    /**
     * Build player rows for stroke play
     *
     * @param int $game_id Game ID
     * @param int $total_holes Total holes
     * @return array Ranked player rows
     */
    public function buildPlayerRows($game_id, $total_holes) {
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

    /**
     * Build tag rows for stroke play
     *
     * @param int $game_id Game ID
     * @param int $total_holes Total holes
     * @param string $row_type Row type ('tag' or 'combo')
     * @return array Ranked tag/combo rows
     */
    public function buildTagRows($game_id, $total_holes, $row_type = 'tag') {
        $groups = $this->getGroupsWithMembers($game_id);
        $tag_map = $this->getTagMap($game_id);
        $combos = $this->buildTagCombinations($groups, $tag_map, $row_type);
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

    /**
     * Resolve match group ID from provided ID or auto-select
     *
     * @param int $game_id Game ID
     * @param int|null $group_id Provided group ID
     * @return int|array Group ID or error array
     */
    public function resolveMatchGroupId($game_id, $group_id) {
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

    /**
     * Get specific group by ID
     *
     * @param int $game_id Game ID
     * @param int $group_id Group ID
     * @return array|null Group data or null
     */
    public function getGroupById($game_id, $group_id) {
        $groups = $this->getGroupsWithMembers($game_id);
        foreach ($groups as $group) {
            if ((int) $group['group_id'] === (int) $group_id) {
                return $group;
            }
        }
        return null;
    }

    /**
     * Get players from all groups
     *
     * @param int $game_id Game ID
     * @return array Map of user_id => player info
     */
    public function getPlayersFromGroups($game_id) {
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

    /**
     * Check if match format is a match play format
     *
     * @param string|null $match_format Match format
     * @return bool True if match play format
     */
    public function isMatchFormat($match_format) {
        if (!$match_format) {
            return false;
        }
        return strpos($match_format, '_match') !== false;
    }

    /**
     * Check if match format is a tag-based stroke format
     *
     * @param string|null $match_format Match format
     * @return bool True if tag stroke format
     */
    public function isTagStrokeFormat($match_format) {
        return in_array($match_format, [
            'fourball_bestball_stroke',
            'fourball_scramble_stroke',
            'foursome_stroke'
        ], true);
    }

}
