<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * 球队赛事模型（队内赛 + 队际赛统一模型）
 * 封装队内赛和队际赛相关的数据库操作
 *
 * 统一模型说明：
 * - 使用 t_team_game_tags 表存储分队信息
 * - 队内赛：team_id = NULL，tag_name 为临时队名（如：东邪队、西毒队）
 * - 队际赛：team_id 指向真实球队，tag_name 为球队简称
 */
class MTeamGame extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    // ========== 权限校验 ==========

    /**
     * 检查用户是否为球队管理员（owner/admin）
     */
    public function isTeamAdmin($team_id, $user_id) {
        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'active'
        ])->row_array();

        if (!$member) {
            return false;
        }

        return in_array($member['role'], ['owner', 'admin']);
    }

    /**
     * 检查用户是否为球队成员
     */
    public function isTeamMember($team_id, $user_id) {
        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'active'
        ])->row_array();

        return !empty($member);
    }

    /**
     * 检查用户是否为赛事管理员
     */
    public function isGameAdmin($game_id, $user_id) {
        $game = $this->db->get_where('t_game', ['id' => $game_id])->row_array();
        if (!$game) {
            return false;
        }

        // 创建者有管理权限
        if ($game['creatorid'] == $user_id) {
            return true;
        }

        // 球队管理员有管理权限
        if ($game['team_id']) {
            return $this->isTeamAdmin($game['team_id'], $user_id);
        }

        return false;
    }

    // ========== 赛事创建与配置 ==========

    /**
     * 创建队内赛
     */
    public function createTeamGame($data) {
        $row = [
            'uuid' => $data['uuid'] ?? $this->generateUUID(),
            'team_id' => $data['team_id'],
            'creatorid' => $data['creator_id'],
            'name' => $data['name'],
            'courseid' => $data['courseid'] ?? null,
            'match_format' => $data['match_format'],
            'open_time' => $data['open_time'] ?? null,
            'registration_deadline' => $data['registration_deadline'] ?? null,
            'entry_fee' => $data['entry_fee'] ?? 0,
            'awards' => $data['awards'] ?? null,
            'schedule' => $data['schedule'] ?? null,
            'grouping_permission' => $data['grouping_permission'] ?? 'admin',
            'is_public_registration' => $data['is_public_registration'] ?? 'y',
            'top_n_ranking' => $data['top_n_ranking'] ?? null,
            'game_type' => 'single_team',
            'game_status' => 'init',
            'create_time' => date('Y-m-d H:i:s'),
            'scoring_type' => $this->getScoringTypeFromFormat($data['match_format'])
        ];

        $this->db->insert('t_game', $row);
        return $this->db->insert_id();
    }

    /**
     * 更新队内赛信息
     */
    public function updateTeamGame($game_id, $data) {
        $allowedFields = ['name', 'courseid', 'match_format', 'open_time', 'registration_deadline', 'entry_fee', 'awards', 'schedule', 'grouping_permission', 'is_public_registration', 'top_n_ranking'];
        $updateData = [];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }

        if (!empty($updateData)) {
            $this->db->where('id', $game_id);
            $this->db->update('t_game', $updateData);
        }

        return true;
    }

    /**
     * 获取队内赛基本信息
     */
    public function getTeamGame($game_id) {
        return $this->db->get_where('t_game', ['id' => $game_id])->row_array();
    }

    /**
     * 根据赛制类型获取计分类型
     */
    private function getScoringTypeFromFormat($match_format) {
        // 比洞赛
        if (strpos($match_format, '_match') !== false) {
            return 'match';
        }
        // 旺波（最佳球位）
        if (strpos($match_format, 'oneball') !== false) {
            return 'oneball';
        }
        return 'hole';
    }

    /**
     * 生成UUID
     */
    private function generateUUID() {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }

    // ========== 分队管理 ==========

    /**
     * 添加分队
     */
    public function addGameTag($game_id, $tag_name, $color = null) {
        // 获取当前最大排序号
        $maxOrder = $this->db->select_max('tag_order')
            ->where('game_id', $game_id)
            ->get('t_team_game_tags')
            ->row_array();
        $order = ($maxOrder['tag_order'] ?? 0) + 1;

        $this->db->insert('t_team_game_tags', [
            'game_id' => $game_id,
            'tag_name' => $tag_name,
            'tag_order' => $order,
            'color' => $color,
            'create_time' => date('Y-m-d H:i:s')
        ]);

        return $this->db->insert_id();
    }

    /**
     * 更新分队
     */
    public function updateTeamGameTag($tag_id, $data) {
        $updateData = [];
        if (isset($data['tag_name'])) {
            $updateData['tag_name'] = $data['tag_name'];
        }
        if (isset($data['color'])) {
            $updateData['color'] = $data['color'];
        }
        if (isset($data['tag_order'])) {
            $updateData['tag_order'] = $data['tag_order'];
        }

        if (!empty($updateData)) {
            $this->db->where('id', $tag_id);
            $this->db->update('t_team_game_tags', $updateData);
        }

        return true;
    }

    /**
     * 删除分队
     */
    public function deleteGameTag($tag_id) {
        $this->db->where('id', $tag_id);
        $this->db->delete('t_team_game_tags');
        return $this->db->affected_rows() > 0;
    }

    /**
     * 获取分队列表
     */
    public function getGameTags($game_id) {
        return $this->db->where('game_id', $game_id)
            ->order_by('tag_order', 'ASC')
            ->get('t_team_game_tags')
            ->result_array();
    }

    /**
     * 获取TAG信息
     */
    public function getTeamGameTag($tag_id) {
        return $this->db->get_where('t_team_game_tags', ['id' => $tag_id])->row_array();
    }

    /**
     * 获取赛事分队数量
     */
    public function getTagsCount($game_id) {
        return $this->db->where('game_id', $game_id)
            ->count_all_results('t_team_game_tags');
    }

    // ========== 报名管理 ==========

    /**
     * 球员报名（直接加入某个TAG）
     */
    public function registerGame($game_id, $user_id, $tag_id = null, $remark = null) {
        // 必须选择分队
        if (!$tag_id) {
            return ['success' => false, 'message' => '请选择分队'];
        }

        // 检查是否已报名
        $existing = $this->db->get_where('t_game_tag_member', [
            'game_id' => $game_id,
            'user_id' => $user_id
        ])->row_array();

        if ($existing) {
            return ['success' => false, 'message' => '您已报名此赛事'];
        }

        // 检查是否公开报名
        $game = $this->getTeamGame($game_id);
        if ($game['is_public_registration'] == 'n') {
            return ['success' => false, 'message' => '该赛事未开放公开报名'];
        }

        // 加入分队成员表
        $this->addMemberToTag($tag_id, $user_id, $game_id);

        return [
            'success' => true,
            'message' => '报名成功'
        ];
    }

    /**
     * 取消报名
     */
    public function cancelRegistration($game_id, $user_id) {
        // 从分队成员表中删除
        $this->db->where([
            'game_id' => $game_id,
            'user_id' => $user_id
        ]);
        $deleted = $this->db->delete('t_game_tag_member');

        if ($this->db->affected_rows() == 0) {
            return ['success' => false, 'message' => '未找到报名记录'];
        }

        return ['success' => true, 'message' => '已取消报名'];
    }

    /**
     * 获取报名列表（从 t_game_tag_member 获取）
     */
    public function getRegistrations($game_id, $tag_id = null) {
        $this->db->select('m.*, u.nickname, u.avatar, u.handicap, s.tag_name');
        $this->db->from('t_game_tag_member m');
        $this->db->join('t_user u', 'm.user_id = u.id', 'left');
        $this->db->join('t_team_game_tags s', 'm.tag_id = s.id', 'left');
        $this->db->where('m.game_id', $game_id);

        if ($tag_id) {
            $this->db->where('m.tag_id', $tag_id);
        }

        $this->db->order_by('m.join_time', 'ASC');

        return $this->db->get()->result_array();
    }

    /**
     * 添加分队成员
     */
    public function addMemberToTag($tag_id, $user_id, $game_id) {
        // 检查是否已存在
        $existing = $this->db->get_where('t_game_tag_member', [
            'game_id' => $game_id,
            'user_id' => $user_id
        ])->row_array();

        if ($existing) {
            // 更新分队
            $this->db->where('id', $existing['id']);
            $this->db->update('t_game_tag_member', ['tag_id' => $tag_id]);
        } else {
            $this->db->insert('t_game_tag_member', [
                'tag_id' => $tag_id,
                'user_id' => $user_id,
                'game_id' => $game_id,
                'join_time' => date('Y-m-d H:i:s')
            ]);
        }

        return true;
    }

    /**
     * 移除分队成员
     */
    public function removeMemberFromTag($tag_id, $user_id) {
        $this->db->where(['tag_id' => $tag_id, 'user_id' => $user_id]);
        $this->db->delete('t_game_tag_member');
        return true;
    }

    // ========== 分组管理 ==========

    /**
     * 管理员分组
     */
    public function assignGroups($game_id, $groups) {
        // 清除现有分组
        $this->clearGameGroups($game_id);

        $createdGroups = [];
        foreach ($groups as $index => $group) {
            // 创建分组
            $this->db->insert('t_game_group', [
                'gameid' => $game_id,
                'group_name' => $group['group_name'] ?? '第' . ($index + 1) . '组',
                'group_create_time' => date('Y-m-d H:i:s'),
                'group_start_status' => '0'
            ]);
            $groupid = $this->db->insert_id();

            // 添加成员到分组
            if (!empty($group['user_ids'])) {
                foreach ($group['user_ids'] as $user_id) {
                    // 从 t_game_tag_member 获取分队信息
                    $member = $this->db->get_where('t_game_tag_member', [
                        'game_id' => $game_id,
                        'user_id' => $user_id
                    ])->row_array();

                    $this->db->insert('t_game_group_user', [
                        'gameid' => $game_id,
                        'groupid' => $groupid,
                        'userid' => $user_id,
                        'tag_id' => $member['tag_id'] ?? null,
                        'addtime' => date('Y-m-d H:i:s')
                    ]);
                }
            }

            $createdGroups[] = $groupid;
        }

        return $createdGroups;
    }

    /**
     * 球员选择分组
     */
    public function joinGroup($game_id, $group_id, $user_id) {
        // 检查用户是否已报名（从 t_game_tag_member 检查）
        $member = $this->db->get_where('t_game_tag_member', [
            'game_id' => $game_id,
            'user_id' => $user_id
        ])->row_array();

        if (!$member) {
            return ['success' => false, 'message' => '您尚未报名'];
        }

        // 检查分组是否存在
        $group = $this->db->get_where('t_game_group', [
            'groupid' => $group_id,
            'gameid' => $game_id
        ])->row_array();

        if (!$group) {
            return ['success' => false, 'message' => '分组不存在'];
        }

        // 检查分组人数（最多4人）
        $memberCount = $this->db->where(['gameid' => $game_id, 'groupid' => $group_id])
            ->count_all_results('t_game_group_user');

        if ($memberCount >= 4) {
            return ['success' => false, 'message' => '该分组已满'];
        }

        // 检查用户是否已在其他分组
        $existing = $this->db->get_where('t_game_group_user', [
            'gameid' => $game_id,
            'userid' => $user_id
        ])->row_array();

        if ($existing) {
            // 更新分组
            $this->db->where('id', $existing['id']);
            $this->db->update('t_game_group_user', ['groupid' => $group_id]);
        } else {
            $this->db->insert('t_game_group_user', [
                'gameid' => $game_id,
                'groupid' => $group_id,
                'userid' => $user_id,
                'tag_id' => $member['tag_id'],
                'addtime' => date('Y-m-d H:i:s')
            ]);
        }

        return ['success' => true, 'message' => '加入分组成功'];
    }

    /**
     * 获取分组详情
     */
    public function getGroups($game_id) {
        $groups = $this->db->where('gameid', $game_id)
            ->order_by('groupid', 'ASC')
            ->get('t_game_group')
            ->result_array();

        $web_url = config_item('web_url');

        foreach ($groups as &$group) {
            // 通过 tag_id 直接关联获取用户的分队信息
            $this->db->select('gu.*, u.nickname, u.avatar, u.handicap, s.tag_name, s.color as tag_color');
            $this->db->from('t_game_group_user gu');
            $this->db->join('t_user u', 'gu.userid = u.id', 'left');
            $this->db->join('t_team_game_tags s', 'gu.tag_id = s.id', 'left');
            $this->db->where('gu.groupid', $group['groupid']);
            $group['members'] = $this->db->get()->result_array();

            // 为 avatar 加上 web_url 前缀
            foreach ($group['members'] as &$member) {
                if (!empty($member['avatar'])) {
                    $member['avatar'] = $web_url . $member['avatar'];
                }
            }
        }

        return $groups;
    }

    /**
     * 清除赛事分组
     */
    public function clearGameGroups($game_id) {
        // 先删除分组成员
        $this->db->where('gameid', $game_id);
        $this->db->delete('t_game_group_user');

        // 再删除分组
        $this->db->where('gameid', $game_id);
        $this->db->delete('t_game_group');

        return true;
    }

    /**
     * 创建空分组
     */
    public function createEmptyGroup($game_id, $group_name = null) {
        $count = $this->db->where('gameid', $game_id)->count_all_results('t_game_group');

        $this->db->insert('t_game_group', [
            'gameid' => $game_id,
            'group_name' => $group_name ?? '第' . ($count + 1) . '组',
            'group_create_time' => date('Y-m-d H:i:s'),
            'group_start_status' => '0'
        ]);

        return $this->db->insert_id();
    }

    /**
     * 删除分组
     */
    public function deleteGroup($game_id, $group_id) {
        // 先删除分组成员
        $this->db->where('gameid', $game_id);
        $this->db->where('groupid', $group_id);
        $this->db->delete('t_game_group_user');

        // 再删除分组
        $this->db->where('gameid', $game_id);
        $this->db->where('groupid', $group_id);
        $this->db->delete('t_game_group');

        return $this->db->affected_rows() > 0;
    }

    /**
     * 更新单个分组的成员列表
     * @param int $game_id 比赛ID
     * @param int $group_id 分组ID
     * @param array $user_ids 用户ID数组
     * @return array 操作结果
     */
    public function updateGroupMembers($game_id, $group_id, $user_ids) {
        // 检查分组是否存在
        $group = $this->db->get_where('t_game_group', [
            'groupid' => $group_id,
            'gameid' => $game_id
        ])->row_array();

        if (!$group) {
            return ['success' => false, 'message' => '分组不存在'];
        }

        // 检查人数限制
        if (count($user_ids) > 4) {
            return ['success' => false, 'message' => '每组最多4人'];
        }

        // 1. 删除该分组原有成员
        $this->db->where('gameid', $game_id);
        $this->db->where('groupid', $group_id);
        $this->db->delete('t_game_group_user');

        // 2. 添加新成员
        foreach ($user_ids as $user_id) {
            // 从 t_game_tag_member 获取分队信息
            $member = $this->db->get_where('t_game_tag_member', [
                'game_id' => $game_id,
                'user_id' => $user_id
            ])->row_array();

            if (!$member) {
                continue; // 跳过未报名的用户
            }

            $insert_result = $this->db->insert('t_game_group_user', [
                'gameid' => $game_id,
                'groupid' => $group_id,
                'userid' => $user_id,
                'tag_id' => $member['tag_id'] ?? null,
                'addtime' => date('Y-m-d H:i:s')
            ]);

            if (!$insert_result) {
                $error = $this->db->error();
                log_message('error', "t_game_group_user insert failed: game_id={$game_id}, group_id={$group_id}, user_id={$user_id}, error=" . json_encode($error, JSON_UNESCAPED_UNICODE));
            }
        }

        return ['success' => true, 'message' => '分组成员更新成功!!!'];
    }

    // ========== 状态管理 ==========

    /**
     * 更新赛事状态
     */
    public function updateGameStatus($game_id, $game_status) {
        $validStatuses = ['init', 'registering', 'registration_closed', 'playing', 'finished', 'cancelled'];

        if (!in_array($game_status, $validStatuses)) {
            return ['success' => false, 'message' => '无效的状态值'];
        }

        $this->db->where('id', $game_id);
        $this->db->update('t_game', ['game_status' => $game_status]);

        return ['success' => true, 'message' => '状态更新成功'];
    }

    // ========== 查询与结果 ==========

    /**
     * 获取队内赛详情
     */
    public function getTeamGameDetail($game_id) {
        // 基本信息
        $this->db->select('g.*, c.name as course_name, t.team_name, t.team_avatar');
        $this->db->from('t_game g');
        $this->db->join('t_course c', 'g.courseid = c.courseid', 'left');
        $this->db->join('t_team t', 'g.team_id = t.id', 'left');
        $this->db->where('g.id', $game_id);
        $game = $this->db->get()->row_array();

        if (!$game) {
            return null;
        }

        // 分队列表
        $game['gameTags'] = $this->getGameTags($game_id);

        // 报名人数统计（从 t_game_tag_member 统计）
        $game['registration_stats'] = [
            'total' => $this->db->where(['game_id' => $game_id])->count_all_results('t_game_tag_member')
        ];

        // 分组信息
        $game['groups'] = $this->getGroups($game_id);

        return $game;
    }

    /**
     * 获取球队赛事列表
     */
    public function getTeamGameList($team_id, $game_status = null, $limit = 20, $offset = 0) {
        $this->db->select('g.*, c.name as course_name');
        $this->db->from('t_game g');
        $this->db->join('t_course c', 'g.courseid = c.courseid', 'left');
        $this->db->where('g.team_id', $team_id);
        $this->db->where_in('g.game_type', ['single_team', 'cross_teams']);

        if ($game_status) {
            $this->db->where('g.game_status', $game_status);
        }

        $this->db->order_by('g.create_time', 'DESC');
        $this->db->limit($limit, $offset);

        $games = $this->db->get()->result_array();

        // 为每个赛事添加报名人数（从 t_game_tag_member 统计）
        foreach ($games as &$game) {
            $game['approved_count'] = $this->db->where([
                'game_id' => $game['id']
            ])->count_all_results('t_game_tag_member');
        }

        return $games;
    }

    /**
     * 获取分队成绩
     */
    public function getScoresUnderTag($game_id) {
        $this->db->select('ss.*, s.tag_name, s.color');
        $this->db->from('t_game_score ss');
        $this->db->join('t_team_game_tags s', 'ss.tag_id = s.id', 'left');
        $this->db->where('ss.game_id', $game_id);
        $this->db->order_by('ss.ranking', 'ASC');

        return $this->db->get()->result_array();
    }


    /**
     * 获取比洞赛结果
     */
    public function getMatchResults($game_id, $group_id = null) {
        $this->db->select('mr.*, gg.group_name');
        $this->db->from('t_game_match_result mr');
        $this->db->join('t_game_group gg', 'mr.group_id = gg.groupid', 'left');
        $this->db->where('mr.game_id', $game_id);

        if ($group_id) {
            $this->db->where('mr.group_id', $group_id);
        }

        $results = $this->db->get()->result_array();

        // 获取每洞详情
        foreach ($results as &$result) {
            $result['hole_details'] = $this->db->where('match_result_id', $result['id'])
                ->order_by('hole_index', 'ASC')
                ->get('t_game_match_hole_detail')
                ->result_array();
        }

        return $results;
    }


    /**
     * 检查赛制是否需要分队
     */
    public function requiresSettingTags($match_format) {
        $requireGameTag = [
            'fourball_best_stroke',
            'fourball_oneball_stroke',
            'foursome_stroke',
            'fourball_best_match',
            'fourball_oneball_match',
            'foursome_match'
        ];

        return in_array($match_format, $requireGameTag);
    }

    /**
     * 检查是否为比洞赛
     */
    public function isMatchPlay($match_format) {
        return strpos($match_format, '_match') !== false;
    }

    // ========== 队际赛功能 ==========

    /**
     * 创建队际赛
     * @param array $data 包含 team_ids, team_aliases 等
     */
    public function createCrossTeamGame($data) {
        // 处理 team_ids：数组转为逗号分隔字符串
        $team_id_str = null;
        if (!empty($data['team_ids']) && is_array($data['team_ids'])) {
            $team_id_str = implode(',', $data['team_ids']);
        }

        $row = [
            'uuid' => $data['uuid'] ?? $this->generateUUID(),
            'team_id' => $team_id_str,
            'creatorid' => $data['creator_id'],
            'name' => $data['name'],
            'courseid' => $data['courseid'] ?? null,
            'match_format' => $data['match_format'],
            'open_time' => $data['open_time'] ?? null,
            'registration_deadline' => $data['registration_deadline'] ?? null,
            'entry_fee' => $data['entry_fee'] ?? 0,
            'awards' => $data['awards'] ?? null,
            'schedule' => $data['schedule'] ?? null,
            'grouping_permission' => $data['grouping_permission'] ?? 'admin',
            'is_public_registration' => $data['is_public_registration'] ?? 'y',
            'top_n_ranking' => $data['top_n_ranking'] ?? null,
            'game_type' => 'cross_teams',
            'game_status' => 'init',
            'create_time' => date('Y-m-d H:i:s'),
            'scoring_type' => $this->getScoringTypeFromFormat($data['match_format'])
        ];

        $this->db->insert('t_game', $row);
        return $this->db->insert_id();
    }

    /**
     * 添加队际赛参赛球队（使用统一的 t_team_game_tags 表）
     */
    public function addCrossTeam($game_id, $team_id, $team_alias = null) {
        // 获取球队信息
        $team = $this->db->get_where('t_team', ['id' => $team_id])->row_array();
        if (!$team) {
            return ['success' => false, 'message' => '球队不存在'];
        }

        // 检查是否已添加（通过 team_id 判断）
        $existing = $this->db->get_where('t_team_game_tags', [
            'game_id' => $game_id,
            'team_id' => $team_id
        ])->row_array();

        if ($existing) {
            return ['success' => false, 'message' => '该球队已添加'];
        }

        // 获取当前最大排序号
        $maxOrder = $this->db->select_max('tag_order')
            ->where('game_id', $game_id)
            ->get('t_team_game_tags')
            ->row_array();
        $order = ($maxOrder['tag_order'] ?? 0) + 1;

        $this->db->insert('t_team_game_tags', [
            'game_id' => $game_id,
            'team_id' => $team_id,
            'tag_name' => $team_alias ?? $team['team_name'],
            'tag_order' => $order,
            'create_time' => date('Y-m-d H:i:s')
        ]);

        return ['success' => true, 'id' => $this->db->insert_id()];
    }

    /**
     * 更新球队简称（使用统一的 t_team_game_tags 表）
     */
    public function updateCrossTeamAlias($game_id, $team_id, $team_alias) {
        $this->db->where(['game_id' => $game_id, 'team_id' => $team_id]);
        $this->db->update('t_team_game_tags', ['tag_name' => $team_alias]);
        return $this->db->affected_rows() > 0;
    }

    /**
     * 获取队际赛参赛球队列表（使用统一的 t_team_game_tags 表）
     */
    public function getCrossTeamList($game_id) {
        $this->db->select('s.id as tag_id, s.team_id, s.tag_name as team_alias, s.tag_order as team_order, s.color, t.team_name, t.team_avatar');
        $this->db->from('t_team_game_tags s');
        $this->db->join('t_team t', 's.team_id = t.id', 'left');
        $this->db->where('s.game_id', $game_id);
        $this->db->where('s.team_id IS NOT NULL'); // 队际赛的分队有 team_id
        $this->db->order_by('s.tag_order', 'ASC');

        $teams = $this->db->get()->result_array();

        // 为每个球队添加报名人数（从 t_game_tag_member 统计）
        foreach ($teams as &$team) {
            $team['member_count'] = $this->db->where([
                'game_id' => $game_id,
                'tag_id' => $team['tag_id']
            ])->count_all_results('t_game_tag_member');
        }

        return $teams;
    }

    /**
     * 检查球员是否已在队际赛中报名（唯一性校验）
     */
    public function checkCrossTeamRegistration($game_id, $user_id) {
        $existing = $this->db->select('m.*, s.tag_name as team_alias')
            ->from('t_game_tag_member m')
            ->join('t_team_game_tags s', 'm.tag_id = s.id', 'left')
            ->where('m.game_id', $game_id)
            ->where('m.user_id', $user_id)
            ->get()
            ->row_array();

        if ($existing) {
            return [
                'registered' => true,
                'registration' => $existing,
                'message' => '该球员已在 [' . ($existing['team_alias'] ?? '未知球队') . '] 报名'
            ];
        }

        return ['registered' => false];
    }

    /**
     * 队际赛报名（使用统一的 tag_id）
     * @param int $game_id 赛事ID
     * @param int $user_id 用户ID
     * @param int $tag_id 分队ID（t_team_game_tags.id）
     * @param string $remark 备注
     */
    public function registerCrossTeamGame($game_id, $user_id, $tag_id, $remark = null) {
        // 检查是否已报名（唯一性校验）
        $check = $this->checkCrossTeamRegistration($game_id, $user_id);
        if ($check['registered']) {
            return ['success' => false, 'message' => $check['message']];
        }

        // 检查分队是否为参赛球队（team_id 不为空）
        $tag = $this->db->get_where('t_team_game_tags', [
            'id' => $tag_id,
            'game_id' => $game_id
        ])->row_array();

        if (!$tag || empty($tag['team_id'])) {
            return ['success' => false, 'message' => '所选球队不是本赛事的参赛球队'];
        }

        // 检查是否为该球队成员
        $isTeamMember = $this->isTeamMember($tag['team_id'], $user_id);

        // 获取赛事信息
        $game = $this->getTeamGame($game_id);

        // 非公开赛事检查
        if ($game['is_public_registration'] == 'n' && !$isTeamMember) {
            return ['success' => false, 'message' => '该赛事仅限球队成员报名'];
        }

        // 直接加入分队成员表
        $this->addMemberToTag($tag_id, $user_id, $game_id);

        return [
            'success' => true,
            'message' => '报名成功'
        ];
    }

    /**
     * 比洞赛分组校验（使用统一的 tag_id）
     * 检查每组是否包含来自两个不同球队的球员
     */
    public function validateMatchPlayGrouping($game_id, $groups) {
        $game = $this->getTeamGame($game_id);

        // 只有比洞赛需要校验
        if (!$this->isMatchPlay($game['match_format'])) {
            return ['valid' => true];
        }

        $errors = [];

        foreach ($groups as $index => $group) {
            if (empty($group['user_ids']) || count($group['user_ids']) < 2) {
                continue;
            }

            // 获取该组所有成员的分队（从 t_game_tag_member 获取）
            $gameTagsIds = [];
            foreach ($group['user_ids'] as $user_id) {
                $member = $this->db->get_where('t_game_tag_member', [
                    'game_id' => $game_id,
                    'user_id' => $user_id
                ])->row_array();

                if ($member && $member['tag_id']) {
                    $gameTagsIds[] = $member['tag_id'];
                }
            }

            // 检查是否有至少两个不同的分队
            $uniqueSubteams = array_unique($gameTagsIds);
            if (count($uniqueSubteams) < 2) {
                $groupName = $group['group_name'] ?? '第' . ($index + 1) . '组';
                $errors[] = $groupName . ' 必须包含来自两个不同球队的球员';
            }
        }

        if (!empty($errors)) {
            return ['valid' => false, 'errors' => $errors];
        }

        return ['valid' => true];
    }

    /**
     * 获取队际赛中最少参赛人数球队的人数
     * 用于计算默认 top_n 值
     */
    public function getMinCrossTeamMemberCount($game_id) {
        $teams = $this->getCrossTeamList($game_id);

        if (empty($teams)) {
            return 0;
        }

        $minCount = PHP_INT_MAX;
        foreach ($teams as $team) {
            if ($team['member_count'] < $minCount) {
                $minCount = $team['member_count'];
            }
        }

        return $minCount == PHP_INT_MAX ? 0 : $minCount;
    }

    /**
     * 获取球队成员列表（用于报名选择）
     */
    public function getTeamMembersForSelect($team_id, $game_id = null) {
        $this->db->select('tm.*, u.nickname, u.avatar, u.handicap');
        $this->db->from('t_team_member tm');
        $this->db->join('t_user u', 'tm.user_id = u.id', 'left');
        $this->db->where('tm.team_id', $team_id);
        $this->db->where('tm.status', 'active');

        $members = $this->db->get()->result_array();

        // 如果提供了 game_id，标记已报名的成员（从 t_game_tag_member 查询）
        if ($game_id) {
            foreach ($members as &$member) {
                $tagMember = $this->db->get_where('t_game_tag_member', [
                    'game_id' => $game_id,
                    'user_id' => $member['user_id']
                ])->row_array();

                $member['is_registered'] = !empty($tagMember);
            }
        }

        return $members;
    }

    /**
     * 获取队际赛详情
     */
    public function getCrossTeamGameDetail($game_id) {
        // 基本信息
        $this->db->select('g.*, c.name as course_name');
        $this->db->from('t_game g');
        $this->db->join('t_course c', 'g.courseid = c.courseid', 'left');
        $this->db->where('g.id', $game_id);
        $game = $this->db->get()->row_array();

        if (!$game) {
            return null;
        }

        // 参赛球队列表
        $game['cross_teams'] = $this->getCrossTeamList($game_id);

        // 报名人数统计（从 t_game_tag_member 统计）
        $game['registration_stats'] = [
            'total' => $this->db->where(['game_id' => $game_id])->count_all_results('t_game_tag_member')
        ];

        // 分组信息
        $game['groups'] = $this->getCrossTeamGroups($game_id);

        return $game;
    }

    /**
     * 获取队际赛分组详情（使用统一的 t_team_game_tags 表）
     */
    public function getCrossTeamGroups($game_id) {
        $groups = $this->db->where('gameid', $game_id)
            ->order_by('groupid', 'ASC')
            ->get('t_game_group')
            ->result_array();

        foreach ($groups as &$group) {
            // 通过 tag_id 直接关联获取用户的分队信息
            $this->db->select('gu.*, u.nickname, u.avatar, u.handicap, s.tag_name as team_alias, s.team_id, s.id as tag_id');
            $this->db->from('t_game_group_user gu');
            $this->db->join('t_user u', 'gu.userid = u.id', 'left');
            $this->db->join('t_team_game_tags s', 'gu.tag_id = s.id', 'left');
            $this->db->where('gu.groupid', $group['groupid']);
            $group['members'] = $this->db->get()->result_array();
        }

        return $groups;
    }

    /**
     * 获取比赛报名人员列表
     * @param int $game_id 比赛ID
     * @return array 报名人员列表（含序号、昵称、头像、差点）
     */
    public function getTagMembersAll($game_id) {
        $this->db->select('m.id, m.tag_id, m.user_id, m.join_time, m.group_id, u.nickname, u.avatar, u.handicap, t.tag_name, t.color');
        $this->db->from('t_game_tag_member m');
        $this->db->join('t_user u', 'm.user_id = u.id', 'left');
        $this->db->join('t_team_game_tags t', 'm.tag_id = t.id', 'left');
        $this->db->where('m.game_id', $game_id);
        $this->db->order_by('m.join_time', 'ASC');

        $members = $this->db->get()->result_array();

        // 添加序号
        $index = 1;
        foreach ($members as &$member) {
            $member['seq'] = $index++;
        }

        return $members;
    }



    /**
     * 获取分队成员列表
     */
    public function getMembersByTag($tag_id) {
        $this->db->select('sm.*, u.nickname, u.avatar, u.handicap');
        $this->db->from('t_game_tag_member sm');
        $this->db->join('t_user u', 'sm.user_id = u.id', 'left');
        $this->db->where('sm.tag_id', $tag_id);

        return $this->db->get()->result_array();
    }

    /**
     * 队际赛分组（使用统一的 tag_id）
     */
    public function assignCrossTeamGroups($game_id, $groups) {
        // 先校验比洞赛分组
        $game = $this->getTeamGame($game_id);
        if ($this->isMatchPlay($game['match_format'])) {
            $validation = $this->validateMatchPlayGrouping($game_id, $groups);
            if (!$validation['valid']) {
                return ['success' => false, 'errors' => $validation['errors']];
            }
        }

        // 清除现有分组
        $this->clearGameGroups($game_id);

        $createdGroups = [];
        foreach ($groups as $index => $group) {
            // 创建分组
            $this->db->insert('t_game_group', [
                'gameid' => $game_id,
                'group_name' => $group['group_name'] ?? '第' . ($index + 1) . '组',
                'group_create_time' => date('Y-m-d H:i:s'),
                'group_start_status' => '0'
            ]);
            $groupid = $this->db->insert_id();

            // 添加成员到分组
            if (!empty($group['user_ids'])) {
                foreach ($group['user_ids'] as $user_id) {
                    // 从 t_game_tag_member 获取分队信息
                    $member = $this->db->get_where('t_game_tag_member', [
                        'game_id' => $game_id,
                        'user_id' => $user_id
                    ])->row_array();

                    $this->db->insert('t_game_group_user', [
                        'gameid' => $game_id,
                        'groupid' => $groupid,
                        'userid' => $user_id,
                        'tag_id' => $member['tag_id'] ?? null,
                        'addtime' => date('Y-m-d H:i:s')
                    ]);
                }
            }

            $createdGroups[] = $groupid;
        }

        return ['success' => true, 'groups' => $createdGroups];
    }
}
