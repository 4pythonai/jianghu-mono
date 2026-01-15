<?php

class MGame  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }

  /**
   * 根据 UUID 获取球局 ID
   * @param string $uuid 球局 UUID
   * @return int|null 球局 ID，如果未找到则返回 null
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


  public function clearGameCourt($gameid) {
    $this->db->where('gameid', $gameid)
      ->delete('t_game_court');
    return $this->db->affected_rows();
  }



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
    $firstGroupId = null;

    foreach ($groups as $gpidx => $group) {
      // 检查组中是否有玩家
      if (empty($group['players'])) {
        continue;
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
      $groupid = $this->db->insert_id();

      // 记录第一个组的ID
      if ($firstGroupId === null) {
        $firstGroupId = $groupid;
      }

      // 插入每个玩家到 t_game_group_user 表
      foreach ($group['players'] as $player) {
        if (empty($player['userid'])) {
          continue;
        }

        $playerData = [
          'gameid' => $gameid,
          'groupid' => $groupid,
          'user_id' => $player['userid'],
          'tee' => isset($player['tee']) && !empty($player['tee']) ? $player['tee'] : 'blue',
          'confirmed' => 0,
          'confirmed_time' => null,
          'addtime' => date('Y-m-d H:i:s'),
          'join_type' => isset($player['join_type']) ? $player['join_type'] : 'manual'
        ];
        $this->db->insert('t_game_group_user', $playerData);
      }
    }

    return $firstGroupId;
  }


  public function setTee($gameid, $userid, $tee) {
    $this->db->where('gameid', $gameid)
      ->where('user_id', $userid)
      ->update('t_game_group_user', ['tee' => $tee]);
  }


  public function cancelGame($gameid) {
    $this->db->where('id', $gameid)
      ->update('t_game', ['game_status' => 'cancelled']);
  }

  public function finishGame($gameid) {
    $this->db->where('id', $gameid)
      ->update('t_game', ['game_status' => 'finished']);
  }

  /**
   * 从球局中移除玩家
   * @param int $gameid 球局ID
   * @param int $userid 要移除的用户ID
   * @return array 操作结果
   */
  public function removePlayer($gameid, $userid) {
    // 检查是否是创建者
    $game = $this->db->select('creatorid')
      ->from('t_game')
      ->where('id', $gameid)
      ->get()
      ->row_array();

    if ($game && (int)$game['creatorid'] === (int)$userid) {
      return [
        'code' => 403,
        'message' => '不能移除比赛创建者'
      ];
    }

    // 获取用户所在的 groupid
    $playerRecord = $this->db->select('groupid')
      ->from('t_game_group_user')
      ->where('gameid', $gameid)
      ->where('userid', $userid)
      ->get()
      ->row_array();

    if (!$playerRecord) {
      return [
        'code' => 404,
        'message' => '未找到该玩家'
      ];
    }

    $groupid = $playerRecord['groupid'];

    // 使用事务处理多表删除
    $this->db->trans_start();

    // 1. 删除该用户的比分记录
    $this->db->where('gameid', $gameid)
      ->where('user_id', $userid)
      ->delete('t_game_score');

    // 2. 删除该 group 的 gamble 配置
    $this->db->where('gameid', $gameid)
      ->where('groupid', $groupid)
      ->delete('t_gamble_x_runtime');

    // 3. 删除玩家
    $this->db->where('gameid', $gameid)
      ->where('user_id', $userid)
      ->delete('t_game_group_user');

    // 4. 检查该 group 是否还有用户，如果没有则删除该组
    $remainingPlayers = $this->db->select('COUNT(*) as count')
      ->from('t_game_group_user')
      ->where('gameid', $gameid)
      ->where('groupid', $groupid)
      ->get()
      ->row_array();

    if ((int)$remainingPlayers['count'] === 0) {
      $this->db->where('gameid', $gameid)
        ->where('groupid', $groupid)
        ->delete('t_game_group');
    }

    $this->db->trans_complete();

    if ($this->db->trans_status() === FALSE) {
      return [
        'code' => 500,
        'message' => '移除失败，请重试'
      ];
    }

    return [
      'code' => 200,
      'message' => '移除成功'
    ];
  }


  public function gameJoinHandler($userid, $gameid, $joinType = 'wxshare') {
    $response = [
      'code' => 200,
      'message' => '加入成功!!!',
      'data' => [
        'groupid' => null,
        'join_type' => $joinType,
        'record_id' => null
      ]
    ];

    $existingRecord = $this->db->select('id, groupid, join_type')
      ->from('t_game_group_user')
      ->where('gameid', $gameid)
      ->where('user_id', $userid)
      ->get()
      ->row_array();

    if ($existingRecord) {
      $response['code'] = 409;
      $response['message'] = '您已经加入此比赛';
      $response['data']['groupid'] = (int) $existingRecord['groupid'];
      $response['data']['record_id'] = (int) $existingRecord['id'];
      $response['data']['join_type'] = $existingRecord['join_type'] ?? $joinType;
      return $response;
    }

    $groups = $this->fetchGameGroupsWithCount($gameid);

    if (empty($groups)) {
      $newGroup = $this->createGameGroupRow($gameid, 1);
      $targetGroupId = $newGroup['groupid'];
    } else {
      $targetGroupId = null;
      foreach ($groups as $group) {
        if ((int) $group['player_count'] < 4) {
          $targetGroupId = (int) $group['groupid'];
          break;
        }
      }

      if ($targetGroupId === null) {
        $nextGroupNumber = count($groups) + 1;
        $newGroup = $this->createGameGroupRow($gameid, $nextGroupNumber);
        $targetGroupId = $newGroup['groupid'];
      }
    }

    if (!$targetGroupId) {
      $response['code'] = 500;
      $response['message'] = '未能创建比赛分组';
      return $response;
    }

    $now = date('Y-m-d H:i:s');
    $joinData = [
      'gameid' => $gameid,
      'groupid' => $targetGroupId,
      'user_id' => $userid,
      'tee' => 'blue',
      'confirmed' => 0,
      'confirmed_time' => null,
      'addtime' => $now,
      'join_type' => $joinType
    ];
    $this->db->insert('t_game_group_user', $joinData);
    $response['data']['record_id'] = (int) $this->db->insert_id();

    // 检查当前比赛状态，如果已经是 "playing" 则不能改成 "registering"
    $currentGame = $this->db->select('game_status')
      ->from('t_game')
      ->where('id', $gameid)
      ->get()
      ->row_array();

    if ($currentGame && $currentGame['game_status'] !== 'playing') {
      $this->db->where('id', $gameid)
        ->update('t_game', ['game_status' => 'registering']);
    }

    $response['data']['groupid'] = $targetGroupId;
    $this->writeWebSocketMsg($userid, $gameid);
    return $response;
  }


  public function m_get_group_info($groupid) {
    return $this->db->select("user_id, COALESCE(display_name, wx_name) as username, COALESCE(display_name, wx_name) as display_name, t_user.avatar as cover", false)
      ->from('t_game_group_user')
      ->join('t_user', 't_user.id = t_game_group_user.user_id')
      ->where('t_game_group_user.groupid', $groupid)
      ->get()
      ->result_array();
  }


  private function fetchGameGroupsWithCount($gameid) {
    $query = $this->db->select('gg.groupid, gg.group_name, COUNT(ggu.id) AS player_count', false)
      ->from('t_game_group gg')
      ->join('t_game_group_user ggu', 'gg.gameid = ggu.gameid AND gg.groupid = ggu.groupid', 'left')
      ->where('gg.gameid', $gameid)
      ->group_by('gg.groupid')
      ->order_by('gg.groupid', 'ASC')
      ->get();

    $groups = [];
    foreach ($query->result_array() as $row) {
      $groups[] = [
        'groupid' => (int) $row['groupid'],
        'group_name' => $row['group_name'],
        'player_count' => (int) $row['player_count']
      ];
    }

    return $groups;
  }


  private function createGameGroupRow($gameid, $groupNumber) {
    $now = date('Y-m-d H:i:s');
    $groupData = [
      'gameid' => $gameid,
      'group_name' => '组' . $groupNumber,
      'group_create_time' => $now,
      'group_start_status' => '0',
      'group_all_confirmed' => 0
    ];
    $this->db->insert('t_game_group', $groupData);

    return [
      'groupid' => (int) $this->db->insert_id(),
      'group_name' => $groupData['group_name'],
      'player_count' => 0
    ];
  }

  public function writeWebSocketMsg($userid, $gameid) {

    $user = $this->MUser->getUserProfile($userid);

    $payload = [];
    $payload['gameId'] = $gameid;
    $payload['playerId'] = $userid;
    $payload['display_name'] = !empty($user['display_name']) ? $user['display_name'] : $user['wx_name'];
    $payload['avatar'] = $user['avatar'];
    $payload['message'] = 'msgFromMgame';


    $endpoint = getenv('WORKERMAN_PUSH_ENDPOINT');
    if (!$endpoint) {
      $endpoint = 'http://127.0.0.1:2347/push';
    }

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_POST => true,
      CURLOPT_HTTPHEADER => [
        'Content-Type: application/json'
      ],
      CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
      CURLOPT_TIMEOUT => 5,
      CURLOPT_CONNECTTIMEOUT => 3
    ]);

    $responseBody = curl_exec($ch);
    $curlError = curl_error($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    $ret = [];
    $ret['endpoint'] = $endpoint;
    $ret['payload'] = $payload;
    $ret['statusCode'] = $statusCode;
    $ret['response'] = $responseBody;
    if ($curlError) {
      $ret['error'] = $curlError;
    }
    return $ret;
  }
}
