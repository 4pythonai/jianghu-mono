<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * 球队管理控制器
 */
class Team extends CI_Controller {

    public function __construct() {
        parent::__construct();
    }

    /**
     * 获取当前用户ID
     */
    private function getCurrentUserId() {
        return $this->session->userdata('user_id');
    }

    /**
     * 返回成功响应
     */
    private function success($data = [], $message = '操作成功') {
        echo json_encode(array_merge([
            'code' => 200,
            'message' => $message
        ], $data), JSON_UNESCAPED_UNICODE);
    }

    /**
     * 返回错误响应
     */
    private function error($message, $code = 400) {
        echo json_encode([
            'code' => $code,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 要求管理员权限
     */
    private function requireAdmin($team_id) {
        $user_id = $this->getCurrentUserId();
        if (!$user_id) {
            $this->error('请先登录', 401);
            return false;
        }
        if (!$this->MTeam->isTeamAdmin($team_id, $user_id)) {
            $this->error('需要管理员权限', 403);
            return false;
        }
        return $user_id;
    }

    /**
     * 要求超级管理员权限
     */
    private function requireOwner($team_id) {
        $user_id = $this->getCurrentUserId();
        if (!$user_id) {
            $this->error('请先登录', 401);
            return false;
        }
        if (!$this->MTeam->isTeamOwner($team_id, $user_id)) {
            $this->error('需要超级管理员权限', 403);
            return false;
        }
        return $user_id;
    }

    // ========== 球队管理 ==========

    /**
     * 创建球队
     * POST /Team/createTeam
     * 参数: team_name, team_avatar?, sologan?, description?
     */
    public function createTeam() {
        $user_id = $this->getCurrentUserId();
        if (!$user_id) {
            return $this->error('请先登录', 401);
        }

        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_name'])) {
            return $this->error('球队名称不能为空');
        }

        $result = $this->MTeam->createTeam($user_id, $params);

        if ($result['success']) {
            $this->success(['team_id' => $result['team_id']], '球队创建成功');
        } else {
            $this->error($result['message']);
        }
    }

    /**
     * 更新球队信息
     * POST /Team/updateTeam
     * 参数: team_id, team_name?, team_avatar?, sologan?, description?
     */
    public function updateTeam() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id'])) {
            return $this->error('球队ID不能为空');
        }

        $user_id = $this->requireAdmin($params['team_id']);
        if (!$user_id) return;

        $result = $this->MTeam->updateTeam($params['team_id'], $params);

        if ($result['success']) {
            $this->success([], $result['message']);
        } else {
            $this->error($result['message']);
        }
    }

