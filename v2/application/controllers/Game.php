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
        $json_paras = (array) json_decode(file_get_contents('php://input'));
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

        $group_id = $this->db->insert_id();
        $this->db->insert('t_game_players', [
            'game_id' => $game_id,
            'user_id' => $user_id,
            'group_id' => $group_id
        ]);

        echo json_encode(['code' => 200, 'game_id' => $game_id], JSON_UNESCAPED_UNICODE);
    }


    public function getPlayerCombination() {
        $json_paras = (array) json_decode(file_get_contents('php://input'));
        // $user_id = $json_paras['user_id'];
        $user1 = ['userid' => 837545, 'nickname' => 'Alex', 'coverpath' => 'http://140.179.50.120:7800/avatar/p240_376beaa4c05158ba841306e8751adf80.png', 'handicap' => 0];
        $user2 = ['userid' => 14, 'nickname' => 'awen', 'coverpath' => 'http://140.179.50.120:7800/avatar/p240_376beaa4c05158ba841306e8751adf80.png', 'handicap' => 0];
        $user3 = ['userid' => 59, 'nickname' => '唐昆', 'coverpath' => 'http://140.179.50.120:7800/avatar/p240_376beaa4c05158ba841306e8751adf80.png', 'handicap' => 0];
        $user4 = ['userid' => 122, 'nickname' => 'nice6', 'coverpath' => 'http://140.179.50.120:7800/avatar/p240_376beaa4c05158ba841306e8751adf80.png', 'handicap' => 0];



        $user5 = ['userid' => 837545, 'nickname' => 'Alex', 'coverpath' => 'http://140.179.50.120:7800/avatar/p240_376beaa4c05158ba841306e8751adf80.png', 'handicap' => 0];
        $user6 = ['userid' => 126, 'nickname' => 'ecoeco', 'coverpath' => 'http://140.179.50.120:7800/avatar/p240_376beaa4c05158ba841306e8751adf80.png', 'handicap' => 0];
        $user7 = ['userid' => 245, 'nickname' => 'JoYa', 'coverpath' => 'http://140.179.50.120:7800/avatar/p240_376beaa4c05158ba841306e8751adf80.png', 'handicap' => 0];
        $user8 = ['userid' => 246, 'nickname' => '阿咪阿咪红', 'coverpath' => 'http://140.179.50.120:7800/avatar/p240_376beaa4c05158ba841306e8751adf80.png', 'handicap' => 0];

        $group1 = [$user1, $user2, $user3, $user4];
        $group2 = [$user5, $user6, $user7, $user8];
        $combination = [$group1, $group2];
        echo json_encode(['code' => 200, 'combination' => $combination], JSON_UNESCAPED_UNICODE);
    }


    public function createBlankGame() {
        $json_paras = (array) json_decode(file_get_contents('php://input'));
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



    public function updateGameCourseid() {
        $json_paras = (array) json_decode(file_get_contents('php://input'));
        $uuid = $json_paras['uuid'];
        $courseid = $json_paras['courseid'];

        $this->db->where('uuid', $uuid);
        $this->db->update('t_game', ['courseid' => $courseid]);

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '球场ID更新成功';
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    public function updateGameName() {
        $json_paras = (array) json_decode(file_get_contents('php://input'));
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
        $json_paras = (array) json_decode(file_get_contents('php://input'));
        $uuid = $json_paras['uuid'];
        $private = $json_paras['isPrivate'];

        $this->db->where('uuid', $uuid);
        $this->db->update('t_game', ['private' => $private]);

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '隐私设置更新成功';
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    public function updateGamepPivacyPassword() {
        $json_paras = (array) json_decode(file_get_contents('php://input'));
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
        $json_paras = (array) json_decode(file_get_contents('php://input'));
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
        $json_paras = (array) json_decode(file_get_contents('php://input'));
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
        $json_paras = (array) json_decode(file_get_contents('php://input'));
        $uuid = $json_paras['uuid'];
        $scoring_type = $json_paras['scoringType'];
        $this->db->where('uuid', $uuid);
        $this->db->update('t_game', ['scoring_type' => $scoring_type]);
        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '计分类型更新成功';
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }
}
