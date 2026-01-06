<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * 队内赛模型
 * 封装队内赛相关的数据库操作
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
            'entry_fee' => $data['entry_fee'] ?? 0,
            'awards' => $data['awards'] ?? null,
            'grouping_permission' => $data['grouping_permission'] ?? 'admin',
            'is_public_registration' => $data['is_public_registration'] ?? 'y',
            'top_n_ranking' => $data['top_n_ranking'] ?? null,
            'game_type' => 'single_team',
            'status' => 'init',
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
        $allowedFields = ['name', 'courseid', 'match_format', 'open_time', 'entry_fee', 'awards', 'grouping_permission', 'is_public_registration', 'top_n_ranking'];
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
    public function addSubteam($game_id, $subteam_name, $color = null) {
        // 获取当前最大排序号
        $maxOrder = $this->db->select_max('subteam_order')
            ->where('game_id', $game_id)
            ->get('t_game_subteam')
            ->row_array();
        $order = ($maxOrder['subteam_order'] ?? 0) + 1;

        $this->db->insert('t_game_subteam', [
            'game_id' => $game_id,
            'subteam_name' => $subteam_name,
            'subteam_order' => $order,
            'color' => $color,
            'create_time' => date('Y-m-d H:i:s')
        ]);

        return $this->db->insert_id();
    }

    /**
     * 更新分队
     */
    public function updateSubteam($subteam_id, $data) {
        $updateData = [];
        if (isset($data['subteam_name'])) {
            $updateData['subteam_name'] = $data['subteam_name'];
        }
        if (isset($data['color'])) {
            $updateData['color'] = $data['color'];
        }
        if (isset($data['subteam_order'])) {
            $updateData['subteam_order'] = $data['subteam_order'];
        }

        if (!empty($updateData)) {
            $this->db->where('id', $subteam_id);
            $this->db->update('t_game_subteam', $updateData);
        }

        return true;
    }

    /**
     * 删除分队
     */
    public function deleteSubteam($subteam_id) {
        $this->db->where('id', $subteam_id);
        $this->db->delete('t_game_subteam');
        return $this->db->affected_rows() > 0;
    }

    /**
     * 获取分队列表
     */
    public function getSubteams($game_id) {
        return $this->db->where('game_id', $game_id)
            ->order_by('subteam_order', 'ASC')
            ->get('t_game_subteam')
            ->result_array();
    }

    /**
     * 获取分队信息
     */
    public function getSubteam($subteam_id) {
        return $this->db->get_where('t_game_subteam', ['id' => $subteam_id])->row_array();
    }

    /**
     * 获取赛事分队数量
     */
    public function getSubteamCount($game_id) {
        return $this->db->where('game_id', $game_id)
            ->count_all_results('t_game_subteam');
    }

    // ========== 报名管理 ==========

    /**
     * 球员报名
     */
    public function registerGame($game_id, $user_id, $subteam_id = null, $remark = null) {
        // 检查是否已报名
        $existing = $this->db->get_where('t_game_registration', [
            'game_id' => $game_id,
            'user_id' => $user_id
        ])->row_array();

        if ($existing) {
            return ['success' => false, 'message' => '您已报名此赛事'];
        }

        // 检查是否为球队成员
        $game = $this->getTeamGame($game_id);
        $isTeamMember = $game['team_id'] ? $this->isTeamMember($game['team_id'], $user_id) : false;

        // 非公开赛事且非队员，拒绝报名
        if ($game['is_public_registration'] == 'n' && !$isTeamMember) {
            return ['success' => false, 'message' => '该赛事仅限球队成员报名'];
        }

        // 队员自动通过，非队员待审核
        $status = $isTeamMember ? 'approved' : 'pending';

        $this->db->insert('t_game_registration', [
            'game_id' => $game_id,
            'user_id' => $user_id,
            'subteam_id' => $subteam_id,
            'status' => $status,
            'is_team_member' => $isTeamMember ? 'y' : 'n',
            'remark' => $remark,
            'apply_time' => date('Y-m-d H:i:s')
        ]);

        $registration_id = $this->db->insert_id();

        // 如果选择了分队且已通过，加入分队成员表
        if ($status == 'approved' && $subteam_id) {
            $this->addSubteamMember($subteam_id, $user_id, $game_id);
        }

        return [
            'success' => true,
            'registration_id' => $registration_id,
            'status' => $status,
            'message' => $status == 'approved' ? '报名成功' : '报名已提交，等待审核'
        ];
    }

    /**
     * 取消报名
     */
    public function cancelRegistration($game_id, $user_id) {
        // 获取报名记录
        $registration = $this->db->get_where('t_game_registration', [
            'game_id' => $game_id,
            'user_id' => $user_id
        ])->row_array();

        if (!$registration) {
            return ['success' => false, 'message' => '未找到报名记录'];
        }

        // 从分队成员中移除
        if ($registration['subteam_id']) {
            $this->removeSubteamMember($registration['subteam_id'], $user_id);
        }

        // 更新报名状态
        $this->db->where('id', $registration['id']);
        $this->db->update('t_game_registration', ['status' => 'cancelled']);

        return ['success' => true, 'message' => '已取消报名'];
    }

    /**
     * 获取报名列表
     */
    public function getRegistrations($game_id, $status = null) {
        $this->db->select('r.*, u.nickname, u.avatar, u.handicap, s.subteam_name');
        $this->db->from('t_game_registration r');
        $this->db->join('t_user2 u', 'r.user_id = u.id', 'left');
        $this->db->join('t_game_subteam s', 'r.subteam_id = s.id', 'left');
        $this->db->where('r.game_id', $game_id);

        if ($status) {
            $this->db->where('r.status', $status);
        }

        $this->db->order_by('r.apply_time', 'ASC');

        return $this->db->get()->result_array();
    }

    /**
     * 获取报名记录
     */
    public function getRegistration($registration_id) {
        return $this->db->get_where('t_game_registration', ['id' => $registration_id])->row_array();
    }

    /**
     * 审批通过
     */
    public function approveRegistration($registration_id, $reviewer_id) {
        $registration = $this->getRegistration($registration_id);
        if (!$registration) {
            return ['success' => false, 'message' => '未找到报名记录'];
        }

        if ($registration['status'] != 'pending') {
            return ['success' => false, 'message' => '该报名已处理'];
        }

        $this->db->where('id', $registration_id);
        $this->db->update('t_game_registration', [
            'status' => 'approved',
            'review_time' => date('Y-m-d H:i:s'),
            'reviewer_id' => $reviewer_id
        ]);

        // 如果选择了分队，加入分队成员表
        if ($registration['subteam_id']) {
            $this->addSubteamMember($registration['subteam_id'], $registration['user_id'], $registration['game_id']);
        }

        return ['success' => true, 'message' => '审批通过'];
    }

    /**
     * 审批拒绝
     */
    public function rejectRegistration($registration_id, $reviewer_id, $reject_reason = null) {
        $registration = $this->getRegistration($registration_id);
        if (!$registration) {
            return ['success' => false, 'message' => '未找到报名记录'];
        }

        if ($registration['status'] != 'pending') {
            return ['success' => false, 'message' => '该报名已处理'];
        }

        $this->db->where('id', $registration_id);
        $this->db->update('t_game_registration', [
            'status' => 'rejected',
            'review_time' => date('Y-m-d H:i:s'),
            'reviewer_id' => $reviewer_id,
            'reject_reason' => $reject_reason
        ]);

        return ['success' => true, 'message' => '已拒绝报名'];
    }

    /**
     * 添加分队成员
     */
    public function addSubteamMember($subteam_id, $user_id, $game_id) {
        // 检查是否已存在
        $existing = $this->db->get_where('t_game_subteam_member', [
            'game_id' => $game_id,
            'user_id' => $user_id
        ])->row_array();

        if ($existing) {
            // 更新分队
            $this->db->where('id', $existing['id']);
            $this->db->update('t_game_subteam_member', ['subteam_id' => $subteam_id]);
        } else {
            $this->db->insert('t_game_subteam_member', [
                'subteam_id' => $subteam_id,
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
    public function removeSubteamMember($subteam_id, $user_id) {
        $this->db->where(['subteam_id' => $subteam_id, 'user_id' => $user_id]);
        $this->db->delete('t_game_subteam_member');
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
                    $registration = $this->db->get_where('t_game_registration', [
                        'game_id' => $game_id,
                        'user_id' => $user_id,
                        'status' => 'approved'
                    ])->row_array();

                    $this->db->insert('t_game_group_user', [
                        'gameid' => $game_id,
                        'groupid' => $groupid,
                        'userid' => $user_id,
                        'subteam_id' => $registration['subteam_id'] ?? null,
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
        // 检查用户是否已通过报名
        $registration = $this->db->get_where('t_game_registration', [
            'game_id' => $game_id,
            'user_id' => $user_id,
            'status' => 'approved'
        ])->row_array();

        if (!$registration) {
            return ['success' => false, 'message' => '您尚未报名或报名未通过'];
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
                'subteam_id' => $registration['subteam_id'],
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

        foreach ($groups as &$group) {
            $this->db->select('gu.*, u.nickname, u.avatar, u.handicap, s.subteam_name, s.color as subteam_color');
            $this->db->from('t_game_group_user gu');
            $this->db->join('t_user2 u', 'gu.userid = u.id', 'left');
            $this->db->join('t_game_subteam s', 'gu.subteam_id = s.id', 'left');
            $this->db->where('gu.groupid', $group['groupid']);
            $group['members'] = $this->db->get()->result_array();
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

        // 同步更新 status 字段（兼容旧逻辑）
        $statusMapping = [
            'init' => 'init',
            'registering' => 'enrolling',
            'registration_closed' => 'enrolling',
            'playing' => 'playing',
            'finished' => 'finished',
            'cancelled' => 'canceled'
        ];

        if (isset($statusMapping[$game_status])) {
            $this->db->where('id', $game_id);
            $this->db->update('t_game', ['status' => $statusMapping[$game_status]]);
        }

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
        $game['subteams'] = $this->getSubteams($game_id);

        // 报名人数统计
        $game['registration_stats'] = [
            'total' => $this->db->where(['game_id' => $game_id])->count_all_results('t_game_registration'),
            'approved' => $this->db->where(['game_id' => $game_id, 'status' => 'approved'])->count_all_results('t_game_registration'),
            'pending' => $this->db->where(['game_id' => $game_id, 'status' => 'pending'])->count_all_results('t_game_registration')
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

        // 为每个赛事添加报名人数
        foreach ($games as &$game) {
            $game['approved_count'] = $this->db->where([
                'game_id' => $game['id'],
                'status' => 'approved'
            ])->count_all_results('t_game_registration');
        }

        return $games;
    }

    /**
     * 获取分队成绩
     */
    public function getSubteamScores($game_id) {
        $this->db->select('ss.*, s.subteam_name, s.color');
        $this->db->from('t_game_subteam_score ss');
        $this->db->join('t_game_subteam s', 'ss.subteam_id = s.id', 'left');
        $this->db->where('ss.game_id', $game_id);
        $this->db->order_by('ss.ranking', 'ASC');

        return $this->db->get()->result_array();
    }

    /**
     * 更新分队成绩
     */
    public function updateSubteamScore($game_id, $subteam_id, $data) {
        $existing = $this->db->get_where('t_game_subteam_score', [
            'game_id' => $game_id,
            'subteam_id' => $subteam_id
        ])->row_array();

        if ($existing) {
            $this->db->where('id', $existing['id']);
            $this->db->update('t_game_subteam_score', $data);
        } else {
            $data['game_id'] = $game_id;
            $data['subteam_id'] = $subteam_id;
            $this->db->insert('t_game_subteam_score', $data);
        }

        return true;
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
     * 获取分队成员列表
     */
    public function getSubteamMembers($subteam_id) {
        $this->db->select('sm.*, u.nickname, u.avatar, u.handicap');
        $this->db->from('t_game_subteam_member sm');
        $this->db->join('t_user2 u', 'sm.user_id = u.id', 'left');
        $this->db->where('sm.subteam_id', $subteam_id);

        return $this->db->get()->result_array();
    }

    /**
     * 检查赛制是否需要分队
     */
    public function requiresSubteam($match_format) {
        $requireSubteam = [
            'fourball_best_stroke',
            'fourball_oneball_stroke',
            'foursome_stroke',
            'fourball_best_match',
            'fourball_oneball_match',
            'foursome_match'
        ];

        return in_array($match_format, $requireSubteam);
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
        $row = [
            'uuid' => $data['uuid'] ?? $this->generateUUID(),
            'creatorid' => $data['creator_id'],
            'name' => $data['name'],
            'courseid' => $data['courseid'] ?? null,
            'match_format' => $data['match_format'],
            'open_time' => $data['open_time'] ?? null,
            'entry_fee' => $data['entry_fee'] ?? 0,
            'awards' => $data['awards'] ?? null,
            'grouping_permission' => $data['grouping_permission'] ?? 'admin',
            'is_public_registration' => $data['is_public_registration'] ?? 'y',
            'top_n_ranking' => $data['top_n_ranking'] ?? null,
            'game_type' => 'cross_teams',
            'status' => 'init',
            'game_status' => 'init',
            'create_time' => date('Y-m-d H:i:s'),
            'scoring_type' => $this->getScoringTypeFromFormat($data['match_format'])
        ];

        $this->db->insert('t_game', $row);
        return $this->db->insert_id();
    }

    /**
     * 添加队际赛参赛球队
     */
    public function addCrossTeam($game_id, $team_id, $team_alias = null) {
        // 获取球队信息
        $team = $this->db->get_where('t_team', ['id' => $team_id])->row_array();
        if (!$team) {
            return ['success' => false, 'message' => '球队不存在'];
        }

        // 检查是否已添加
        $existing = $this->db->get_where('t_game_cross_team', [
            'game_id' => $game_id,
            'team_id' => $team_id
        ])->row_array();

        if ($existing) {
            return ['success' => false, 'message' => '该球队已添加'];
        }

        // 获取当前最大排序号
        $maxOrder = $this->db->select_max('team_order')
            ->where('game_id', $game_id)
            ->get('t_game_cross_team')
            ->row_array();
        $order = ($maxOrder['team_order'] ?? 0) + 1;

        $this->db->insert('t_game_cross_team', [
            'game_id' => $game_id,
            'team_id' => $team_id,
            'team_alias' => $team_alias ?? $team['team_name'],
            'team_order' => $order,
            'create_time' => date('Y-m-d H:i:s')
        ]);

        return ['success' => true, 'id' => $this->db->insert_id()];
    }

    /**
     * 更新球队简称
     */
    public function updateCrossTeamAlias($game_id, $team_id, $team_alias) {
        $this->db->where(['game_id' => $game_id, 'team_id' => $team_id]);
        $this->db->update('t_game_cross_team', ['team_alias' => $team_alias]);
        return $this->db->affected_rows() > 0;
    }

    /**
     * 获取队际赛参赛球队列表
     */
    public function getCrossTeamList($game_id) {
        $this->db->select('ct.*, t.team_name, t.team_avatar');
        $this->db->from('t_game_cross_team ct');
        $this->db->join('t_team t', 'ct.team_id = t.id', 'left');
        $this->db->where('ct.game_id', $game_id);
        $this->db->order_by('ct.team_order', 'ASC');

        $teams = $this->db->get()->result_array();

        // 为每个球队添加报名人数
        foreach ($teams as &$team) {
            $team['member_count'] = $this->db->where([
                'game_id' => $game_id,
                'cross_team_id' => $team['team_id'],
                'status' => 'approved'
            ])->count_all_results('t_game_registration');
        }

        return $teams;
    }

    /**
     * 检查球员是否已在队际赛中报名（唯一性校验）
     */
    public function checkCrossTeamRegistration($game_id, $user_id) {
        $existing = $this->db->select('r.*, ct.team_alias')
            ->from('t_game_registration r')
            ->join('t_game_cross_team ct', 'r.cross_team_id = ct.team_id AND ct.game_id = r.game_id', 'left')
            ->where('r.game_id', $game_id)
            ->where('r.user_id', $user_id)
            ->where_in('r.status', ['pending', 'approved'])
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
     * 队际赛报名
     */
    public function registerCrossTeamGame($game_id, $user_id, $cross_team_id, $remark = null) {
        // 检查是否已报名（唯一性校验）
        $check = $this->checkCrossTeamRegistration($game_id, $user_id);
        if ($check['registered']) {
            return ['success' => false, 'message' => $check['message']];
        }

        // 检查球队是否为参赛球队
        $crossTeam = $this->db->get_where('t_game_cross_team', [
            'game_id' => $game_id,
            'team_id' => $cross_team_id
        ])->row_array();

        if (!$crossTeam) {
            return ['success' => false, 'message' => '所选球队不是本赛事的参赛球队'];
        }

        // 检查是否为该球队成员
        $isTeamMember = $this->isTeamMember($cross_team_id, $user_id);

        // 获取赛事信息
        $game = $this->getTeamGame($game_id);

        // 非公开赛事检查
        if ($game['is_public_registration'] == 'n' && !$isTeamMember) {
            return ['success' => false, 'message' => '该赛事仅限球队成员报名'];
        }

        // 队员自动通过，非队员待审核
        $status = $isTeamMember ? 'approved' : 'pending';

        $this->db->insert('t_game_registration', [
            'game_id' => $game_id,
            'user_id' => $user_id,
            'cross_team_id' => $cross_team_id,
            'status' => $status,
            'is_team_member' => $isTeamMember ? 'y' : 'n',
            'remark' => $remark,
            'apply_time' => date('Y-m-d H:i:s')
        ]);

        $registration_id = $this->db->insert_id();

        return [
            'success' => true,
            'registration_id' => $registration_id,
            'status' => $status,
            'message' => $status == 'approved' ? '报名成功' : '报名已提交，等待审核'
        ];
    }

    /**
     * 比洞赛分组校验
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

            // 获取该组所有成员的球队
            $teamIds = [];
            foreach ($group['user_ids'] as $user_id) {
                $registration = $this->db->get_where('t_game_registration', [
                    'game_id' => $game_id,
                    'user_id' => $user_id,
                    'status' => 'approved'
                ])->row_array();

                if ($registration && $registration['cross_team_id']) {
                    $teamIds[] = $registration['cross_team_id'];
                }
            }

            // 检查是否有至少两个不同的球队
            $uniqueTeams = array_unique($teamIds);
            if (count($uniqueTeams) < 2) {
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
        $this->db->join('t_user2 u', 'tm.user_id = u.id', 'left');
        $this->db->where('tm.team_id', $team_id);
        $this->db->where('tm.status', 'active');

        $members = $this->db->get()->result_array();

        // 如果提供了 game_id，标记已报名的成员
        if ($game_id) {
            foreach ($members as &$member) {
                $registration = $this->db->get_where('t_game_registration', [
                    'game_id' => $game_id,
                    'user_id' => $member['user_id']
                ])->row_array();

                $member['is_registered'] = !empty($registration) && in_array($registration['status'], ['pending', 'approved']);
                $member['registration_status'] = $registration['status'] ?? null;
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

        // 报名人数统计
        $game['registration_stats'] = [
            'total' => $this->db->where(['game_id' => $game_id])->count_all_results('t_game_registration'),
            'approved' => $this->db->where(['game_id' => $game_id, 'status' => 'approved'])->count_all_results('t_game_registration'),
            'pending' => $this->db->where(['game_id' => $game_id, 'status' => 'pending'])->count_all_results('t_game_registration')
        ];

        // 分组信息
        $game['groups'] = $this->getCrossTeamGroups($game_id);

        return $game;
    }

    /**
     * 获取队际赛分组详情（包含球队信息）
     */
    public function getCrossTeamGroups($game_id) {
        $groups = $this->db->where('gameid', $game_id)
            ->order_by('groupid', 'ASC')
            ->get('t_game_group')
            ->result_array();

        foreach ($groups as &$group) {
            $this->db->select('gu.*, u.nickname, u.avatar, u.handicap, ct.team_alias, ct.team_id as cross_team_id');
            $this->db->from('t_game_group_user gu');
            $this->db->join('t_user2 u', 'gu.userid = u.id', 'left');
            $this->db->join('t_game_cross_team ct', 'gu.cross_team_id = ct.team_id AND ct.game_id = gu.gameid', 'left');
            $this->db->where('gu.groupid', $group['groupid']);
            $group['members'] = $this->db->get()->result_array();
        }

        return $groups;
    }

    /**
     * 队际赛分组（覆盖原方法，支持 cross_team_id）
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
                    $registration = $this->db->get_where('t_game_registration', [
                        'game_id' => $game_id,
                        'user_id' => $user_id,
                        'status' => 'approved'
                    ])->row_array();

                    $this->db->insert('t_game_group_user', [
                        'gameid' => $game_id,
                        'groupid' => $groupid,
                        'userid' => $user_id,
                        'cross_team_id' => $registration['cross_team_id'] ?? null,
                        'addtime' => date('Y-m-d H:i:s')
                    ]);
                }
            }

            $createdGroups[] = $groupid;
        }

        return ['success' => true, 'groups' => $createdGroups];
    }
}
