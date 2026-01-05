<?php

ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

/**
 * 队内赛控制器
 * 处理队内赛的创建、报名、分组、状态管理等功能
 */
class TeamGame extends MY_Controller {

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

    // ==================== Phase 1: 赛事创建与配置 ====================

    /**
     * 创建队内赛
     * @param int team_id 球队ID
     * @param string name 比赛名称
     * @param int courseid 球场ID（可选）
     * @param string match_format 赛制类型
     * @param string open_time 开球时间（可选）
     * @param float entry_fee 参赛费用（可选）
     * @param string awards 奖项设置（可选）
     * @param string grouping_permission 分组权限 admin/player（可选，默认admin）
     * @param string is_public 是否公开 y/n（可选，默认y）
     * @param int top_n_ranking 取前N名成绩（可选）
     */
    public function createTeamGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();

        $team_id = $json_paras['team_id'];
        $match_format = $json_paras['match_format'];

        // 验证球队管理员权限
        if (!$this->MTeamGame->isTeamAdmin($team_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限创建此球队的赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 验证赛制类型
        $validFormats = [
            'individual_stroke',
            'fourball_best_stroke',
            'fourball_oneball_stroke',
            'foursome_stroke',
            'individual_match',
            'fourball_best_match',
            'fourball_oneball_match',
            'foursome_match'
        ];
        if (!in_array($match_format, $validFormats)) {
            echo json_encode(['code' => 400, 'message' => '无效的赛制类型'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $data = [
            'team_id' => $team_id,
            'creator_id' => $userid,
            'name' => $json_paras['name'],
            'courseid' => $json_paras['courseid'] ?? null,
            'match_format' => $match_format,
            'open_time' => $json_paras['open_time'] ?? null,
            'entry_fee' => $json_paras['entry_fee'] ?? 0,
            'awards' => $json_paras['awards'] ?? null,
            'grouping_permission' => $json_paras['grouping_permission'] ?? 'admin',
            'is_public' => $json_paras['is_public'] ?? 'y',
            'top_n_ranking' => $json_paras['top_n_ranking'] ?? null
        ];

        $game_id = $this->MTeamGame->createTeamGame($data);

        echo json_encode([
            'code' => 200,
            'message' => '队内赛创建成功',
            'data' => ['game_id' => $game_id]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 更新队内赛信息
     * @param int game_id 赛事ID
     * @param string name 比赛名称（可选）
     * @param int courseid 球场ID（可选）
     * @param string match_format 赛制类型（可选）
     * @param string open_time 开球时间（可选）
     * @param float entry_fee 参赛费用（可选）
     * @param string awards 奖项设置（可选）
     * @param string grouping_permission 分组权限（可选）
     * @param string is_public 是否公开（可选）
     * @param int top_n_ranking 取前N名成绩（可选）
     */
    public function updateTeamGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限修改此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->MTeamGame->updateTeamGame($game_id, $json_paras);

        echo json_encode(['code' => 200, 'message' => '赛事信息更新成功'], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 添加分队
     * @param int game_id 赛事ID
     * @param string subteam_name 分队名称
     * @param string color 分队颜色（可选）
     */
    public function addSubteam() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查赛制对分队数量的限制
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($this->MTeamGame->isMatchPlay($game['match_format'])) {
            $subteamCount = $this->MTeamGame->getSubteamCount($game_id);
            if ($subteamCount >= 2) {
                echo json_encode(['code' => 400, 'message' => '比洞赛最多只能设置2个分队'], JSON_UNESCAPED_UNICODE);
                return;
            }
        }

        $subteam_id = $this->MTeamGame->addSubteam(
            $game_id,
            $json_paras['subteam_name'],
            $json_paras['color'] ?? null
        );

        echo json_encode([
            'code' => 200,
            'message' => '分队添加成功',
            'data' => ['subteam_id' => $subteam_id]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 更新分队
     * @param int subteam_id 分队ID
     * @param string subteam_name 分队名称（可选）
     * @param string color 分队颜色（可选）
     */
    public function updateSubteam() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $subteam_id = $json_paras['subteam_id'];

        // 获取分队信息以验证权限
        $subteam = $this->MTeamGame->getSubteam($subteam_id);
        if (!$subteam) {
            echo json_encode(['code' => 404, 'message' => '分队不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (!$this->MTeamGame->isGameAdmin($subteam['game_id'], $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->MTeamGame->updateSubteam($subteam_id, $json_paras);

        echo json_encode(['code' => 200, 'message' => '分队更新成功'], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 删除分队
     * @param int subteam_id 分队ID
     */
    public function deleteSubteam() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $subteam_id = $json_paras['subteam_id'];

        // 获取分队信息以验证权限
        $subteam = $this->MTeamGame->getSubteam($subteam_id);
        if (!$subteam) {
            echo json_encode(['code' => 404, 'message' => '分队不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (!$this->MTeamGame->isGameAdmin($subteam['game_id'], $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->MTeamGame->deleteSubteam($subteam_id);

        echo json_encode(['code' => 200, 'message' => '分队删除成功'], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取分队列表
     * @param int game_id 赛事ID
     */
    public function getSubteams() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];

        $subteams = $this->MTeamGame->getSubteams($game_id);

        // 获取每个分队的成员
        foreach ($subteams as &$subteam) {
            $subteam['members'] = $this->MTeamGame->getSubteamMembers($subteam['id']);
        }

        echo json_encode([
            'code' => 200,
            'data' => $subteams
        ], JSON_UNESCAPED_UNICODE);
    }

    // ==================== Phase 2: 报名管理 ====================

    /**
     * 球员报名
     * @param int game_id 赛事ID
     * @param int subteam_id 分队ID（团队赛制时可选）
     * @param string remark 报名备注（可选）
     */
    public function registerGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];
        $subteam_id = $json_paras['subteam_id'] ?? null;
        $remark = $json_paras['remark'] ?? null;

        // 检查赛事状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if (!$game) {
            echo json_encode(['code' => 404, 'message' => '赛事不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        if ($game['game_status'] != 'registering') {
            echo json_encode(['code' => 400, 'message' => '当前赛事不在报名阶段'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 如果是团队赛制，检查是否选择了分队
        if ($this->MTeamGame->requiresSubteam($game['match_format']) && !$subteam_id) {
            echo json_encode(['code' => 400, 'message' => '团队赛制需要选择分队'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->registerGame($game_id, $userid, $subteam_id, $remark);

        if ($result['success']) {
            echo json_encode([
                'code' => 200,
                'message' => $result['message'],
                'data' => [
                    'registration_id' => $result['registration_id'],
                    'status' => $result['status']
                ]
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['code' => 400, 'message' => $result['message']], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * 取消报名
     * @param int game_id 赛事ID
     */
    public function cancelRegistration() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 检查赛事状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($game['game_status'] != 'registering') {
            echo json_encode(['code' => 400, 'message' => '当前赛事不在报名阶段，无法取消报名'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->cancelRegistration($game_id, $userid);

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['message']
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取报名列表
     * @param int game_id 赛事ID
     * @param string status 报名状态（可选）pending/approved/rejected/cancelled
     */
    public function getRegistrations() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];
        $status = $json_paras['status'] ?? null;

        $registrations = $this->MTeamGame->getRegistrations($game_id, $status);

        echo json_encode([
            'code' => 200,
            'data' => $registrations
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 审批通过
     * @param int registration_id 报名记录ID
     */
    public function approveRegistration() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $registration_id = $json_paras['registration_id'];

        // 获取报名记录
        $registration = $this->MTeamGame->getRegistration($registration_id);
        if (!$registration) {
            echo json_encode(['code' => 404, 'message' => '报名记录不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($registration['game_id'], $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限审批此报名'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->approveRegistration($registration_id, $userid);

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['message']
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 审批拒绝
     * @param int registration_id 报名记录ID
     * @param string reject_reason 拒绝原因（可选）
     */
    public function rejectRegistration() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $registration_id = $json_paras['registration_id'];
        $reject_reason = $json_paras['reject_reason'] ?? null;

        // 获取报名记录
        $registration = $this->MTeamGame->getRegistration($registration_id);
        if (!$registration) {
            echo json_encode(['code' => 404, 'message' => '报名记录不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($registration['game_id'], $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限审批此报名'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->rejectRegistration($registration_id, $userid, $reject_reason);

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['message']
        ], JSON_UNESCAPED_UNICODE);
    }

    // ==================== Phase 3: 分组管理 ====================

    /**
     * 管理员分组
     * @param int game_id 赛事ID
     * @param array groups 分组数组 [{group_name: '第1组', user_ids: [1, 2, 3, 4]}]
     */
    public function assignGroups() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];
        $groups = $json_paras['groups'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查赛事状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if (!in_array($game['game_status'], ['registering', 'registration_closed'])) {
            echo json_encode(['code' => 400, 'message' => '当前赛事状态不允许分组'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $groupIds = $this->MTeamGame->assignGroups($game_id, $groups);

        echo json_encode([
            'code' => 200,
            'message' => '分组成功',
            'data' => ['group_ids' => $groupIds]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 球员选择分组
     * @param int game_id 赛事ID
     * @param int group_id 分组ID
     */
    public function joinGroup() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];
        $group_id = $json_paras['group_id'];

        // 检查赛事是否允许球员自由选择分组
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($game['grouping_permission'] != 'player') {
            echo json_encode(['code' => 403, 'message' => '该赛事不允许球员自由选择分组'], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (!in_array($game['game_status'], ['registering', 'registration_closed'])) {
            echo json_encode(['code' => 400, 'message' => '当前赛事状态不允许选择分组'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->joinGroup($game_id, $group_id, $userid);

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['message']
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取分组详情
     * @param int game_id 赛事ID
     */
    public function getGroups() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];

        $groups = $this->MTeamGame->getGroups($game_id);

        echo json_encode([
            'code' => 200,
            'data' => $groups
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 创建空分组（球员自由选择模式下使用）
     * @param int game_id 赛事ID
     * @param string group_name 分组名称（可选）
     */
    public function createGroup() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];
        $group_name = $json_paras['group_name'] ?? null;

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $group_id = $this->MTeamGame->createEmptyGroup($game_id, $group_name);

        echo json_encode([
            'code' => 200,
            'message' => '分组创建成功',
            'data' => ['group_id' => $group_id]
        ], JSON_UNESCAPED_UNICODE);
    }

    // ==================== Phase 4: 状态与流程控制 ====================

    /**
     * 更新赛事状态
     * @param int game_id 赛事ID
     * @param string game_status 状态值 init/registering/registration_closed/playing/finished/cancelled
     */
    public function updateGameStatus() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];
        $game_status = $json_paras['game_status'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->updateGameStatus($game_id, $game_status);

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['message']
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 开启报名
     * @param int game_id 赛事ID
     */
    public function startRegistration() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查当前状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($game['game_status'] != 'init') {
            echo json_encode(['code' => 400, 'message' => '只有初始状态的赛事才能开启报名'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 如果是团队赛制，检查是否已设置分队
        if ($this->MTeamGame->requiresSubteam($game['match_format'])) {
            $subteamCount = $this->MTeamGame->getSubteamCount($game_id);
            if ($subteamCount < 2) {
                echo json_encode(['code' => 400, 'message' => '团队赛制需要先设置至少2个分队'], JSON_UNESCAPED_UNICODE);
                return;
            }
        }

        $result = $this->MTeamGame->updateGameStatus($game_id, 'registering');

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['success'] ? '报名已开启' : $result['message']
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 截止报名
     * @param int game_id 赛事ID
     */
    public function closeRegistration() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查当前状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($game['game_status'] != 'registering') {
            echo json_encode(['code' => 400, 'message' => '只有报名中的赛事才能截止报名'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->updateGameStatus($game_id, 'registration_closed');

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['success'] ? '报名已截止' : $result['message']
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 开始比赛
     * @param int game_id 赛事ID
     */
    public function startGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查当前状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($game['game_status'] != 'registration_closed') {
            echo json_encode(['code' => 400, 'message' => '只有报名截止的赛事才能开始比赛'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->updateGameStatus($game_id, 'playing');

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['success'] ? '比赛已开始' : $result['message']
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 结束比赛
     * @param int game_id 赛事ID
     */
    public function finishGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查当前状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($game['game_status'] != 'playing') {
            echo json_encode(['code' => 400, 'message' => '只有进行中的赛事才能结束'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->updateGameStatus($game_id, 'finished');

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['success'] ? '比赛已结束' : $result['message']
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 取消比赛
     * @param int game_id 赛事ID
     */
    public function cancelGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $userid)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查当前状态（已结束的不能取消）
        $game = $this->MTeamGame->getTeamGame($game_id);
        if (in_array($game['game_status'], ['finished', 'cancelled'])) {
            echo json_encode(['code' => 400, 'message' => '该赛事已结束或已取消'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->updateGameStatus($game_id, 'cancelled');

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['success'] ? '比赛已取消' : $result['message']
        ], JSON_UNESCAPED_UNICODE);
    }

    // ==================== Phase 5: 查询与结果 ====================

    /**
     * 获取队内赛详情
     * @param int game_id 赛事ID
     */
    public function getTeamGameDetail() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];

        $detail = $this->MTeamGame->getTeamGameDetail($game_id);

        if (!$detail) {
            echo json_encode(['code' => 404, 'message' => '赛事不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        echo json_encode([
            'code' => 200,
            'data' => $detail
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取球队赛事列表
     * @param int team_id 球队ID
     * @param string game_status 状态筛选（可选）
     * @param int limit 分页大小（可选，默认20）
     * @param int offset 偏移量（可选，默认0）
     */
    public function getTeamGameList() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $team_id = $json_paras['team_id'];
        $game_status = $json_paras['game_status'] ?? null;
        $limit = $json_paras['limit'] ?? 20;
        $offset = $json_paras['offset'] ?? 0;

        $games = $this->MTeamGame->getTeamGameList($team_id, $game_status, $limit, $offset);

        echo json_encode([
            'code' => 200,
            'data' => $games
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取分队成绩
     * @param int game_id 赛事ID
     */
    public function getSubteamScores() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];

        $scores = $this->MTeamGame->getSubteamScores($game_id);

        echo json_encode([
            'code' => 200,
            'data' => $scores
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取比洞赛结果
     * @param int game_id 赛事ID
     * @param int group_id 分组ID（可选，不传则返回所有分组）
     */
    public function getMatchResults() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];
        $group_id = $json_paras['group_id'] ?? null;

        // 检查是否为比洞赛
        $game = $this->MTeamGame->getTeamGame($game_id);
        if (!$this->MTeamGame->isMatchPlay($game['match_format'])) {
            echo json_encode(['code' => 400, 'message' => '该赛事不是比洞赛'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $results = $this->MTeamGame->getMatchResults($game_id, $group_id);

        echo json_encode([
            'code' => 200,
            'data' => $results
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取我的报名状态
     * @param int game_id 赛事ID
     */
    public function getMyRegistration() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];

        $this->db->select('r.*, s.subteam_name, s.color as subteam_color');
        $this->db->from('t_game_registration r');
        $this->db->join('t_game_subteam s', 'r.subteam_id = s.id', 'left');
        $this->db->where('r.game_id', $game_id);
        $this->db->where('r.user_id', $userid);
        $registration = $this->db->get()->row_array();

        echo json_encode([
            'code' => 200,
            'data' => $registration
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 修改我的分队
     * @param int game_id 赛事ID
     * @param int subteam_id 新的分队ID
     */
    public function changeMySubteam() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $game_id = $json_paras['game_id'];
        $subteam_id = $json_paras['subteam_id'];

        // 检查赛事状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($game['game_status'] != 'registering') {
            echo json_encode(['code' => 400, 'message' => '当前赛事不在报名阶段，无法修改分队'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查报名记录
        $registration = $this->db->get_where('t_game_registration', [
            'game_id' => $game_id,
            'user_id' => $userid,
            'status' => 'approved'
        ])->row_array();

        if (!$registration) {
            echo json_encode(['code' => 400, 'message' => '您尚未报名或报名未通过'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 更新报名记录的分队
        $this->db->where('id', $registration['id']);
        $this->db->update('t_game_registration', ['subteam_id' => $subteam_id]);

        // 更新分队成员表
        $this->MTeamGame->addSubteamMember($subteam_id, $userid, $game_id);

        echo json_encode(['code' => 200, 'message' => '分队修改成功'], JSON_UNESCAPED_UNICODE);
    }
}
