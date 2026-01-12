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
        $sql = "SELECT * FROM t_follow WHERE userid  = $_tmpuserid  and ifstar = 'y' ";
        $rows = $this->db->query($sql)->result_array();
        $this->payload['star_friends'] =  $rows;
    }

    public function getStarGames() {
        $_tmpuserid = $this->payload['userid'];

        // 查询星标比赛的 gameid 列表
        $sql = "SELECT gameid FROM t_my_stared_games WHERE userid = $_tmpuserid";
        $rows = $this->db->query($sql)->result_array();
        $starGameIds = array_column($rows, 'gameid');

        // DEBUG: 记录星标查询结果
        logtext("[getStarGames] userid=$_tmpuserid, starGameIds=" . json_encode($starGameIds));

        if (empty($starGameIds)) {
            return;
        }

        // 查询星标比赛的详细信息（不限制 courseid）
        $gameIdList = implode(',', $starGameIds);
        $sql = "SELECT * FROM t_game WHERE id IN ($gameIdList)";
        $starGames = $this->db->query($sql)->result_array();

        // DEBUG: 记录查询到的比赛
        logtext("[getStarGames] starGames count=" . count($starGames));

        // 获取已有的 game id 列表，避免重复
        $existingIds = array_column($this->payload['allgames'] ?? [], 'id');

        // 合并星标比赛到 allgames（去重）
        foreach ($starGames as $game) {
            if (!in_array($game['id'], $existingIds)) {
                $this->payload['allgames'][] = $game;
                $existingIds[] = $game['id'];
            }
        }

        // DEBUG: 记录合并后的总数
        logtext("[getStarGames] allgames count after merge=" . count($this->payload['allgames']));
    }


    public function getStarFriendsGames() {
        return  [];
    }


    public function getMyGames() {
        $sql = "SELECT * FROM t_game  where  courseid is not null order by id   desc limit 100";
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
