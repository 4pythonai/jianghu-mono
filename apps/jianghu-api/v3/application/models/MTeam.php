<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * 球队管理模型
 * 封装球队和成员管理的数据库操作
 */
class MTeam extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    // ========== 球队管理 ==========

    /**
     * 创建球队
     * 创建者自动成为超级管理员(owner)
     */
    public function createTeam($creator_id, $data) {
        // 检查球队名称唯一性
        if ($this->isTeamNameExists($data['team_name'])) {
            return ['success' => false, 'message' => '球队名称已存在'];
        }

        // 创建球队
        $teamRow = [
            'team_name' => $data['team_name'],
            'team_avatar' => $data['team_avatar'] ?? null,
            'sologan' => $data['sologan'] ?? null,
            'description' => $data['description'] ?? null,
            'creator' => $creator_id,
            'status' => 'active',
            'create_date' => date('Y-m-d H:i:s')
        ];

        $this->db->insert('t_team', $teamRow);
        $team_id = $this->db->insert_id();

        // 创建者自动成为超级管理员
        $this->db->insert('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $creator_id,
            'role' => 'owner',
            'status' => 'active',
            'join_time' => date('Y-m-d H:i:s')
        ]);

        return ['success' => true, 'team_id' => $team_id];
    }

    /**
     * 更新球队信息
     */
    public function updateTeam($team_id, $data) {
        $allowedFields = ['team_name', 'team_avatar', 'sologan', 'description'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }

        // 如果更新名称，检查唯一性
        if (isset($updateData['team_name'])) {
            $existing = $this->db->where('team_name', $updateData['team_name'])
                ->where('id !=', $team_id)
                ->get('t_team')
                ->row_array();
            if ($existing) {
                return ['success' => false, 'message' => '球队名称已存在'];
            }
        }

        if (!empty($updateData)) {
            $this->db->where('id', $team_id);
            $this->db->update('t_team', $updateData);
        }

        return ['success' => true, 'message' => '更新成功'];
    }

    /**
     * 获取球队详情
     */
    public function getTeamDetail($team_id) {
        $team = $this->db->get_where('t_team', ['id' => $team_id])->row_array();

        if (!$team) {
            return null;
        }

        // 获取成员统计
        $team['member_count'] = $this->db->where([
            'team_id' => $team_id,
            'status' => 'active'
        ])->count_all_results('t_team_member');

        // 获取超级管理员信息
        $owner = $this->db->select('tm.*, u.nickname, u.avatar')
            ->from('t_team_member tm')
            ->join('t_user u', 'tm.user_id = u.id', 'left')
            ->where(['tm.team_id' => $team_id, 'tm.role' => 'owner', 'tm.status' => 'active'])
            ->get()
            ->row_array();
        $team['owner'] = $owner;

        return $team;
    }

    /**
     * 获取用户的球队列表
     */
    public function getMyTeams($user_id) {
        $this->db->select('t.*, tm.role, tm.join_time, tm.status as member_status');
        $this->db->from('t_team t');
        $this->db->join('t_team_member tm', 't.id = tm.team_id');
        $this->db->where('tm.user_id', $user_id);
        $this->db->where('tm.status', 'active');
        $this->db->where('t.status', 'active');
        $this->db->order_by('tm.join_time', 'DESC');

        $teams = $this->db->get()->result_array();

        // 为每个球队添加成员数
        foreach ($teams as &$team) {
            $team['member_count'] = $this->db->where([
                'team_id' => $team['id'],
                'status' => 'active'
            ])->count_all_results('t_team_member');
        }

        return $teams;
    }

    /**
     * 检查球队名称是否存在
     */
    public function isTeamNameExists($team_name, $exclude_id = null) {
        $this->db->where('team_name', $team_name);
        if ($exclude_id) {
            $this->db->where('id !=', $exclude_id);
        }
        return $this->db->count_all_results('t_team') > 0;
    }

    // ========== 成员管理 ==========

    /**
     * 申请加入球队
     */
    public function applyToJoin($team_id, $user_id) {
        // 检查是否已是成员
        $existing = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id
        ])->row_array();

        if ($existing) {
            if ($existing['status'] == 'active') {
                return ['success' => false, 'message' => '您已是该球队成员'];
            }
            if ($existing['status'] == 'pending') {
                return ['success' => false, 'message' => '您已提交申请，请等待审批'];
            }
            // 如果是 inactive，更新为 pending
            $this->db->where('id', $existing['id']);
            $this->db->update('t_team_member', [
                'status' => 'pending',
                'join_time' => date('Y-m-d H:i:s')
            ]);
            return ['success' => true, 'message' => '申请已提交'];
        }

        // 新建申请
        $this->db->insert('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'role' => 'member',
            'status' => 'pending',
            'join_time' => date('Y-m-d H:i:s')
        ]);

        return ['success' => true, 'message' => '申请已提交，等待审批'];
    }

    /**
     * 审批通过入队申请
     */
    public function approveJoinRequest($team_id, $user_id) {
        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'pending'
        ])->row_array();

        if (!$member) {
            return ['success' => false, 'message' => '未找到待审批的申请'];
        }

        $this->db->where('id', $member['id']);
        $this->db->update('t_team_member', [
            'status' => 'active',
            'join_time' => date('Y-m-d H:i:s')
        ]);

        return ['success' => true, 'message' => '已通过申请'];
    }

    /**
     * 拒绝入队申请
     */
    public function rejectJoinRequest($team_id, $user_id) {
        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'pending'
        ])->row_array();

        if (!$member) {
            return ['success' => false, 'message' => '未找到待审批的申请'];
        }

        // 删除申请记录
        $this->db->where('id', $member['id']);
        $this->db->delete('t_team_member');

        return ['success' => true, 'message' => '已拒绝申请'];
    }

    /**
     * 直接拉入队员
     */
    public function inviteMember($team_id, $user_id) {
        // 检查是否已是成员
        $existing = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id
        ])->row_array();

        if ($existing) {
            if ($existing['status'] == 'active') {
                return ['success' => false, 'message' => '该用户已是球队成员'];
            }
            // 更新为 active
            $this->db->where('id', $existing['id']);
            $this->db->update('t_team_member', [
                'status' => 'active',
                'role' => 'member',
                'join_time' => date('Y-m-d H:i:s')
            ]);
            return ['success' => true, 'message' => '已添加成员'];
        }

        // 新建成员
        $this->db->insert('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'role' => 'member',
            'status' => 'active',
            'join_time' => date('Y-m-d H:i:s')
        ]);

        return ['success' => true, 'message' => '已添加成员'];
    }

    /**
     * 踢出队员
     */
    public function removeMember($team_id, $user_id) {
        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'active'
        ])->row_array();

        if (!$member) {
            return ['success' => false, 'message' => '未找到该成员'];
        }

        // 不能踢出超级管理员
        if ($member['role'] == 'owner') {
            return ['success' => false, 'message' => '不能移除超级管理员'];
        }

        $this->db->where('id', $member['id']);
        $this->db->update('t_team_member', ['status' => 'inactive']);

        return ['success' => true, 'message' => '已移除成员'];
    }

    /**
     * 获取球队成员列表
     */
    public function getTeamMembers($team_id, $status = 'active') {
        $this->db->select('tm.*, u.nickname, u.avatar, u.handicap, u.mobile');
        $this->db->from('t_team_member tm');
        $this->db->join('t_user u', 'tm.user_id = u.id', 'left');
        $this->db->where('tm.team_id', $team_id);
        $this->db->where('tm.status', $status);
        $this->db->order_by("FIELD(tm.role, 'owner', 'admin', 'member')");
        $this->db->order_by('tm.join_time', 'ASC');

        return $this->db->get()->result_array();
    }

    /**
     * 获取待审批申请列表
     */
    public function getPendingRequests($team_id) {
        return $this->getTeamMembers($team_id, 'pending');
    }

    // ========== 权限管理 ==========

    /**
     * 检查用户是否为球队管理员(owner或admin)
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
     * 检查用户是否为球队超级管理员(owner)
     */
    public function isTeamOwner($team_id, $user_id) {
        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'active'
        ])->row_array();

        return $member && $member['role'] == 'owner';
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
     * 获取用户在球队中的角色
     */
    public function getMemberRole($team_id, $user_id) {
        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'active'
        ])->row_array();

        return $member ? $member['role'] : null;
    }

    /**
     * 设置成员角色
     */
    public function setMemberRole($team_id, $user_id, $role) {
        $validRoles = ['admin', 'member'];
        if (!in_array($role, $validRoles)) {
            return ['success' => false, 'message' => '无效的角色'];
        }

        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'active'
        ])->row_array();

        if (!$member) {
            return ['success' => false, 'message' => '未找到该成员'];
        }

        if ($member['role'] == 'owner') {
            return ['success' => false, 'message' => '不能修改超级管理员的角色'];
        }

        $this->db->where('id', $member['id']);
        $this->db->update('t_team_member', ['role' => $role]);

        return ['success' => true, 'message' => '角色设置成功'];
    }

    /**
     * 转让超级管理员
     */
    public function transferOwner($team_id, $current_owner_id, $new_owner_id) {
        // 验证当前用户是 owner
        if (!$this->isTeamOwner($team_id, $current_owner_id)) {
            return ['success' => false, 'message' => '您不是超级管理员'];
        }

        // 验证新 owner 是球队成员
        $newOwnerMember = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $new_owner_id,
            'status' => 'active'
        ])->row_array();

        if (!$newOwnerMember) {
            return ['success' => false, 'message' => '目标用户不是球队成员'];
        }

        // 开始事务
        $this->db->trans_start();

        // 将当前 owner 降为 admin
        $this->db->where(['team_id' => $team_id, 'user_id' => $current_owner_id]);
        $this->db->update('t_team_member', ['role' => 'admin']);

        // 将新 owner 升为 owner
        $this->db->where(['team_id' => $team_id, 'user_id' => $new_owner_id]);
        $this->db->update('t_team_member', ['role' => 'owner']);

        // 更新球队创建者
        $this->db->where('id', $team_id);
        $this->db->update('t_team', ['creator' => $new_owner_id]);

        $this->db->trans_complete();

        if ($this->db->trans_status() === FALSE) {
            return ['success' => false, 'message' => '转让失败'];
        }

        return ['success' => true, 'message' => '超级管理员已转让'];
    }

    /**
     * 退出球队
     */
    public function quitTeam($team_id, $user_id) {
        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'active'
        ])->row_array();

        if (!$member) {
            return ['success' => false, 'message' => '您不是该球队成员'];
        }

        // 如果是超级管理员退出，需要自动指派新 owner
        if ($member['role'] == 'owner') {
            $result = $this->autoAssignNewOwner($team_id, $user_id);
            if (!$result['success']) {
                return $result;
            }
        }

        // 更新为 inactive
        $this->db->where('id', $member['id']);
        $this->db->update('t_team_member', ['status' => 'inactive']);

        return ['success' => true, 'message' => '已退出球队'];
    }

    /**
     * 自动指派新超级管理员
     * 规则：优先选择admin，如有多个选最早加入的；如无admin则选最早加入的member
     */
    private function autoAssignNewOwner($team_id, $exclude_user_id) {
        // 先找 admin
        $newOwner = $this->db->where([
            'team_id' => $team_id,
            'role' => 'admin',
            'status' => 'active'
        ])
            ->where('user_id !=', $exclude_user_id)
            ->order_by('join_time', 'ASC')
            ->limit(1)
            ->get('t_team_member')
            ->row_array();

        // 如果没有 admin，找 member
        if (!$newOwner) {
            $newOwner = $this->db->where([
                'team_id' => $team_id,
                'role' => 'member',
                'status' => 'active'
            ])
                ->where('user_id !=', $exclude_user_id)
                ->order_by('join_time', 'ASC')
                ->limit(1)
                ->get('t_team_member')
                ->row_array();
        }

        // 如果没有其他成员，球队将无owner（或可考虑解散球队）
        if (!$newOwner) {
            // 允许最后一人退出，球队变成无主状态
            return ['success' => true, 'message' => '球队已无其他成员'];
        }

        // 设置新 owner
        $this->db->where('id', $newOwner['id']);
        $this->db->update('t_team_member', ['role' => 'owner']);

        // 更新球队创建者
        $this->db->where('id', $team_id);
        $this->db->update('t_team', ['creator' => $newOwner['user_id']]);

        return ['success' => true, 'message' => '已自动指派新超级管理员'];
    }

    /**
     * 搜索球队
     */
    public function searchTeams($keyword, $limit = 20) {
        $this->db->select('t.*, (SELECT COUNT(*) FROM t_team_member tm WHERE tm.team_id = t.id AND tm.status = "active") as member_count');
        $this->db->from('t_team t');
        $this->db->like('t.team_name', $keyword);
        $this->db->where('t.status', 'active');
        $this->db->limit($limit);

        $teams = $this->db->get()->result_array();

        return $teams;
    }
}
