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
        // $game_id = $json_paras['game_id'];
        $user_id = $json_paras['user_id'];
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

        // $group_id = $this->db->insert_id();
        // $this->db->insert('t_game_players', [
        //     'game_id' => $game_id,
        //     'user_id' => $user_id,
        //     'group_id' => $group_id
        // ]);

        echo json_encode(['code' => 200, 'game_id' => $game_id], JSON_UNESCAPED_UNICODE);
    }


    public function getPlayerCombination() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        // $user_id = $json_paras['user_id'];
        // 837590

        $user1 = ['userid' => 837590, 'nickname' => 'Alex', 'coverpath' => 'https://qiaoyincapital.com/avatar/2025/06/19/avatar_837590_1750302596.jpeg', 'handicap' => 0];
        $user2 = ['userid' => 14, 'nickname' => 'awen', 'coverpath' => 'https://qiaoyincapital.com//avatar/14.png', 'handicap' => 0];
        $user3 = ['userid' => 59, 'nickname' => '唐昆', 'coverpath' => 'https://qiaoyincapital.com//avatar/59.png', 'handicap' => 0];
        $user4 = ['userid' => 122, 'nickname' => 'nice6', 'coverpath' => 'https://qiaoyincapital.com//avatar/122.png', 'handicap' => 0];




        $user5 = ['userid' => 837590, 'nickname' => 'Alex', 'coverpath' => 'https://qiaoyincapital.com/avatar/2025/06/19/avatar_837590_1750302596.jpeg', 'handicap' => 27.8];
        $user6 = ['userid' => 126, 'nickname' => 'ecoeco', 'coverpath' => 'https://qiaoyincapital.com//avatar/126.png', 'handicap' => 3.8];
        $user7 = ['userid' => 245, 'nickname' => 'JoYa', 'coverpath' => 'https://qiaoyincapital.com//avatar/245.jpg', 'handicap' => 15.6];
        $user8 = ['userid' => 246, 'nickname' => '阿咪阿咪红', 'coverpath' => 'https://qiaoyincapital.com//avatar/246.png', 'handicap' => 0];

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
        $this->db->insert('t_game', $row);
        $game_id = $this->db->insert_id();
        echo json_encode(['code' => 200, 'uuid' => $uuid, 'game_id' => $game_id], JSON_UNESCAPED_UNICODE);
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
        } else {
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

    public function updateGameIsOneball() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $uuid = $json_paras['uuid'];
        $is_oneball = $json_paras['is_oneball'];

        $this->db->where('uuid', $uuid);
        $this->db->update('t_game', ['is_oneball' => $is_oneball]);

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = 'OneBall设置更新成功';
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
        $this->MGame->addGameGroupAndPlayers($gameid, $groups);
    }

    public function gameDetail() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $game_id = $json_paras['gameId'];
        $game_detail = $this->MDetailGame->get_detail_game($game_id);
        echo json_encode(['code' => 200, 'game_detail' => $game_detail], JSON_UNESCAPED_UNICODE);
    }
}
