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

        //  更新这个比赛的洞序

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
        $ret['message'] = '比赛名称更新成功';
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
        $path = $params['path'];
        $gameid = (int) $params['gameid'];

        $filenameSeed = preg_replace('/[^A-Za-z0-9]/', '', $uuid);
        $filename = "game_invite_{$filenameSeed}_{$gameid}.png";
        $qrcodePath = FCPATH . '../upload/qrcodes/' . $filename;

        // 生成微信小程序二维码
        $access_token = $this->getWechatAccessToken();
        $wechat_api_url = "https://api.weixin.qq.com/wxa/getwxacode?access_token={$access_token}";

        $post_data = json_encode([
            'path' => "pages/player-select/wxshare/wxshare?uuid={$uuid}&gameid={$gameid}",
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
        $qrcodeBase64 = base64_encode($result);

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
            echo json_encode(['code' => 500, 'message' => '比赛已结束或取消'], JSON_UNESCAPED_UNICODE);
            return;
        }


        $group_id = $json_paras['groupid'];
        $hole_unique_key = $json_paras['holeUniqueKey'];
        $scores = $json_paras['scores'];
        $this->MScore->saveScore($game_id, $group_id, $hole_unique_key, $hindex, $scores);
        echo json_encode(['code' => 200, 'message' => '保存成功'], JSON_UNESCAPED_UNICODE);
    }

    public function joinGame() {
        $params = json_decode(file_get_contents('php://input'), true);

        $uuid = isset($params['uuid']) ? trim($params['uuid']) : '';
        $userId = (int) $this->getUser();
        if ($userId <= 0) {
            echo json_encode(['code' => 401, 'message' => '未登录'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $gameid = isset($params['gameid']) ? (int) $params['gameid'] : 0;
        $joinType = isset($params['source']) && $params['source'] !== '' ? $params['source'] : 'wxshare';

        // 检查用户是否已经加入比赛
        $existingRecord = $this->db->select('id, groupid')
            ->from('t_game_group_user')
            ->where('gameid', $gameid)
            ->where('userid', $userId)
            ->get()
            ->row_array();

        if ($existingRecord) {
            echo json_encode(['code' => 409, 'message' => '您已经加入此比赛'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 获取所有现有组及其人数
        $groups = $this->fetchGameGroupsWithCount($gameid);

        // 如果没有组，创建第一个组
        if (empty($groups)) {
            $newGroup = $this->createGameGroupRow($gameid, 1);
            $targetGroupId = $newGroup['groupid'];
        } else {
            // 查找第一个未满4人的组
            $targetGroupId = null;
            foreach ($groups as $group) {
                if ((int) $group['player_count'] < 4) {
                    $targetGroupId = (int) $group['groupid'];
                    break;
                }
            }

            // 如果所有组都满了，创建新组
            if ($targetGroupId === null) {
                $nextGroupNumber = count($groups) + 1;
                $newGroup = $this->createGameGroupRow($gameid, $nextGroupNumber);
                $targetGroupId = $newGroup['groupid'];
            }
        }

        // 加入比赛
        $now = date('Y-m-d H:i:s');
        $joinData = [
            'gameid' => $gameid,
            'groupid' => $targetGroupId,
            'userid' => $userId,
            'tee' => 'blue',
            'confirmed' => 0,
            'confirmed_time' => null,
            'addtime' => $now,
            'join_type' => $joinType
        ];
        $this->db->insert('t_game_group_user', $joinData);

        // 更新游戏状态为报名中
        $this->db->where('id', $gameid);
        $this->db->update('t_game', ['status' => 'enrolling']);

        echo json_encode([
            'code' => 200,
            'message' => '加入成功',
            'data' => [
                'uuid' => $uuid,
                'gameid' => $gameid,
                'groupid' => $targetGroupId,
                'join_type' => $joinType
            ]
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
        echo json_encode(['code' => 200, 'message' => '结束比赛成功'], JSON_UNESCAPED_UNICODE);
    }

    private function fetchGameGroupsWithCount($gameid) {
        $query = $this->db->select('gg.groupid, gg.group_name, COUNT(ggu.id) AS player_count', false)
            ->from('t_game_group gg')
            ->join('t_game_group_user ggu', 'gg.gameid = ggu.gameid AND gg.groupid = ggu.groupid', 'left')
            ->where('gg.gameid', $gameid)
            ->group_by('gg.groupid')
            ->order_by('gg.groupid', 'ASC')
            ->get();

        $groups = [];
        foreach ($query->result_array() as $row) {
            $groups[] = [
                'groupid' => (int) $row['groupid'],
                'group_name' => $row['group_name'],
                'player_count' => (int) $row['player_count']
            ];
        }

        return $groups;
    }

    private function createGameGroupRow($gameid, $groupNumber) {
        $now = date('Y-m-d H:i:s');
        $groupData = [
            'gameid' => $gameid,
            'group_name' => '组' . $groupNumber,
            'group_create_time' => $now,
            'group_start_status' => '0',
            'group_all_confirmed' => 0
        ];
        $this->db->insert('t_game_group', $groupData);

        return [
            'groupid' => (int) $this->db->insert_id(),
            'group_name' => $groupData['group_name'],
            'player_count' => 0
        ];
    }

    private function buildGameInvitePath($uuid, $gameId, $gameName = '') {
        if ($uuid === '') {
            return '';
        }

        $query = ["uuid={$uuid}"];
        if ($gameId > 0) {
            $query[] = 'gameid=' . $gameId;
        }

        if ($gameName !== '') {
            if (function_exists('mb_substr')) {
                $safeTitle = mb_substr($gameName, 0, 50);
            } else {
                $safeTitle = substr($gameName, 0, 50);
            }
            $query[] = 'title=' . rawurlencode($safeTitle);
        }

        return '/pages/player-select/wxshare/wxshare?' . implode('&', $query);
    }
}
