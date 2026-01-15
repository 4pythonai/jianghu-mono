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
     * 创建者自动成为超级管理员(SuperAdmin)
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
            'role' => 'SuperAdmin',
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
        $superAdmin = $this->db->select('tm.*, u.display_name, u.wx_name, u.avatar')
            ->from('t_team_member tm')
            ->join('t_user u', 'tm.user_id = u.id', 'left')
            ->where(['tm.team_id' => $team_id, 'tm.role' => 'SuperAdmin', 'tm.status' => 'active'])
            ->get()
            ->row_array();
        $team['super_admin'] = $superAdmin;

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

        // 为每个球队添加成员数和管理员信息
        foreach ($teams as &$team) {
            $team['member_count'] = $this->db->where([
                'team_id' => $team['id'],
                'status' => 'active'
            ])->count_all_results('t_team_member');

            // 获取超级管理员名称
            $superAdmin = $this->db->select('u.display_name, u.wx_name')
                ->from('t_team_member tm')
                ->join('t_user u', 'tm.user_id = u.id', 'left')
                ->where(['tm.team_id' => $team['id'], 'tm.role' => 'SuperAdmin', 'tm.status' => 'active'])
                ->get()
                ->row_array();
            $team['super_admin_name'] = $superAdmin ? (!empty($superAdmin['display_name']) ? $superAdmin['display_name'] : $superAdmin['wx_name']) : '';

            // 获取普通管理员名称列表
            $admins = $this->db->select('u.display_name, u.wx_name')
                ->from('t_team_member tm')
                ->join('t_user u', 'tm.user_id = u.id', 'left')
                ->where(['tm.team_id' => $team['id'], 'tm.role' => 'admin', 'tm.status' => 'active'])
                ->get()
                ->result_array();
            $adminNames = array_map(function ($a) {
                return !empty($a['display_name']) ? $a['display_name'] : $a['wx_name'];
            }, $admins);
            $team['admin_names'] = implode('、', $adminNames);
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
        if ($member['role'] == 'SuperAdmin') {
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
        $this->db->select('tm.*, u.display_name, u.wx_name, u.avatar, u.handicap, u.mobile');
        $this->db->from('t_team_member tm');
        $this->db->join('t_user u', 'tm.user_id = u.id', 'left');
        $this->db->where('tm.team_id', $team_id);
        $this->db->where('tm.status', $status);
        $this->db->order_by("FIELD(tm.role, 'SuperAdmin', 'admin', 'member')");
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
     * 检查用户是否为球队管理员(SuperAdmin或admin)
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

        return in_array($member['role'], ['SuperAdmin', 'admin']);
    }

    /**
     * 检查用户是否为球队超级管理员(SuperAdmin)
     */
    public function isTeamSuperAdmin($team_id, $user_id) {
        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'active'
        ])->row_array();

        return $member && $member['role'] == 'SuperAdmin';
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

        if ($member['role'] == 'SuperAdmin') {
            return ['success' => false, 'message' => '不能修改超级管理员的角色'];
        }

        $this->db->where('id', $member['id']);
        $this->db->update('t_team_member', ['role' => $role]);

        return ['success' => true, 'message' => '角色设置成功'];
    }

    /**
     * 转让超级管理员
     */
    public function transferSuperAdmin($team_id, $current_super_admin_id, $new_super_admin_id) {
        // 验证当前用户是超级管理员
        if (!$this->isTeamSuperAdmin($team_id, $current_super_admin_id)) {
            return ['success' => false, 'message' => '您不是超级管理员'];
        }

        // 验证新超级管理员是球队成员
        $newSuperAdminMember = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $new_super_admin_id,
            'status' => 'active'
        ])->row_array();

        if (!$newSuperAdminMember) {
            return ['success' => false, 'message' => '目标用户不是球队成员'];
        }

        // 开始事务
        $this->db->trans_start();

        // 将当前超级管理员降为 admin
        $this->db->where(['team_id' => $team_id, 'user_id' => $current_super_admin_id]);
        $this->db->update('t_team_member', ['role' => 'admin']);

        // 将新超级管理员升为 SuperAdmin
        $this->db->where(['team_id' => $team_id, 'user_id' => $new_super_admin_id]);
        $this->db->update('t_team_member', ['role' => 'SuperAdmin']);

        // 更新球队创建者
        $this->db->where('id', $team_id);
        $this->db->update('t_team', ['creator' => $new_super_admin_id]);

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

        // 如果是超级管理员退出，需要自动指派新超级管理员
        if ($member['role'] == 'SuperAdmin') {
            $result = $this->autoAssignNewSuperAdmin($team_id, $user_id);
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
    private function autoAssignNewSuperAdmin($team_id, $exclude_user_id) {
        // 先找 admin
        $newSuperAdmin = $this->db->where([
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
        if (!$newSuperAdmin) {
            $newSuperAdmin = $this->db->where([
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

        // 如果没有其他成员，球队将无超级管理员（或可考虑解散球队）
        if (!$newSuperAdmin) {
            // 允许最后一人退出，球队变成无主状态
            return ['success' => true, 'message' => '球队已无其他成员'];
        }

        // 设置新超级管理员
        $this->db->where('id', $newSuperAdmin['id']);
        $this->db->update('t_team_member', ['role' => 'SuperAdmin']);

        // 更新球队创建者
        $this->db->where('id', $team_id);
        $this->db->update('t_team', ['creator' => $newSuperAdmin['user_id']]);

        return ['success' => true, 'message' => '已自动指派新超级管理员'];
    }

    /**
     * 搜索球队
     * @param string $keyword 搜索关键词，为空时返回所有球队
     * @param int $limit 返回数量限制
     */
    public function searchTeams($keyword = '', $limit = 100) {
        $this->db->select('t.*, (SELECT COUNT(*) FROM t_team_member tm WHERE tm.team_id = t.id AND tm.status = "active") as member_count');
        $this->db->from('t_team t');
        if (!empty($keyword)) {
            $this->db->like('t.team_name', $keyword);
        }
        $this->db->where('t.status', 'active');
        $this->db->order_by('t.id', 'DESC');
        $this->db->limit($limit);

        $teams = $this->db->get()->result_array();

        return $teams;
    }

    /**
     * 获取成员权限配置
     */
    public function getMemberPermissions($team_id, $user_id) {
        $member = $this->db->select('permissions')
            ->get_where('t_team_member', [
                'team_id' => $team_id,
                'user_id' => $user_id,
                'status' => 'active'
            ])->row_array();

        if (!$member || !$member['permissions']) {
            return null;
        }

        return json_decode($member['permissions'], true);
    }

    /**
     * 获取待审批申请数量
     */
    public function getPendingRequestCount($team_id) {
        return $this->db->where([
            'team_id' => $team_id,
            'status' => 'pending'
        ])->count_all_results('t_team_member');
    }

    /**
     * 设置管理员权限
     */
    public function setAdminPermissions($team_id, $user_id, $permissions) {
        $member = $this->db->get_where('t_team_member', [
            'team_id' => $team_id,
            'user_id' => $user_id,
            'status' => 'active'
        ])->row_array();

        if (!$member) {
            return ['success' => false, 'message' => '未找到该成员'];
        }

        if ($member['role'] === 'SuperAdmin') {
            return ['success' => false, 'message' => '不能修改超级管理员的权限'];
        }

        // 验证权限字段
        $allowedPermissions = ['approve_join', 'invite_member', 'remove_member', 'mark_paid', 'create_game', 'finance_stats'];
        $validPermissions = [];
        foreach ($allowedPermissions as $key) {
            $validPermissions[$key] = !empty($permissions[$key]);
        }

        $this->db->where('id', $member['id']);
        $this->db->update('t_team_member', [
            'permissions' => json_encode($validPermissions)
        ]);

        return ['success' => true, 'message' => '权限设置成功'];
    }

    /**
     * 搜索可邀请的用户（排除已是球队成员的）
     */
    public function searchUsersToInvite($team_id, $keyword, $limit = 20) {
        // 获取已是成员的用户ID列表
        $existingMembers = $this->db->select('user_id')
            ->where('team_id', $team_id)
            ->where_in('status', ['active', 'pending'])
            ->get('t_team_member')
            ->result_array();
        $existingUserIds = array_column($existingMembers, 'user_id');

        // 搜索用户（按昵称或手机号）
        $this->db->select('id, display_name, wx_name, avatar, handicap, mobile');
        $this->db->from('t_user');
        $this->db->group_start();
        $this->db->like('display_name', $keyword);
        $this->db->or_like('wx_name', $keyword);
        $this->db->or_like('mobile', $keyword);
        $this->db->group_end();

        // 排除已是成员的用户
        if (!empty($existingUserIds)) {
            $this->db->where_not_in('id', $existingUserIds);
        }

        $this->db->limit($limit);
        $users = $this->db->get()->result_array();

        // 隐藏手机号中间4位
        foreach ($users as &$user) {
            if (!empty($user['mobile']) && strlen($user['mobile']) >= 11) {
                $user['mobile_display'] = substr($user['mobile'], 0, 3) . '****' . substr($user['mobile'], -4);
            } else {
                $user['mobile_display'] = '';
            }
            unset($user['mobile']);
        }

        return $users;
    }
}
