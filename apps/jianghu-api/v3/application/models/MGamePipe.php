<?php

use League\Pipeline\StageInterface;

class MGamePipe extends CI_Model implements StageInterface {

    public $payload = [
        'userid' => null,
        'star_friends' => [],
    ];

    public function __invoke($cfg) {
        return $cfg;
    }

    public function init($config) {
        $this->payload['userid'] = $config['userid'];
        $this->getStarFriends();
    }


    private function getStarFriends() {
        $_tmpuserid = $this->payload['userid'];
        $sql = "SELECT * FROM t_friend WHERE userid  = $_tmpuserid  and ifstar = 'y' ";
        $rows = $this->db->query($sql)->result_array();
        $this->payload['star_friends'] =  $rows;
    }

    public function getStarGames() {
        $_tmpuserid = $this->payload['userid'];
        $sql = "SELECT * FROM t_my_stared_games WHERE userid = $_tmpuserid ";
        $rows = $this->db->query($sql)->result_array();
        $this->payload['star_games'] =  $rows;
    }


    public function getStarFriendsGames() {
        return  [];
    }


    public function getMyGames() {
        $sql = "SELECT * FROM t_game  where  courseid is not null  and game_status != 'init' order by id   desc limit 100";
        $rows = $this->db->query($sql)->result_array();
        $this->payload['allgames'] =  $rows;
    }

    public function setRealRows() {
        $this->payload['realgames']  = $this->payload['allgames'];
    }

    public function debug() {
        header('Content-Type: application/json');
        echo json_encode($this->payload, JSON_PRETTY_PRINT);
    }


    public function getter() {
        return  $this->payload;
    }
}
