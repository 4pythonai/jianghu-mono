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


    // http://s1.golf-brother.com
    // http://s1.golf-brother.com/data/attach/user/2017/04/30/074cfec13bb719376c0ee86c7def6d66.jpg

    // 老牌组合 
    // http://140.179.50.120:7800/
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
}
