<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Game extends MY_Controller {
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
     * 检查是否是球局创建者
     */
    private function isGameCreator($gameid, $user_id) {
        $game = $this->db->select('creatorid')->from('t_game')->where('id', $gameid)->get()->row_array();
        return $game && (int)$game['creatorid'] === (int)$user_id;
    }




    public function getPlayerCombination() {
        $json_paras = json_decode(file_get_contents('php://input'), true);

        $user1 = ['user_id' => 837590, 'show_name' => 'Alex', 'avatar' => 'https://qiaoyincapital.com/avatar/2025/06/19/avatar_837590_1750302596.jpeg', 'handicap' => 0];
        $user2 = ['user_id' => 14, 'show_name' => 'awen', 'avatar' => 'https://qiaoyincapital.com//avatar/14.png', 'handicap' => 0];
        $user3 = ['user_id' => 59, 'show_name' => '唐昆', 'avatar' => 'https://qiaoyincapital.com//avatar/59.png', 'handicap' => 0];
        $user4 = ['user_id' => 122, 'show_name' => 'nice6', 'avatar' => 'https://qiaoyincapital.com//avatar/122.png', 'handicap' => 0];




        $user5 = ['user_id' => 837590, 'show_name' => 'Alex', 'avatar' => 'https://qiaoyincapital.com/avatar/2025/06/19/avatar_837590_1750302596.jpeg', 'handicap' => 27.8];
        $user6 = ['user_id' => 126, 'show_name' => 'ecoeco', 'avatar' => 'https://qiaoyincapital.com//avatar/126.png', 'handicap' => 3.8];
        $user7 = ['user_id' => 245, 'show_name' => 'JoYa', 'avatar' => 'https://qiaoyincapital.com//avatar/245.jpg', 'handicap' => 15.6];
        $user8 = ['user_id' => 246, 'show_name' => '阿咪阿咪红', 'avatar' => 'https://qiaoyincapital.com//avatar/246.png', 'handicap' => 0];

        $group1 = [$user1, $user2, $user3, $user4];
        $group2 = [$user5, $user6, $user7, $user8];
        $combination = [$group1, $group2];
        echo json_encode(['code' => 200, 'combination' => $combination], JSON_UNESCAPED_UNICODE);
    }


    public function createBlankGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $this->getUser();
        $uuid = $json_paras['uuid'];
        $create_source = isset($json_paras['create_source']) ? $json_paras['create_source'] : null;
        $row = [];
        $row['uuid'] = $uuid;
        $row['creatorid'] = $user_id;
        $row['create_time'] = date('Y-m-d H:i:s');
        $row['private'] = 'n';
        $row['scoring_type'] = 'hole';
        $row['privacy_password'] = null;
        $row['game_status'] = 'playing';
        $row['create_source'] = $create_source;
        $this->db->insert('t_game', $row);
        $gameid = $this->db->insert_id();
        echo json_encode(['code' => 200, 'uuid' => $uuid, 'gameid' => $gameid], JSON_UNESCAPED_UNICODE);
    }




    public function updateGameCourseCourt() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $uuid = $json_paras['uuid'];
        $courseid = $json_paras['courseid'];
        $gameid = $this->MGame->getGameidByUUID($uuid);
        $this->db->where('id', $gameid);
        $this->db->update('t_game', ['courseid' => $courseid]);
        $this->MGame->clearGameCourt($gameid);
        $this->MGame->addGameCourt($gameid, $json_paras['frontNineCourtId'], $json_paras['backNineCourtId']);
        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '球场/半场更新成功';

        //  更新这个球局的洞序

        $holeList = $this->MDetailGame->getHoleListByGameId($gameid);
        $this->db->where('id', $gameid);
        $this->db->update('t_game', ['holeList' => json_encode($holeList)]);

        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    public function updateGameName() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $uuid = $json_paras['uuid'];
        $name = $json_paras['gameName'];

        $this->db->where('uuid', $uuid);
        $this->db->update('t_game', ['name' => $name]);

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '球局名称更新成功';
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    public function updateGamePrivate() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $uuid = $json_paras['uuid'];
        $isPrivate = $json_paras['isPrivate'];

        $updateData = ['private' => $isPrivate ? 'y' : 'n'];
        if (!$isPrivate) {
            $updateData['privacy_password'] = null;
        }

        $this->db->where('uuid', $uuid);
        $this->db->update('t_game', $updateData);

        echo json_encode([
            'code' => 200,
            'message' => '隐私设置更新成功'
        ], JSON_UNESCAPED_UNICODE);
    }

    public function updateGamePrivacyPassword() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $uuid = $json_paras['uuid'];
        $privacy_password = $json_paras['password'];

        $this->db->where('uuid', $uuid);
        $this->db->update('t_game', ['privacy_password' => $privacy_password]);

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '隐私口令更新成功';
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    /**
     * 原子更新秘密比赛设置（isPrivate + password 一起更新）
     * 只有同时有 isPrivate=true 和 password 才会设置为秘密比赛
     */
    public function updateGamePrivateWithPassword() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $uuid = $json_paras['uuid'];
        $isPrivate = $json_paras['isPrivate'];
        $password = isset($json_paras['password']) ? $json_paras['password'] : '';

        // 只有同时有 isPrivate=true 和非空 password 才设置为秘密比赛
        if ($isPrivate && !empty($password)) {
            $this->db->where('uuid', $uuid);
            $this->db->update('t_game', [
                'private' => 'y',
                'privacy_password' => $password
            ]);
        } else {
            // 取消秘密比赛或密码为空，都重置为非秘密
            $this->db->where('uuid', $uuid);
            $this->db->update('t_game', [
                'private' => 'n',
                'privacy_password' => null
            ]);
        }

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '秘密比赛设置更新成功';
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    public function savePrivateWhiteList() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($json_paras['gameid']) ? intval($json_paras['gameid']) : 0;
        $request_userid = isset($json_paras['user_id']) ? intval($json_paras['user_id']) : 0;
        $user_id = intval($this->getUser());

        if ($gameid <= 0) {
            echo json_encode(['code' => 400, 'message' => '缺少有效的 gameid'], JSON_UNESCAPED_UNICODE);
            return;
        }

        if ($request_userid > 0 && $request_userid !== $user_id) {
            echo json_encode(['code' => 403, 'message' => 'user_id 与登录用户不匹配'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MPrivateWhiteList->addWhiteList($user_id, $gameid);

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = $result['created'] ? '白名单已添加' : '白名单已存在';
        $ret['data'] = [
            'gameid' => $gameid,
            'user_id' => $user_id,
            'created' => $result['created'],
            'record_id' => $result['record_id']
        ];

        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }


    public function updateGameOpenTime() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $uuid = $json_paras['uuid'];
        $open_time = $json_paras['openTime'];
        $this->db->where('uuid', $uuid);
        $this->db->update('t_game', ['open_time' => $open_time]);
        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '开赛时间更新成功';
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    public function updateGameScoringType() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $uuid = $json_paras['uuid'];
        $scoring_type = $json_paras['scoringType'];
        $this->db->where('uuid', $uuid);
        $this->db->update('t_game', ['scoring_type' => $scoring_type]);
        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '计分类型更新成功';
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    public function updateGameGroupAndPlayers() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $uuid = $json_paras['uuid'];
        $gameid = $this->MGame->getGameidByUUID($uuid);
        $groups = $json_paras['groups'];
        $this->MGame->clearGameGroupAndPlayers($gameid);
        $groupid = $this->MGame->addGameGroupAndPlayers($gameid, $groups);
        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '分组成功';
        $ret['groupid'] = $groupid;
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    public function getGameInviteQrcode() {
        $params = json_decode(file_get_contents('php://input'), true);
        $uuid = $params['uuid'];
        $gameid = (int) $params['gameid'];

        $filenameSeed = preg_replace('/[^A-Za-z0-9]/', '', $uuid);
        $filename = "game_invite_{$filenameSeed}_{$gameid}.png";
        $upload_path = FCPATH . '../upload/qrcodes/';
        $qrcodePath = $upload_path . $filename;
        $qrcodeUrl = '/upload/qrcodes/' . $filename;
        $scene = "gameid={$gameid}";
        $payload = [
            'scene' => $scene,
            'page' => 'packagePlayer/player-select/wxShare/wxShare',
            'width' => 460,
            'env_version' => 'develop',
            'auto_color' => false,
            'is_hyaline' => false,
            'check_path' => false  // 设置为 false，跳过路径校验（适用于页面未发布或分包页面）
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
            'qrcode_url' => $qrcodeUrl,
        ], JSON_UNESCAPED_UNICODE);
    }

    public function gameDetail() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = intval($json_paras['gameid']);
        $current_user_id = $this->getUser();
        $game_detail = $this->MDetailGame->getGameDetail($gameid, $current_user_id);
        $red_blue  = $this->getFirst4PlayersGambleRedBlue($gameid);
        echo json_encode(
            ['code' => 200, 'game_detail' => $game_detail, 'red_blue' => $red_blue],
            JSON_UNESCAPED_UNICODE
        );
    }



    public function getFirst4PlayersGambleRedBlue($game_id) {
        // Models are loaded via autoload.php
        $row = $this->db->get_where('t_gamble_x_runtime', ['gameid' => $game_id, 'playersNumber' => 4])->row_array();
        if ($row) {
            $gambleid = $row['id'];
            $row = $this->db->get_where('t_gamble_x_runtime', ['id' => $gambleid])->row_array();
            $cfg = [
                'gambleSysName' => $row['gambleSysName'],
                'gambleUserName' => $row['gambleUserName'],
                'userRuleId' => $row['userRuleId'],
                'gameid' => $row['gameid'],
                'gambleid' => $gambleid,
                'groupid' => $row['groupid'],
                'user_id' => $row['creator_id']
            ];


            $final_result = $this->GamblePipe->GetGambleResult($cfg);

            $red_blue = [];
            foreach ($final_result['useful_holes'] as $hole) {
                $red_blue[] =  [
                    'hindex' => $hole['hindex'],
                    'red' => $hole['red'],
                    'blue' => $hole['blue']
                ];
            }

            return $red_blue;
        } else {
            return [];
        }
    }



    public function saveGameScore() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['gameid'];
        $hindex = $json_paras['hindex'];

        $game_info = $this->MDetailGame->getGameInfo($game_id);
        if ($game_info['game_status'] == 'finished' || $game_info['game_status'] == 'cancelled') {
            echo json_encode(['code' => 500, 'message' => '球局已结束或取消'], JSON_UNESCAPED_UNICODE);
            return;
        }


        $group_id = $json_paras['groupid'];
        $hole_unique_key = $json_paras['holeUniqueKey'];
        $scores = $json_paras['scores'];
        $this->MScore->saveScore($game_id, $group_id, $hole_unique_key, $hindex, $scores);

        // 检查是否所有洞都完成记分，如果是则自动结束比赛
        $stats = $this->MDetailGame->getGameStats($game_id);
        if ($stats['completed_holes'] >= $stats['total_holes']) {
            $this->MGame->finishGame($game_id);
        }

        echo json_encode(['code' => 200, 'message' => '保存成功'], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 加入球局
     *
     * 用户通过此接口加入指定的球局。系统会自动将用户分配到合适的组别：
     * - 如果存在未满4人的组，则加入该组
     * - 如果所有组都已满员，则创建新组
     * - 如果球局没有任何组，则创建第一个组
     *
     * @api POST /game/joinGame
     *
     * @param string uuid 球局唯一标识符（可选）
     * @param int gameid 球局ID（必填）
     * @param string source 加入来源类型（可选，默认为'wxshare'）
     *                     可选值：'wxshare', 'qrcode', 'manual' 等
     *
     * @return array 返回结果
     * @return int code 状态码
     *                  200: 加入成功
     *                  401: 未登录
     *                  409: 已经加入此球局
     * @return string message 提示信息
     * @return array data 成功时返回的数据
     * @return string data.uuid 球局唯一标识符
     * @return int data.gameid 球局ID
     * @return int data.groupid 分配的组别ID
     * @return string data.join_type 加入类型
     *
     * @example 请求示例
     * POST /game/joinGame
     * Content-Type: application/json
     * {
     *     "uuid": "game-uuid-123",
     *     "gameid": 1001,
     *     "source": "wxshare"
     * }
     *
     * @example 成功响应示例
     * {
     *     "code": 200,
     *     "message": "加入成功",
     *     "data": {
     *         "uuid": "game-uuid-123",
     *         "gameid": 1001,
     *         "groupid": 1,
     *         "join_type": "wxshare"
     *     }
     * }
     *
     * @example 错误响应示例
     * {
     *     "code": 409,
     *     "message": "您已经加入此球局"
     * }
     */
    public function joinGame() {
        $params = json_decode(file_get_contents('php://input'), true);
        $joinType = isset($params['source']) && $params['source'] !== '' ? $params['source'] : 'wxshare';
        if ($joinType === 'manualAdd') {
            $userId = (int) $params['user_id'];
        } else {
            $userId = (int) $this->getUser();
        }

        $uuid = isset($params['uuid']) ? trim($params['uuid']) : '';
        $gameid = isset($params['gameid']) ? (int) $params['gameid'] : 0;
        $joinResult = $this->MGame->gameJoinHandler($userId, $gameid, $joinType);

        if ((int) $joinResult['code'] !== 200) {
            echo json_encode([
                'code' => $joinResult['code'],
                'message' => $joinResult['message']
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $responseData = isset($joinResult['data']) && is_array($joinResult['data']) ? $joinResult['data'] : [];
        $responseData['uuid'] = $uuid;
        $responseData['gameid'] = $gameid;
        $responseData['join_type'] = $joinResult['data']['join_type'] ?? $joinType;
        unset($responseData['record_id']);

        echo json_encode([
            'code' => 200,
            'message' => $joinResult['message'],
            'data' => $responseData
        ], JSON_UNESCAPED_UNICODE);
    }

    public function setTee() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = $json_paras['user_id'];
        $uuid = $json_paras['uuid'];
        $gameid = $this->MGame->getGameidByUUID($uuid);
        $tee = $json_paras['tee'];
        $this->MGame->setTee($gameid, $user_id, $tee);
        echo json_encode(['code' => 200, 'message' => '保存成功'], JSON_UNESCAPED_UNICODE);
    }



    public function removePlayer() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($json_paras['gameid']) ? (int)$json_paras['gameid'] : 0;
        $user_id = isset($json_paras['user_id']) ? (int)$json_paras['user_id'] : 0;

        if ($gameid <= 0 || $user_id <= 0) {
            echo json_encode(['code' => 400, 'message' => '参数错误'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MGame->removePlayer($gameid, $user_id);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    /**
     * 批量添加好友到球局
     *
     * @api POST /game/addFriendsToGame
     *
     * @param int gameid 球局ID（必填）
     * @param array userids 要添加的用户ID数组（必填）
     *
     * @return array 返回结果
     * @return int code 状态码 200:成功
     * @return string message 提示信息
     * @return array data.success 成功添加的用户ID列表
     * @return array data.failed 添加失败的用户信息
     */
    public function addFriendsToGame() {
        $params = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($params['gameid']) ? (int)$params['gameid'] : 0;
        $userids = isset($params['userids']) ? $params['userids'] : [];

        if ($gameid <= 0) {
            echo json_encode(['code' => 400, 'message' => '缺少有效的 gameid'], JSON_UNESCAPED_UNICODE);
            return;
        }


        $successList = [];
        $failedList = [];

        foreach ($userids as $user_id) {
            $user_id = (int)$user_id;

            $joinResult = $this->MGame->gameJoinHandler($user_id, $gameid, 'friendAdd');

            if ((int)$joinResult['code'] === 200) {
                $successList[] = $user_id;
            } else {
                $failedList[] = [
                    'user_id' => $user_id,
                    'reason' => $joinResult['message'] ?? '添加失败'
                ];
            }
        }

        $message = count($successList) > 0
            ? '成功添加 ' . count($successList) . ' 名好友'
            : '添加失败';

        if (count($failedList) > 0 && count($successList) > 0) {
            $message .= '，' . count($failedList) . ' 名好友添加失败';
        }

        echo json_encode([
            'code' => count($successList) > 0 ? 200 : 400,
            'message' => $message,
            'data' => [
                'success' => $successList,
                'failed' => $failedList
            ]
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 添加观看者到球局,同时执行 $this->MGame->removePlayer($gameid, $user_id)
     *
     * @api POST /game/addWatcher
     *
     * @param int gameid 球局ID（必填）
     * @param int user_id 用户ID（必填）
     *
     * @return array 返回结果
     */
    public function addWatcher() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($json_paras['gameid']) ? (int)$json_paras['gameid'] : 0;
        $user_id = isset($json_paras['user_id']) ? (int)$json_paras['user_id'] : 0;

        if ($gameid <= 0 || $user_id <= 0) {
            echo json_encode(['code' => 400, 'message' => '参数错误'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 移除
        $this->MGame->removePlayer($gameid, $user_id);

        $existing = $this->db->get_where('t_game_spectator', ['gameid' => $gameid, 'user_id' => $user_id])->row_array();

        if ($existing) {
            $this->db->where('id', $existing['id']);
            $this->db->update('t_game_spectator', ['addtime' => date('Y-m-d H:i:s')]);
            echo json_encode(['code' => 200, 'message' => '更新成功'], JSON_UNESCAPED_UNICODE);
        } else {
            $this->db->insert('t_game_spectator', [
                'gameid' => $gameid,
                'user_id' => $user_id,
                'addtime' => date('Y-m-d H:i:s')
            ]);
            echo json_encode(['code' => 200, 'message' => '添加成功'], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * 从球局移除观看者
     *
     * @api POST /game/deleteWatcher
     *
     * @param int gameid 球局ID（必填）
     * @param int user_id 用户ID（必填）
     *
     * @return array 返回结果
     */
    public function deleteWatcher() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($json_paras['gameid']) ? (int)$json_paras['gameid'] : 0;
        $user_id = isset($json_paras['user_id']) ? (int)$json_paras['user_id'] : 0;

        if ($gameid <= 0 || $user_id <= 0) {
            echo json_encode(['code' => 400, 'message' => '参数错误'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->db->where(['gameid' => $gameid, 'user_id' => $user_id]);
        $this->db->delete('t_game_spectator');
        echo json_encode(['code' => 200, 'message' => '删除成功'], JSON_UNESCAPED_UNICODE);
    }


    public function cancelGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($json_paras['gameid']) ? (int)$json_paras['gameid'] : 0;

        if ($gameid <= 0) {
            return $this->error('缺少有效的 gameid');
        }

        $user_id = $this->getUser();
        if (!$user_id) {
            return $this->error('请先登录', 401);
        }

        // 只有创建者可以取消球局
        if (!$this->isGameCreator($gameid, $user_id)) {
            return $this->error('只有创建者可以取消球局', 403);
        }

        $this->MGame->cancelGame($gameid);
        $this->success([], '取消成功');
    }

    public function finishGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($json_paras['gameid']) ? (int)$json_paras['gameid'] : 0;

        if ($gameid <= 0) {
            return $this->error('缺少有效的 gameid');
        }

        $user_id = $this->getUser();
        if (!$user_id) {
            return $this->error('请先登录', 401);
        }

        // 只有创建者可以结束球局
        if (!$this->isGameCreator($gameid, $user_id)) {
            return $this->error('只有创建者可以结束球局', 403);
        }

        $this->MGame->finishGame($gameid);
        $this->success([], '结束球局成功');
    }


    // 开始队内赛/队际赛
    public function startTeamGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($json_paras['gameid']) ? (int)$json_paras['gameid'] : 0;
        $this->MGame->startTeamGame($gameid);
        $this->success([], '成功开始比赛');
    }

    public function updateScorePermission() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($json_paras['gameid']) ? (int)$json_paras['gameid'] : 0;
        $score_permission = isset($json_paras['score_permission']) ? $json_paras['score_permission'] : [];
        $this->db->where('id', $gameid);
        $this->db->update('t_game', ['score_permission' => json_encode($score_permission)]);
        $this->success([], '更新成功');
    }
}
