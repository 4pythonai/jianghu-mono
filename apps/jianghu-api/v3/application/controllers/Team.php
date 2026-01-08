<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * 球队管理控制器
 */


class Team extends MY_Controller {

    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }


    /**
     * 要求管理员权限
     */
    private function requireAdmin($team_id) {
        $user_id = $this->getUser();
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
        $user_id = $this->getUser();
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
     * 上传球队 Logo
     * POST /Team/uploadLogo
     */
    public function uploadLogo() {
        $user_id = $this->getUser();
        if (!$user_id) {
            return $this->error('请先登录', 401);
        }

        try {
            // 检查是否有文件上传
            if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
                throw new \RuntimeException('文件上传失败');
            }

            $file = $_FILES['logo'];

            // 验证文件类型
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!in_array($file['type'], $allowedTypes)) {
                throw new \RuntimeException('文件类型不支持，仅支持 JPG, PNG, GIF 格式');
            }

            // 验证文件大小（限制为5MB）
            $maxSize = 5 * 1024 * 1024;
            if ($file['size'] > $maxSize) {
                throw new \RuntimeException('文件大小超过限制（最大5MB）');
            }

            // 生成文件名
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $fileName = 'team_logo_' . $user_id . '_' . time() . '.' . $extension;
            $date_folder = date('Y/m/d/');
            $full_path = '/var/www/html/avatar/team-logo/' . $date_folder;

            if (!is_dir($full_path)) {
                mkdir($full_path, 0755, true);
            }
            $targetPath = $full_path . $fileName;

            // 移动文件到目标目录
            if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                throw new \RuntimeException('文件保存失败');
            }

            $relativePath = '/avatar/team-logo/' . $date_folder . $fileName;

            echo json_encode([
                'code' => 200,
                'message' => 'Logo上传成功',
                'data' => [
                    'logo' => $relativePath
                ]
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 创建球队
     * POST /Team/createTeam
     * 参数: team_name, team_avatar?, sologan?, description?
     */
    public function createTeam() {
        $user_id = $this->getUser();
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
            $user_id = $this->getUser();
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
        $user_id = $this->getUser();
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
        $user_id = $this->getUser();
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

        $user_id = $this->getUser();
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
        $user_id = $this->getUser();
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
