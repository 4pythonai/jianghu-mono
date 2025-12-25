<?php

class MPrivateWhiteList extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    /**
     * 获取用户已通过的私密球局ID列表
     * @param int $userid 用户ID
     * @return array
     */
    public function getUserWhiteListGameIds($userid) {
        $userid = (int)$userid;
        if ($userid <= 0) {
            return [];
        }

        $rows = $this->db->select('gameid')
            ->from('t_private_white_list')
            ->where('userid', $userid)
            ->get()
            ->result_array();

        return array_map('intval', array_column($rows, 'gameid'));
    }

    /**
     * 判断用户是否已通过某个私密球局
     * @param int $userid 用户ID
     * @param int $gameid 球局ID
     * @return bool
     */
    public function isUserWhitelisted($userid, $gameid) {
        $userid = (int)$userid;
        $gameid = (int)$gameid;

        if ($userid <= 0 || $gameid <= 0) {
            return false;
        }

        $row = $this->db->select('id')
            ->from('t_private_white_list')
            ->where('userid', $userid)
            ->where('gameid', $gameid)
            ->limit(1)
            ->get()
            ->row_array();

        return !empty($row);
    }

    /**
     * 将用户写入白名单(幂等)
     * @param int $userid 用户ID
     * @param int $gameid 球局ID
     * @return array ['created' => bool, 'record_id' => int|null]
     */
    public function addWhiteList($userid, $gameid) {
        $userid = (int)$userid;
        $gameid = (int)$gameid;

        if ($userid <= 0 || $gameid <= 0) {
            return ['created' => false, 'record_id' => null];
        }

        $existing = $this->db->select('id')
            ->from('t_private_white_list')
            ->where('userid', $userid)
            ->where('gameid', $gameid)
            ->limit(1)
            ->get()
            ->row_array();

        if ($existing) {
            return ['created' => false, 'record_id' => (int)$existing['id']];
        }

        $this->db->insert('t_private_white_list', [
            'userid' => $userid,
            'gameid' => $gameid
        ]);

        return ['created' => true, 'record_id' => (int)$this->db->insert_id()];
    }
}
