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


    public function createGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $course_id = $json_paras['course_id'];
        $start_time = $json_paras['start_time'];
        $end_time = $json_paras['end_time'];

        $game_id = $this->db->insert_id();
        $this->db->insert('t_game_group', [
            'game_id' => $game_id,
            'course_id' => $course_id,
            'start_time' => $start_time,
            'end_time' => $end_time
        ]);

        echo json_encode(['code' => 200, 'game_id' => $game_id], JSON_UNESCAPED_UNICODE);
    }


    public function getPlayerCombination() {
        $json_paras = json_decode(file_get_contents('php://input'), true);

        $user1 = ['userid' => 837590, 'nickname' => 'Alex', 'avatar' => 'https://qiaoyincapital.com/avatar/2025/06/19/avatar_837590_1750302596.jpeg', 'handicap' => 0];
        $user2 = ['userid' => 14, 'nickname' => 'awen', 'avatar' => 'https://qiaoyincapital.com//avatar/14.png', 'handicap' => 0];
        $user3 = ['userid' => 59, 'nickname' => '唐昆', 'avatar' => 'https://qiaoyincapital.com//avatar/59.png', 'handicap' => 0];
        $user4 = ['userid' => 122, 'nickname' => 'nice6', 'avatar' => 'https://qiaoyincapital.com//avatar/122.png', 'handicap' => 0];




        $user5 = ['userid' => 837590, 'nickname' => 'Alex', 'avatar' => 'https://qiaoyincapital.com/avatar/2025/06/19/avatar_837590_1750302596.jpeg', 'handicap' => 27.8];
        $user6 = ['userid' => 126, 'nickname' => 'ecoeco', 'avatar' => 'https://qiaoyincapital.com//avatar/126.png', 'handicap' => 3.8];
        $user7 = ['userid' => 245, 'nickname' => 'JoYa', 'avatar' => 'https://qiaoyincapital.com//avatar/245.jpg', 'handicap' => 15.6];
        $user8 = ['userid' => 246, 'nickname' => '阿咪阿咪红', 'avatar' => 'https://qiaoyincapital.com//avatar/246.png', 'handicap' => 0];

        $group1 = [$user1, $user2, $user3, $user4];
        $group2 = [$user5, $user6, $user7, $user8];
        $combination = [$group1, $group2];
        echo json_encode(['code' => 200, 'combination' => $combination], JSON_UNESCAPED_UNICODE);
    }


    public function createBlankGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $uuid = $json_paras['uuid'];
        $row = [];
        $row['uuid'] = $uuid;
        $row['creatorid'] = $userid;
        $row['create_time'] = date('Y-m-d H:i:s');
        $row['private'] = 'n';
        $row['scoring_type'] = 'hole';
        $row['privacy_password'] = null;
        $row['status'] = 'init';
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
        $private = $json_paras['isPrivate'];

        if ($private) {
            $private = 'y';
        } else {
            $private = 'n';
            $this->db->where('uuid', $uuid);
            $this->db->update('t_game', ['privacy_password' => null]);
        }


        $this->db->where('uuid', $uuid);
        $this->db->update('t_game', ['private' => $private]);

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '隐私设置更新成功';
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    public function updateGamepPivacyPassword() {
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

    public function savePrivateWhiteList() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($json_paras['gameid']) ? intval($json_paras['gameid']) : 0;
        $request_userid = isset($json_paras['userid']) ? intval($json_paras['userid']) : 0;
        $userid = intval($this->getUser());

        if ($gameid <= 0) {
            echo json_encode(['code' => 400, 'message' => '缺少有效的 gameid'], JSON_UNESCAPED_UNICODE);
            return;
        }

        if ($request_userid > 0 && $request_userid !== $userid) {
            echo json_encode(['code' => 403, 'message' => 'userid 与登录用户不匹配'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MPrivateWhiteList->addWhiteList($userid, $gameid);

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = $result['created'] ? '白名单已添加' : '白名单已存在';
        $ret['data'] = [
            'gameid' => $gameid,
            'userid' => $userid,
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
        // gameid status to enrolling   
        $this->db->where('id', $gameid);
        $this->db->update('t_game', ['status' => 'enrolling']);

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
        $qrcodePath = FCPATH . '../upload/qrcodes/' . $filename;

        // 生成微信小程序二维码
        $access_token = $this->getWechatAccessToken();
        $wechat_api_url = "https://api.weixin.qq.com/wxa/getwxacode?access_token={$access_token}";

        // 优先使用前端传递的 path 参数，如果没有则使用默认路径
        $path = isset($params['path']) ? $params['path'] : "pages/player-select/wxShare/wxShare?uuid={$uuid}&gameid={$gameid}";
        // 移除路径开头的斜杠（微信小程序路径不需要前导斜杠）
        $path = ltrim($path, '/');

        $post_data = json_encode([
            'path' => $path,
            'width' => 430
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $wechat_api_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $result = curl_exec($ch);
        curl_close($ch);

        // 保存二维码
        $upload_path = FCPATH . '../upload/qrcodes/';
        if (!is_dir($upload_path)) {
            mkdir($upload_path, 0755, true);
        }
        file_put_contents($qrcodePath, $result);

        $web_url = config_item('web_url');
        $qrcodeUrl = $web_url . '/upload/qrcodes/' . $filename;

        echo json_encode([
            'code' => 200,
            'message' => '二维码生成成功',
            'qrcode_url' => $qrcodeUrl,
        ], JSON_UNESCAPED_UNICODE);
    }

    private function getWechatAccessToken() {
        $appid = config_item('appid');
        $secret = config_item('secret');
        $url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={$appid}&secret={$secret}";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        return $result['access_token'];
    }

    public function gameDetail() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = $json_paras['gameid'];
        $game_detail = $this->MDetailGame->getGameDetail($gameid);
        $red_blue  = $this->getFirst4PlayersGambleRedBlug($gameid);
        echo json_encode(
            ['code' => 200, 'game_detail' => $game_detail, 'red_blue' => $red_blue],
            JSON_UNESCAPED_UNICODE
        );
    }



    public function getFirst4PlayersGambleRedBlug($game_id) {


        $this->load->model('GamblePipe');
        $this->load->model('GamblePipeRunner');
        $this->load->model('gamble/MGambleDataFactory');
        $this->load->model('gamble/MRuntimeConfig');
        $this->load->model('gamble/MStroking');
        $this->load->model('gamble/MIndicator');
        $this->load->model('gamble/MRedBlue');
        $this->load->model('gamble/MMoney');
        $this->load->model('gamble/MRanking');
        $this->load->model('gamble/GambleContext');
        $this->load->model('gamble/MRanking');
        $this->load->model('gamble/GambleContext');
        $this->load->model('gamble/MMeat');
        $this->load->model('gamble/MDonation');


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
                'userid' => $row['creator_id']
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
        if ($game_info['status'] == 'finished' || $game_info['status'] == 'canceled') {
            echo json_encode(['code' => 500, 'message' => '球局已结束或取消'], JSON_UNESCAPED_UNICODE);
            return;
        }


        $group_id = $json_paras['groupid'];
        $hole_unique_key = $json_paras['holeUniqueKey'];
        $scores = $json_paras['scores'];
        $this->MScore->saveScore($game_id, $group_id, $hole_unique_key, $hindex, $scores);
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
            $userId = (int) $params['userid'];
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
        $userid = $json_paras['userid'];
        $uuid = $json_paras['uuid'];
        $gameid = $this->MGame->getGameidByUUID($uuid);
        $tee = $json_paras['tee'];
        $this->MGame->setTee($gameid, $userid, $tee);
        echo json_encode(['code' => 200, 'message' => '保存成功'], JSON_UNESCAPED_UNICODE);
    }

    public function cancelGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = $json_paras['gameid'];
        $this->MGame->cancelGame($gameid, null);
        echo json_encode(['code' => 200, 'message' => '取消成功'], JSON_UNESCAPED_UNICODE);
    }

    public function finishGame() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = $json_paras['gameid'];
        $this->MGame->finishGame($gameid, null);
        echo json_encode(['code' => 200, 'message' => '结束球局成功'], JSON_UNESCAPED_UNICODE);
    }

    public function removePlayer() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = isset($json_paras['gameid']) ? (int)$json_paras['gameid'] : 0;
        $userid = isset($json_paras['userid']) ? (int)$json_paras['userid'] : 0;

        if ($gameid <= 0 || $userid <= 0) {
            echo json_encode(['code' => 400, 'message' => '参数错误'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $result = $this->MGame->removePlayer($gameid, $userid);
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

        if (empty($userids) || !is_array($userids)) {
            echo json_encode(['code' => 400, 'message' => '缺少有效的用户列表'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $successList = [];
        $failedList = [];

        foreach ($userids as $userid) {
            $userid = (int)$userid;
            if ($userid <= 0) {
                $failedList[] = ['userid' => $userid, 'reason' => '无效的用户ID'];
                continue;
            }

            $joinResult = $this->MGame->gameJoinHandler($userid, $gameid, 'friendAdd');

            if ((int)$joinResult['code'] === 200) {
                $successList[] = $userid;
            } else {
                $failedList[] = [
                    'userid' => $userid,
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
}
