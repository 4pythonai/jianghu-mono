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
}
