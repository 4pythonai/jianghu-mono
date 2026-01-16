<?php

class MPrivateWhiteList extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    /**
     * 获取用户已通过的私密球局ID列表
     * @param int $user_id 用户ID
     * @return array
     */
    public function getUserWhiteListGameIds($user_id) {
        $user_id = (int)$user_id;
        if ($user_id <= 0) {
            return [];
        }

        $rows = $this->db->select('gameid')
            ->from('t_private_white_list')
            ->where('user_id', $user_id)
            ->get()
            ->result_array();

        return array_map('intval', array_column($rows, 'gameid'));
    }

    /**
     * 判断用户是否已通过某个私密球局
     * @param int $user_id 用户ID
     * @param int $gameid 球局ID
     * @return bool
     */
    public function isUserWhitelisted($user_id, $gameid) {
        $user_id = (int)$user_id;
        $gameid = (int)$gameid;

        if ($user_id <= 0 || $gameid <= 0) {
            return false;
        }

        $row = $this->db->select('id')
            ->from('t_private_white_list')
            ->where('user_id', $user_id)
            ->where('gameid', $gameid)
            ->limit(1)
            ->get()
            ->row_array();

        return !empty($row);
    }

    /**
     * 将用户写入白名单(幂等)
     * @param int $user_id 用户ID
     * @param int $gameid 球局ID
     * @return array ['created' => bool, 'record_id' => int|null]
     */
    public function addWhiteList($user_id, $gameid) {
        $user_id = (int)$user_id;
        $gameid = (int)$gameid;

        if ($user_id <= 0 || $gameid <= 0) {
            return ['created' => false, 'record_id' => null];
        }

        $existing = $this->db->select('id')
            ->from('t_private_white_list')
            ->where('user_id', $user_id)
            ->where('gameid', $gameid)
            ->limit(1)
            ->get()
            ->row_array();

        if ($existing) {
            return ['created' => false, 'record_id' => (int)$existing['id']];
        }

        $this->db->insert('t_private_white_list', [
            'user_id' => $user_id,
            'gameid' => $gameid
        ]);

        return ['created' => true, 'record_id' => (int)$this->db->insert_id()];
    }
}