    /**
     * 获取球队详情
     * POST /Team/getTeamDetail
     * 参数: team_id
     */
    public function getTeamDetail() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id'])) {
            return $this->error('球队ID不能为空');
        }

        $team = $this->MTeam->getTeamDetail($params['team_id']);

        if ($team) {
            // 检查当前用户是否是成员
            $user_id = $this->getCurrentUserId();
            if ($user_id) {
                $team['is_member'] = $this->MTeam->isTeamMember($params['team_id'], $user_id);
                $team['my_role'] = $this->MTeam->getMemberRole($params['team_id'], $user_id);
            } else {
                $team['is_member'] = false;
                $team['my_role'] = null;
            }
            $this->success(['team' => $team]);
        } else {
            $this->error('球队不存在');
        }
    }

    /**
     * 获取我的球队列表
     * POST /Team/getMyTeams
     */
    public function getMyTeams() {
        $user_id = $this->getCurrentUserId();
        if (!$user_id) {
            return $this->error('请先登录', 401);
        }

        $teams = $this->MTeam->getMyTeams($user_id);
        $this->success(['teams' => $teams]);
    }

    /**
     * 搜索球队
     * POST /Team/searchTeams
     * 参数: keyword
     */
    public function searchTeams() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['keyword'])) {
            return $this->error('请输入搜索关键词');
        }

        $teams = $this->MTeam->searchTeams($params['keyword']);
        $this->success(['teams' => $teams]);
    }

    // ========== 成员管理 ==========

    /**
     * 申请加入球队
     * POST /Team/applyToJoin
     * 参数: team_id
     */
    public function applyToJoin() {
        $user_id = $this->getCurrentUserId();
        if (!$user_id) {
            return $this->error('请先登录', 401);
        }

        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id'])) {
            return $this->error('球队ID不能为空');
        }

        $result = $this->MTeam->applyToJoin($params['team_id'], $user_id);

        if ($result['success']) {
            $this->success([], $result['message']);
        } else {
            $this->error($result['message']);
        }
    }

    /**
     * 审批通过入队申请
     * POST /Team/approveJoinRequest
     * 参数: team_id, user_id
     */
    public function approveJoinRequest() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id']) || empty($params['user_id'])) {
            return $this->error('参数不完整');
        }

        $admin_id = $this->requireAdmin($params['team_id']);
        if (!$admin_id) return;

        $result = $this->MTeam->approveJoinRequest($params['team_id'], $params['user_id']);

        if ($result['success']) {
            $this->success([], $result['message']);
        } else {
            $this->error($result['message']);
        }
    }

    /**
     * 拒绝入队申请
     * POST /Team/rejectJoinRequest
     * 参数: team_id, user_id
     */
    public function rejectJoinRequest() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id']) || empty($params['user_id'])) {
            return $this->error('参数不完整');
        }

        $admin_id = $this->requireAdmin($params['team_id']);
        if (!$admin_id) return;

        $result = $this->MTeam->rejectJoinRequest($params['team_id'], $params['user_id']);

        if ($result['success']) {
            $this->success([], $result['message']);
        } else {
            $this->error($result['message']);
        }
    }

    /**
     * 直接拉入队员
     * POST /Team/inviteMember
     * 参数: team_id, user_id
     */
    public function inviteMember() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id']) || empty($params['user_id'])) {
            return $this->error('参数不完整');
        }

        $admin_id = $this->requireAdmin($params['team_id']);
        if (!$admin_id) return;

        $result = $this->MTeam->inviteMember($params['team_id'], $params['user_id']);

        if ($result['success']) {
            $this->success([], $result['message']);
        } else {
            $this->error($result['message']);
        }
    }

    /**
     * 踢出队员
     * POST /Team/removeMember
     * 参数: team_id, user_id
     */
    public function removeMember() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id']) || empty($params['user_id'])) {
            return $this->error('参数不完整');
        }

        $admin_id = $this->requireAdmin($params['team_id']);
        if (!$admin_id) return;

        $result = $this->MTeam->removeMember($params['team_id'], $params['user_id']);

        if ($result['success']) {
            $this->success([], $result['message']);
        } else {
            $this->error($result['message']);
        }
    }

    /**
     * 获取球队成员列表
     * POST /Team/getTeamMembers
     * 参数: team_id
     */
    public function getTeamMembers() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id'])) {
            return $this->error('球队ID不能为空');
        }

        $members = $this->MTeam->getTeamMembers($params['team_id']);
        $this->success(['members' => $members]);
    }

    /**
     * 获取待审批申请列表
     * POST /Team/getPendingRequests
     * 参数: team_id
     */
    public function getPendingRequests() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id'])) {
            return $this->error('球队ID不能为空');
        }

        $admin_id = $this->requireAdmin($params['team_id']);
        if (!$admin_id) return;

        $requests = $this->MTeam->getPendingRequests($params['team_id']);
        $this->success(['requests' => $requests]);
    }

    // ========== 权限管理 ==========

    /**
     * 设置成员角色
     * POST /Team/setMemberRole
     * 参数: team_id, user_id, role (admin/member)
     */
    public function setMemberRole() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id']) || empty($params['user_id']) || empty($params['role'])) {
            return $this->error('参数不完整');
        }

        $owner_id = $this->requireOwner($params['team_id']);
        if (!$owner_id) return;

        $result = $this->MTeam->setMemberRole($params['team_id'], $params['user_id'], $params['role']);

        if ($result['success']) {
            $this->success([], $result['message']);
        } else {
            $this->error($result['message']);
        }
    }

    /**
     * 转让超级管理员
     * POST /Team/transferOwner
     * 参数: team_id, new_owner_id
     */
    public function transferOwner() {
        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id']) || empty($params['new_owner_id'])) {
            return $this->error('参数不完整');
        }

        $user_id = $this->getCurrentUserId();
        if (!$user_id) {
            return $this->error('请先登录', 401);
        }

        $result = $this->MTeam->transferOwner($params['team_id'], $user_id, $params['new_owner_id']);

        if ($result['success']) {
            $this->success([], $result['message']);
        } else {
            $this->error($result['message']);
        }
    }

    /**
     * 退出球队
     * POST /Team/quitTeam
     * 参数: team_id
     */
    public function quitTeam() {
        $user_id = $this->getCurrentUserId();
        if (!$user_id) {
            return $this->error('请先登录', 401);
        }

        $params = json_decode(file_get_contents('php://input'), true);

        if (empty($params['team_id'])) {
            return $this->error('球队ID不能为空');
        }

        $result = $this->MTeam->quitTeam($params['team_id'], $user_id);

        if ($result['success']) {
            $this->success([], $result['message']);
        } else {
            $this->error($result['message']);
        }
    }
}
