<?php

ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

/**
 * 球队赛事控制器（队内赛 + 队际赛统一模型）
 * 处理队内赛和队际赛的创建、报名、分组、状态管理等功能
 *
 * 统一模型说明：
 * - 队内赛：t_team_game_tags.team_id = NULL，tag_name 为临时队名
 * - 队际赛：t_team_game_tags.team_id 指向真实球队，tag_name 为球队简称
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
     * @param string registration_deadline 报名截止时间（可选）
     * @param float entry_fee 参赛费用（可选）
     * @param string awards 奖项设置（可选）
     * @param array schedule 赛事流程（可选）[{time, content}, ...]
     * @param string grouping_permission 分组权限 admin/player（可选，默认admin）
     * @param string is_public_registration 是否公开 y/n（可选，默认y）
     * @param int top_n_ranking 取前N名成绩（可选）
     */
    public function createTeamSingleGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();

        $team_id = $json_paras['team_id'];
        $match_format = $json_paras['match_format'];

        // 验证球队管理员权限
        if (!$this->MTeamGame->isTeamAdmin($team_id, $user_id)) {
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

        // 处理赛事流程：数组转 JSON 字符串
        $schedule = null;
        if (!empty($json_paras['schedule']) && is_array($json_paras['schedule'])) {
            $schedule = json_encode($json_paras['schedule'], JSON_UNESCAPED_UNICODE);
        }

        $data = [
            'team_id' => $team_id,
            'creator_id' => $user_id,
            'name' => $json_paras['name'],
            'courseid' => $json_paras['courseid'] ?? null,
            'match_format' => $match_format,
            'open_time' => $json_paras['open_time'] ?? null,
            'registration_deadline' => $json_paras['registration_deadline'] ?? null,
            'entry_fee' => $json_paras['entry_fee'] ?? 0,
            'awards' => $json_paras['awards'] ?? null,
            'schedule' => $schedule,
            'grouping_permission' => $json_paras['grouping_permission'] ?? 'admin',
            'is_public_registration' => $json_paras['is_public_registration'] ?? 'y',
            'top_n_ranking' => $json_paras['top_n_ranking'] ?? null
        ];

        $game_id = $this->MTeamGame->createTeamSingleGame($data);

        // 添加半场信息并生成 holeList
        $front_nine_court_id = $json_paras['front_nine_court_id'] ?? null;
        $back_nine_court_id = $json_paras['back_nine_court_id'] ?? null;

        if ($front_nine_court_id || $back_nine_court_id) {
            // 添加半场到 t_game_court
            $this->load->model('MGame');
            $this->MGame->addGameCourt($game_id, $front_nine_court_id, $back_nine_court_id);

            // 生成 holeList
            $this->load->model('MDetailGame');
            $holeList = $this->MDetailGame->getHoleListByGameId($game_id);
            $this->db->where('id', $game_id);
            $this->db->update('t_game', ['holeList' => json_encode($holeList, JSON_UNESCAPED_UNICODE)]);
        }

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
     * @param string is_public_registration 是否公开（可选）
     * @param int top_n_ranking 取前N名成绩（可选）
     */
    public function updateTeamGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限修改此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->MTeamGame->updateTeamGame($game_id, $json_paras);

        echo json_encode(['code' => 200, 'message' => '赛事信息更新成功'], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 添加TAG
     * @param int game_id 赛事ID
     * @param string tag_name TAG名称
     * @param string color TAG颜色（可选）
     */
    public function addGameTag() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查赛制对TAG数量的限制
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($this->MTeamGame->isMatchPlay($game['match_format'])) {
            $tagCount = $this->MTeamGame->getTagsCount($game_id);
            if ($tagCount >= 2) {
                echo json_encode(['code' => 400, 'message' => '比洞赛最多只能设置2个TAG'], JSON_UNESCAPED_UNICODE);
                return;
            }
        }

        $tag_id = $this->MTeamGame->addGameTag(
            $game_id,
            $json_paras['tag_name'],
            $json_paras['color'] ?? null
        );

        echo json_encode([
            'code' => 200,
            'message' => 'TAG添加成功',
            'data' => ['tag_id' => $tag_id]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 更新TAG
     * @param int tag_id TAGID
     * @param string tag_name TAG名称（可选）
     * @param string color TAG颜色（可选）
     */
    public function updateTeamGameTag() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $tag_id = $json_paras['tag_id'];

        // 获取TAG信息以验证权限
        $tag = $this->MTeamGame->getTeamGameTag($tag_id);
        if (!$tag) {
            echo json_encode(['code' => 404, 'message' => 'TAG不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (!$this->MTeamGame->isGameAdmin($tag['game_id'], $user_id)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->MTeamGame->updateTeamGameTag($tag_id, $json_paras);

        echo json_encode(['code' => 200, 'message' => 'TAG更新成功'], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 删除TAG
     * @param int tag_id TAGID
     */
    public function deleteGameTag() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $tag_id = $json_paras['tag_id'];

        // 获取TAG信息以验证权限
        $tag = $this->MTeamGame->getTeamGameTag($tag_id);
        if (!$tag) {
            echo json_encode(['code' => 404, 'message' => 'TAG不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (!$this->MTeamGame->isGameAdmin($tag['game_id'], $user_id)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->MTeamGame->deleteGameTag($tag_id);

        echo json_encode(['code' => 200, 'message' => 'TAG删除成功'], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取TAGSs列表
     * @param int game_id 赛事ID
     */
    public function getGameTags() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];

        $tags = $this->MTeamGame->getGameTags($game_id);

        // 获取每个TAG的成员
        foreach ($tags as &$tag) {
            $tag['members'] = $this->MTeamGame->getMembersByTag($tag['id']);
        }

        echo json_encode([
            'code' => 200,
            'data' => $tags
        ], JSON_UNESCAPED_UNICODE);
    }

    // ==================== Phase 2: 报名管理 ====================

    /**
     * 球员报名
     * @param int game_id 赛事ID
     * @param int tag_id TAGID（团队赛制时可选）
     * @param string nickname 报名姓名（可选）
     * @param string gender 性别 male/female（可选）
     * @param string mobile 手机号（可选）
     * @param string remark 报名备注（可选）
     */
    public function registerGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];
        $tag_id = $json_paras['tag_id'] ?? null;
        $nickname = $json_paras['show_name'] ?? null;
        $gender = $json_paras['gender'] ?? null;
        $mobile = $json_paras['mobile'] ?? null;
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

        // 如果是团队赛制，检查是否选择了TAG
        if ($this->MTeamGame->requiresSettingTags($game['match_format']) && !$tag_id) {
            echo json_encode(['code' => 400, 'message' => '团队赛制需要选择TAG'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->registerGame($game_id, $user_id, $tag_id, $remark, $nickname, $gender, $mobile);

        if ($result['success']) {
            echo json_encode([
                'code' => 200,
                'message' => $result['message'],
                'data' => [
                    'status' => 'success'
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
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 检查赛事状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($game['game_status'] != 'registering') {
            echo json_encode(['code' => 400, 'message' => '当前赛事不在报名阶段，无法取消报名'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->cancelRegistration($game_id, $user_id);

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
        $user_id = $this->getUser();
        $registration_id = $json_paras['registration_id'];

        // 获取报名记录
        $registration = $this->MTeamGame->getRegistration($registration_id);
        if (!$registration) {
            echo json_encode(['code' => 404, 'message' => '报名记录不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($registration['game_id'], $user_id)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限审批此报名'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->approveRegistration($registration_id, $user_id);

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
        $user_id = $this->getUser();
        $registration_id = $json_paras['registration_id'];
        $reject_reason = $json_paras['reject_reason'] ?? null;

        // 获取报名记录
        $registration = $this->MTeamGame->getRegistration($registration_id);
        if (!$registration) {
            echo json_encode(['code' => 404, 'message' => '报名记录不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($registration['game_id'], $user_id)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限审批此报名'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->rejectRegistration($registration_id, $user_id, $reject_reason);

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
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];
        $groups = $json_paras['groups'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
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
        $user_id = $this->getUser();
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

        $result = $this->MTeamGame->joinGroup($game_id, $group_id, $user_id);

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
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];
        $group_name = $json_paras['group_name'] ?? null;

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
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

    /**
     * 删除分组
     * @param int game_id 赛事ID
     * @param int group_id 分组ID
     */
    public function deleteGroup() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];
        $group_id = $json_paras['group_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限管理此赛事'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->deleteGroup($game_id, $group_id);

        echo json_encode([
            'code' => $result ? 200 : 400,
            'message' => $result ? '分组删除成功' : '删除失败'
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 更新单个分组的成员列表
     * @param int game_id 赛事ID
     * @param int group_id 分组ID
     * @param array user_ids 用户ID数组
     */
    public function updateGroupMembers() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];
        $group_id = $json_paras['group_id'];
        $user_ids = $json_paras['user_ids'] ?? [];

        // 验证管理员权限或分组权限
        $game = $this->MTeamGame->getTeamGame($game_id);
        if (!$game) {
            echo json_encode(['code' => 404, 'message' => '赛事不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查权限：admin 权限需要是管理员，user 权限所有人可操作
        $hasPermission = ($game['grouping_permission'] == 'user') || $this->MTeamGame->isGameAdmin($game_id, $user_id);
        if (!$hasPermission) {
            echo json_encode(['code' => 403, 'message' => '您没有权限修改分组'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->updateGroupMembers($game_id, $group_id, $user_ids);

        echo json_encode([
            'code' => $result['success'] ? 200 : 400,
            'message' => $result['message']
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
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];
        $game_status = $json_paras['game_status'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
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
     * 截止报名
     * @param int game_id 赛事ID
     */
    public function closeRegistration() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
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
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
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
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
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
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];

        // 验证管理员权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
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
     * 获取TAG成绩
     * @param int game_id 赛事ID
     */
    public function getScoresUnderTag() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];

        $scores = $this->MTeamGame->getScoresUnderTag($game_id);

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
     * 获取我的报名状态（从 t_game_tag_member 查询）
     * @param int game_id 赛事ID
     */
    public function getMyRegistration() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];

        $this->db->select('m.*, s.tag_name, s.color as tag_color');
        $this->db->from('t_game_tag_member m');
        $this->db->join('t_team_game_tags s', 'm.tag_id = s.id', 'left');
        $this->db->where('m.game_id', $game_id);
        $this->db->where('m.user_id', $user_id);
        $registration = $this->db->get()->row_array();

        echo json_encode([
            'code' => 200,
            'data' => $registration
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 修改我的TAG
     * @param int game_id 赛事ID
     * @param int tag_id 新的TAGID
     */
    public function changeMyTagInGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];
        $tag_id = $json_paras['tag_id'];

        // 检查赛事状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($game['game_status'] != 'registering') {
            echo json_encode(['code' => 400, 'message' => '当前赛事不在报名阶段，无法修改TAG'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查报名记录（从 t_game_tag_member 查询）
        $member = $this->db->get_where('t_game_tag_member', [
            'game_id' => $game_id,
            'user_id' => $user_id
        ])->row_array();

        if (!$member) {
            echo json_encode(['code' => 400, 'message' => '您尚未报名'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 更新TAG成员表
        $this->MTeamGame->addMemberToTag($tag_id, $user_id, $game_id);

        echo json_encode(['code' => 200, 'message' => 'TAG修改成功'], JSON_UNESCAPED_UNICODE);
    }

    // ==================== 队际赛 API ====================

    /**
     * 创建队际赛
     * @param array team_ids 参赛球队ID数组
     * @param array teamGameTags 球队简称数组（可选，与team_ids对应）
     * @param string name 比赛名称
     * @param int courseid 球场ID（可选）
     * @param string match_format 赛制类型
     * @param string open_time 开球时间（可选）
     * @param float entry_fee 参赛费用（可选）
     * @param string awards 奖项设置（可选）
     * @param string grouping_permission 分组权限（可选，默认admin）
     * @param string is_public_registration 是否公开（可选，默认y）
     * @param int top_n_ranking 取前N名成绩（可选）
     */
    public function createCrossTeamGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();

        $team_ids = $json_paras['team_ids'];
        $teamGameTags = $json_paras['teamGameTags'] ?? [];
        $match_format = $json_paras['match_format'];

        // 验证参赛球队数量
        if (count($team_ids) < 2) {
            echo json_encode(['code' => 400, 'message' => '队际赛至少需要2个球队'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 比洞赛只能2个球队
        if ($this->MTeamGame->isMatchPlay($match_format) && count($team_ids) > 2) {
            echo json_encode(['code' => 400, 'message' => '比洞赛仅支持2个球队对抗'], JSON_UNESCAPED_UNICODE);
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

        // 处理赛事流程：数组转 JSON 字符串
        $schedule = null;
        if (!empty($json_paras['schedule']) && is_array($json_paras['schedule'])) {
            $schedule = json_encode($json_paras['schedule'], JSON_UNESCAPED_UNICODE);
        }

        // 创建队际赛
        $data = [
            'team_ids' => $team_ids,
            'creator_id' => $user_id,
            'name' => $json_paras['name'],
            'courseid' => $json_paras['courseid'] ?? null,
            'match_format' => $match_format,
            'open_time' => $json_paras['open_time'] ?? null,
            'registration_deadline' => $json_paras['registration_deadline'] ?? null,
            'entry_fee' => $json_paras['entry_fee'] ?? 0,
            'awards' => $json_paras['awards'] ?? null,
            'schedule' => $schedule,
            'grouping_permission' => $json_paras['grouping_permission'] ?? 'admin',
            'is_public_registration' => $json_paras['is_public_registration'] ?? 'y',
            'top_n_ranking' => $json_paras['top_n_ranking'] ?? null
        ];

        $game_id = $this->MTeamGame->createCrossTeamGame($data);

        // 添加半场信息并生成 holeList
        $front_nine_court_id = $json_paras['front_nine_court_id'] ?? null;
        $back_nine_court_id = $json_paras['back_nine_court_id'] ?? null;

        if ($front_nine_court_id || $back_nine_court_id) {
            // 添加半场到 t_game_court
            $this->load->model('MGame');
            $this->MGame->addGameCourt($game_id, $front_nine_court_id, $back_nine_court_id);

            // 生成 holeList
            $this->load->model('MDetailGame');
            $holeList = $this->MDetailGame->getHoleListByGameId($game_id);
            $this->db->where('id', $game_id);
            $this->db->update('t_game', ['holeList' => json_encode($holeList, JSON_UNESCAPED_UNICODE)]);
        }

        // 添加参赛球队
        foreach ($team_ids as $index => $team_id) {
            $alias = isset($teamGameTags[$index]) ? $teamGameTags[$index] : null;
            $this->MTeamGame->addTeamGameTags($game_id, $team_id, $alias);
        }

        echo json_encode([
            'code' => 200,
            'message' => '队际赛创建成功',
            'data' => ['game_id' => $game_id]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 更新球队简称
     * @param int game_id 赛事ID
     * @param int team_id 球队ID
     * @param string team_alias 新的简称
     */
    public function updateCrossTeamAlias() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];
        $team_id = $json_paras['team_id'];
        $team_alias = $json_paras['team_alias'];

        // 验证权限（创建者或参赛球队管理员）
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限修改球队简称'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->updateCrossTeamAlias($game_id, $team_id, $team_alias);

        if ($result) {
            echo json_encode(['code' => 200, 'message' => '球队简称更新成功'], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['code' => 400, 'message' => '更新失败'], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * 获取队际赛参赛球队列表
     * @param int game_id 赛事ID
     */
    public function getCrossTeamList() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];

        $teams = $this->MTeamGame->getCrossTeamList($game_id);

        echo json_encode([
            'code' => 200,
            'data' => $teams
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 队际赛报名（使用统一的 tag_id）
     * @param int game_id 赛事ID
     * @param int tag_id 选择代表的TAGID（t_team_game_tags.id）
     * @param int user_id 被报名用户ID（可选，默认为当前用户，替好友报名时使用）
     * @param string remark 报名备注（可选）
     */
    public function registerCrossTeamGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];
        $tag_id = $json_paras['tag_id'];
        $target_user_id = $json_paras['user_id'] ?? $user_id;
        $remark = $json_paras['remark'] ?? null;

        // 检查赛事状态
        $game = $this->MTeamGame->getTeamGame($game_id);
        if (!$game || $game['game_type'] != 'cross_teams') {
            echo json_encode(['code' => 400, 'message' => '赛事不存在或不是队际赛'], JSON_UNESCAPED_UNICODE);
            return;
        }

        if ($game['game_status'] != 'registering') {
            echo json_encode(['code' => 400, 'message' => '当前赛事不在报名阶段'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->registerCrossTeamGame($game_id, $target_user_id, $tag_id, $remark);

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
     * 获取球队成员列表（用于报名选择）
     * @param int team_id 球队ID
     * @param int game_id 赛事ID（可选，用于标记已报名成员）
     */
    public function getTeamMembersForSelect() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $team_id = $json_paras['team_id'];
        $game_id = $json_paras['game_id'] ?? null;

        $members = $this->MTeamGame->getTeamMembersForSelect($team_id, $game_id);

        echo json_encode([
            'code' => 200,
            'data' => $members
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取队际赛详情
     * @param int game_id 赛事ID
     */
    public function getCrossTeamGameDetail() {
        $user_id = $this->getUser();
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];

        $detail = $this->MTeamGame->getCrossTeamGameDetail($user_id, $game_id);

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
     * 队际赛分组（含比洞赛校验）
     * @param int game_id 赛事ID
     * @param array groups 分组数据
     */
    public function assignCrossTeamGroups() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $game_id = $json_paras['game_id'];
        $groups = $json_paras['groups'];

        // 验证权限
        if (!$this->MTeamGame->isGameAdmin($game_id, $user_id)) {
            echo json_encode(['code' => 403, 'message' => '您没有权限进行分组'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 检查赛事类型
        $game = $this->MTeamGame->getTeamGame($game_id);
        if ($game['game_type'] != 'cross_teams') {
            echo json_encode(['code' => 400, 'message' => '该API仅适用于队际赛'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MTeamGame->assignCrossTeamGroups($game_id, $groups);

        if ($result['success']) {
            echo json_encode([
                'code' => 200,
                'message' => '分组成功',
                'data' => ['groups' => $result['groups']]
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'code' => 400,
                'message' => '分组校验失败',
                'errors' => $result['errors']
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * 检查球员报名状态（唯一性校验）
     * @param int game_id 赛事ID
     * @param int user_id 用户ID
     */
    public function checkCrossTeamRegistration() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];
        $user_id = $json_paras['user_id'];

        $result = $this->MTeamGame->checkCrossTeamRegistration($game_id, $user_id);

        echo json_encode([
            'code' => 200,
            'data' => $result
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取比赛报名人员列表
     * @param int game_id 比赛ID
     * @return array 报名人员列表（含序号seq、昵称nickname、头像avatar、差点handicap）
     */
    public function getTagMembersAll() {
        $user_id = $this->getUser();
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['game_id'];

        $members = $this->MTeamGame->getTagMembersAll($user_id, $game_id);

        echo json_encode([
            'code' => 200,
            'data' => $members
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取球童记分二维码
     * @param int game_id 赛事ID
     * @return string qrcode 二维码图片URL
     */
    public function CaddieInputQrcode() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = (int) $json_paras['game_id'];

        $filename = "caddie_input_{$game_id}.png";
        $upload_path = FCPATH . '../upload/qrcodes/';
        $qrcodePath = $upload_path . $filename;
        $qrcodeUrl = '/upload/qrcodes/' . $filename;

        $scene = "game_id={$game_id}";
        $payload = [
            'scene' => $scene,
            'page' => 'packageGame/gameDetail/caddieInput/caddieInput',
            'width' => 460,
            'env_version' => 'develop',
            'auto_color' => false,
            'is_hyaline' => false,
            'check_path' => false
        ];

        $qrcodeResult = $this->MWeixin->createQrcodeImg(
            'getwxacodeunlimit',
            $payload,
            [
                'save_path' => $qrcodePath,
                'public_url' => $qrcodeUrl,
                'ensure_dir' => $upload_path
            ]
        );

        if (empty($qrcodeResult['success'])) {
            $errorInfo = $qrcodeResult['error'] ?? null;
            $errorMsg = '二维码生成失败';
            if (is_array($errorInfo) && isset($errorInfo['errmsg'])) {
                $errorMsg = $errorInfo['errmsg'];
            } elseif (is_array($errorInfo) && isset($errorInfo['message'])) {
                $errorMsg = $errorInfo['message'];
            }
            echo json_encode([
                'code' => 500,
                'message' => $errorMsg,
                'error_info' => $errorInfo
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $qrcodeUrl = $qrcodeResult['file_url'] ?? $qrcodeUrl;

        echo json_encode([
            'code' => 200,
            'message' => '二维码生成成功',
            'data' => ['qrcode' => $qrcodeUrl]
        ], JSON_UNESCAPED_UNICODE);
    }
}
