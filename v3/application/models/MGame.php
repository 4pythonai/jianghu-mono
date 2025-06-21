<?php

class MGame  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }

  /**
   * 根据 UUID 获取游戏 ID
   * @param string $uuid 游戏 UUID
   * @return int|null 游戏 ID，如果未找到则返回 null
   */

  public function getGameidByUUID($uuid) {
    $query = $this->db->select('id')
      ->from('t_game')
      ->where('uuid', $uuid)
      ->get();

    if ($query->num_rows() > 0) {
      return $query->row()->id;
    }
    return null;
  }

  public function getGameCourtByGameid($gameid) {
    $query = $this->db->select('*')
      ->from('t_game_court')
      ->where('gameid', $gameid)
      ->get();
    return $query->result_array();
  }






  // CREATE TABLE `t_game_court` (
  //   `id` int NOT NULL AUTO_INCREMENT,
  //   `gameid` int DEFAULT '0' COMMENT '比赛id',
  //   `courtid` int DEFAULT NULL COMMENT '半场id',
  //   `court_key` int DEFAULT NULL COMMENT '半场标识',
  //   `uuid` char(32) DEFAULT NULL,
  //   PRIMARY KEY (`id`),
  //   KEY `idx_gameid` (`gameid`),
  //   KEY `idx_courtid` (`courtid`)
  // ) ENGINE=InnoDB AUTO_INCREMENT=3021110 DEFAULT CHARSET=utf8mb3 COMMENT='比赛半场表';


  public function clearGameCourt($gameid) {
    $this->db->where('gameid', $gameid)
      ->delete('t_game_court');
    return $this->db->affected_rows();
  }



  // [uuid] => 81a9ecb5-9195-4ade-ab8b-bde8a73f834b
  // [courseid] => 3
  // [frontNineCourtId] => 2590
  // [backNineCourtId] => 2590
  // [gameType] => full
  // [totalHoles] => 18

  public function addGameCourt($gameid, $frontNineCourtId, $backNineCourtId) {
    $uuid = uniqid();
    $data = [];

    // 如果前9洞ID存在，添加前9洞记录
    if (!empty($frontNineCourtId)) {
      $data[] = [
        'gameid' => $gameid,
        'courtid' => $frontNineCourtId,
        'court_key' => 1,
        'uuid' => $uuid
      ];
    }

    // 如果后9洞ID存在，添加后9洞记录
    if (!empty($backNineCourtId)) {
      $data[] = [
        'gameid' => $gameid,
        'courtid' => $backNineCourtId,
        'court_key' => 2,
        'uuid' => $uuid
      ];
    }

    // 如果有数据要插入
    if (!empty($data)) {
      $this->db->insert_batch('t_game_court', $data);
      return $this->db->affected_rows();
    }
  }


  public function clearGameGroupAndPlayers($gameid) {
    $this->db->where('gameid', $gameid)
      ->delete('t_game_group');
    $this->db->where('gameid', $gameid)
      ->delete('t_game_group_user');
  }


  public function addGameGroupAndPlayers($gameid, $groups) {
    foreach ($groups as $gpidx => $group) {
      // 检查组中是否有玩家
      if (empty($group['players'])) {
        continue; // 如果没有玩家，跳过该组
      }

      // 插入组信息到 t_game_group 表
      $groupData = [
        'gameid' => $gameid,
        'group_name' => '组' . ($gpidx + 1),
        'group_create_time' => date('Y-m-d H:i:s'),
        'group_start_status' => 0,
        'group_all_confirmed' => 0
      ];
      $this->db->insert('t_game_group', $groupData);
      $groupid = $this->db->insert_id(); // 获取插入的组ID

      // 插入每个玩家到 t_game_group_user 表
      foreach ($group['players'] as $player) {
        $playerData = [
          'gameid' => $gameid,
          'groupid' => $groupid,
          'userid' => $player['userid'],
          'tland' => null, // 根据需要设置
          'confirmed' => 0,
          'confirmed_time' => null,
          'addtime' => date('Y-m-d H:i:s'),
          'join_type' => $player['join_type'] // 根据需要设置
        ];
        $this->db->insert('t_game_group_user', $playerData);
      }
    }
  }
}
