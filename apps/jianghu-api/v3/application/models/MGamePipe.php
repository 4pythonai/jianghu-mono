<?php

use League\Pipeline\StageInterface;

/**
 * MGamePipe - 我的赛事数据管道
 * 
 * 用于获取"我的"Feed列表，包含三部分数据：
 * 1. "我"参与的所有赛事（即实际参与打球的）
 * 2. "我"未参与，但是"星标关注"对象参与打球的所有赛事
 * 3. "我"未参与，但是打了星标的所有赛事
 */
class MGamePipe extends CI_Model implements StageInterface {

    public $payload = [
        'user_id' => null,
        'star_friends' => [],
        'allgames' => [],
    ];

    public function __invoke($cfg) {
        return $cfg;
    }

    public function init($config) {
        $this->payload['user_id'] = $config['user_id'];
        $this->payload['allgames'] = [];
        $this->getStarFriends();
    }

    /**
     * 获取用户的星标关注列表
     * 星标关注：用户关注列表中标记了"特别关注"的人
     */
    private function getStarFriends() {
        $_tmpuser_id = $this->payload['user_id'];
        $sql = "SELECT * FROM t_user_follow WHERE user_id = $_tmpuser_id AND is_special = 'y'";
        $rows = $this->db->query($sql)->result_array();
        $this->payload['star_friends'] = $rows;
    }

    /**
     * 第一部分："我"参与的所有赛事
     * 查询 t_game_group_user 表，找出用户实际参与打球的比赛
     * 状态筛选：playing（正在进行）或 finished（已结束）
     */
    public function getMyGames() {
        $_tmpuser_id = $this->payload['user_id'];

        if (!$_tmpuser_id) {
            return;
        }

        $sql = "SELECT DISTINCT g.* 
                FROM t_game g
                INNER JOIN t_game_group_user ggu ON g.id = ggu.gameid
                WHERE ggu.user_id = $_tmpuser_id
                AND g.game_status IN ('playing', 'finished')
                ORDER BY g.create_time DESC
                LIMIT 100";
        $rows = $this->db->query($sql)->result_array();

        $this->payload['allgames'] = $rows;
    }

    /**
     * 第二部分："星标关注"对象参与打球的所有赛事
     * 查询星标好友参与的比赛，合并到 allgames（去重）
     * 状态筛选：playing（正在进行）或 finished（已结束）
     */
    public function getStarFriendsGames() {
        $_tmpuser_id = $this->payload['user_id'];
        $starFriends = $this->payload['star_friends'];

        if (empty($starFriends)) {
            return;
        }

        // 获取星标好友的 user_id 列表
        $starFriendIds = array_column($starFriends, 'target_id');
        $starFriendIdList = implode(',', $starFriendIds);

        // 查询星标好友参与的比赛
        $sql = "SELECT DISTINCT g.* 
                FROM t_game g
                INNER JOIN t_game_group_user ggu ON g.id = ggu.gameid
                WHERE ggu.user_id IN ($starFriendIdList)
                AND g.game_status IN ('playing', 'finished')
                ORDER BY g.create_time DESC
                LIMIT 100";
        $starFriendsGames = $this->db->query($sql)->result_array();

        // 获取已有的 game id 列表，避免重复
        $existingIds = array_column($this->payload['allgames'], 'id');

        // 合并星标好友的比赛到 allgames（去重）
        foreach ($starFriendsGames as $game) {
            if (!in_array($game['id'], $existingIds)) {
                $this->payload['allgames'][] = $game;
                $existingIds[] = $game['id'];
            }
        }
    }

    /**
     * 第三部分："我"打了星标的所有赛事
     * 查询 t_my_stared_games 表，找出用户主动标记星标的比赛
     * 状态筛选：playing（正在进行）或 finished（已结束）
     */
    public function getStarGames() {
        $_tmpuser_id = $this->payload['user_id'];

        // 查询星标比赛的 gameid 列表
        $sql = "SELECT gameid FROM t_my_stared_games WHERE user_id = $_tmpuser_id";
        $rows = $this->db->query($sql)->result_array();
        $starGameIds = array_column($rows, 'gameid');

        if (empty($starGameIds)) {
            return;
        }

        // 查询星标比赛的详细信息（筛选状态）
        $gameIdList = implode(',', $starGameIds);
        $sql = "SELECT * FROM t_game WHERE id IN ($gameIdList) AND game_status IN ('playing', 'finished')";
        $starGames = $this->db->query($sql)->result_array();

        // 获取已有的 game id 列表，避免重复
        $existingIds = array_column($this->payload['allgames'] ?? [], 'id');

        // 合并星标比赛到 allgames（去重）
        foreach ($starGames as $game) {
            if (!in_array($game['id'], $existingIds)) {
                $this->payload['allgames'][] = $game;
                $existingIds[] = $game['id'];
            }
        }
    }

    public function setRealRows() {
        $this->payload['realgames'] = $this->payload['allgames'];
    }

    public function debug() {
        header('Content-Type: application/json');
        echo json_encode($this->payload, JSON_PRETTY_PRINT);
    }

    public function getter() {
        return $this->payload;
    }
}
