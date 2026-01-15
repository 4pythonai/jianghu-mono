<?php

class MUser  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }



  public function getUserProfile($user_id) {
    $this->db->where('id', $user_id);
    $user = $this->db->get('t_user')->row_array();
    return $user;
  }




  public function addWeixinUser($openid) {

    $this->db->where('openid', $openid);
    $user = $this->db->get('t_user')->row_array();
    if ($user) {
      return $user['id'];
    } else {
      $new_user = ['openid' => $openid, 'reg_type' => 'weixin', 'addtime' => date('Y-m-d H:i:s')];
      $this->db->insert('t_user', $new_user);
      return $this->db->insert_id();
    }
  }


  public function  openidExists($openid) {
    $this->db->where('openid', $openid);
    $user = $this->db->get('t_user')->row_array();
    return $user ? true : false;
  }

  public function getUserbyOpenid($openid) {
    $this->db->where('openid', $openid);
    $user = $this->db->get('t_user')->row_array();
    return $user;
  }



  public function getUserbyMobile($mobile) {
    $this->db->where('mobile', $mobile);
    $user =  $this->db->get('t_user')->row_array();
    return $user;
  }


  public function getUserbyId($user_id) {
    $this->db->where('id', $user_id);
    $user = $this->db->get('t_user')->row_array();
    return $user;
  }



  public function updateDisplayName($userid, $display_name) {
    $this->db->where('id', $userid);
    $this->db->update('t_user', ['display_name' => $display_name]);
  }





  public  function updateUserPhone($userid, $phoneNumber) {
    $this->db->where('id', $userid);
    $this->db->update('t_user', ['mobile' => $phoneNumber]);
  }





  /**
   * 获取好友列表
   * 
   * 好友定义：互相关注（我关注他 且 他也关注我）
   * 排除：我拉黑的人 或 拉黑我的人
   */
  public function getFriends($userid) {
    $sql = "SELECT u.wx_name, u.display_name, u.avatar, u.openid, u.unionid,
                   f1.fuserid as userid, f1.nickname as remark_name, f1.is_special
            FROM t_user_follow f1
            -- 互相关注：他也关注了我
            JOIN t_user_follow f2 ON f1.userid = f2.fuserid AND f1.fuserid = f2.userid
            JOIN t_user u ON f1.fuserid = u.id
            WHERE f1.userid = ?
            -- 排除我拉黑的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b1
                WHERE b1.userid = f1.userid AND b1.blocked_userid = f1.fuserid
            )
            -- 排除拉黑我的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b2
                WHERE b2.userid = f1.fuserid AND b2.blocked_userid = f1.userid
            )";

    $friends = $this->db->query($sql, [$userid])->result_array();

    // 为前端添加 display_name 字段：优先使用备注名，其次 display_name，最后 wx_name
    foreach ($friends as &$friend) {
      $friend['display_name'] = !empty($friend['remark_name']) ? $friend['remark_name'] : (!empty($friend['display_name']) ? $friend['display_name'] : $friend['wx_name']);
    }

    return $friends;
  }

  /**
   * 获取我关注的人列表
   * 
   * 排除：我拉黑的人 或 拉黑我的人
   */
  public function getFollowings($userid) {
    $sql = "SELECT u.wx_name, u.display_name, u.avatar, u.openid, u.unionid,
                   u.handicap, u.signature,
                   f.fuserid as userid, f.nickname as remark_name, f.is_special
            FROM t_user_follow f
            JOIN t_user u ON f.fuserid = u.id
            WHERE f.userid = ?
            -- 排除我拉黑的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b1
                WHERE b1.userid = f.userid AND b1.blocked_userid = f.fuserid
            )
            -- 排除拉黑我的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b2
                WHERE b2.userid = f.fuserid AND b2.blocked_userid = f.userid
            )";

    $followings = $this->db->query($sql, [$userid])->result_array();

    foreach ($followings as &$following) {
      $following['display_name'] = !empty($following['remark_name']) ? $following['remark_name'] : (!empty($following['display_name']) ? $following['display_name'] : $following['wx_name']);
    }

    return $followings;
  }





  public function doubleSearchMobile($mobile) {
    $this->db->where('can_mobile_search', 'y');
    $this->db->where('mobile', $mobile);
    $user = $this->db->get('t_user')->row_array();
    if ($user) {
      return ['source' => 'mini', 'user' => $user];
    }

    $user = $this->MJHUser->getJianghuUserByMobile($mobile);
    if ($user) {
      return ['source' => 'jhapp', 'user' => $user];
    }
    return ['source' => 'double', 'user' => null];
  }

  //添加非注册用户
  public function addRemakGhostUser($helperid, $remarkName, $mobile) {
    $new_user = [
      'display_name' => $remarkName,
      'mobile' => $mobile,
      'addtime' => date('Y-m-d H:i:s'),
      'reg_type' => 'manualAdd',
      'avatar' =>  '/avatar/user_default_avatar.png',
      'helper_id' => $helperid
    ];
    $this->db->insert('t_user', $new_user);
    return $this->db->insert_id();
  }

  //添加半注册用户
  public function addMobileGhostUser($helperid, $remarkName, $mobile) {
    $new_user = [
      'display_name' => $remarkName,
      'mobile' => $mobile,
      'addtime' => date('Y-m-d H:i:s'),
      'reg_type' => 'manualAddWithMobile',
      'avatar' =>  '/avatar/user_default_avatar.png',
      'helper_id' => $helperid
    ];
    $this->db->insert('t_user', $new_user);
    return $this->db->insert_id();
  }



  public function transferJHUser($jhuser) {
    // downloadJHAvatar
    $jh_avatar_url = "http://s1.golf-brother.com/data/attach/" . $jhuser['coverpath'] . "/" . $jhuser['covername'];
    $avatar_result = downloadJHAvatar($jh_avatar_url);

    if ($avatar_result['success']) {
      $app_avatar_url = $avatar_result['relative_path'];
    } else {
      $app_avatar_url = '/avatar/user_default_avatar.png';
    }


    $row = [];
    $row['display_name'] = $jhuser['nickname'];
    $row['wx_name'] = $jhuser['nickname'];
    $row['mobile'] = $jhuser['mobile'];
    $row['handicap'] = $jhuser['handicap'];
    $row['reg_type'] = 'jhtransfer';
    $row['avatar'] = $app_avatar_url;
    $row['addtime'] = date('Y-m-d H:i:s');
    $this->db->insert('t_user', $row);
    return $this->db->insert_id();
  }

  public function updateUserAvatar($user_id, $fileName) {
    $this->db->where('id', $user_id);
    $this->db->update('t_user', ['avatar' => $fileName]);
  }


  /**
   * 更新用户二维码
   */
  public function updateUserQrcode($user_id, $qrcode_path) {
    $this->db->where('id', $user_id);
    $this->db->update('t_user', ['qrcode' => $qrcode_path]);
  }


  public function getPlayerInfo($userid) {
    $players_query = "
        SELECT
            u.id as userid,
            u.wx_name,
            u.display_name,
            u.avatar
        FROM t_user u
        WHERE id = ? ";

    $user = $this->db->query($players_query, [$userid])->row_array();
    return $user;
  }


  public function getDisplayNameById($userid) {
    $this->db->where('id', $userid);
    $user = $this->db->get('t_user')->row_array();
    return !empty($user['display_name']) ? $user['display_name'] : $user['wx_name'];
  }


  /**
   * 检查当前用户是否关注了目标用户
   */
  public function isFollowing($current_user_id, $target_user_id) {
    $this->db->where('userid', $current_user_id);
    $this->db->where('fuserid', $target_user_id);
    return $this->db->count_all_results('t_user_follow') > 0;
  }


  /**
   * 获取用户的粉丝数量
   */
  public function getFollowersCount($user_id) {
    $this->db->where('fuserid', $user_id);
    return $this->db->count_all_results('t_user_follow');
  }


  /**
   * 获取用户的关注数量
   */
  public function getFollowingCount($user_id) {
    $this->db->where('userid', $user_id);
    return $this->db->count_all_results('t_user_follow');
  }


  /**
   * 获取用户参与的球局数量
   */
  public function getGamesCount($user_id) {
    $this->db->where('userid', $user_id);
    return $this->db->count_all_results('t_game_group_user');
  }


  /**
   * 获取用户所属球队数量
   */
  public function getTeamsCount($user_id) {
    $this->db->where('user_id', $user_id);
    $this->db->where('status', 'active');
    return $this->db->count_all_results('t_team_member');
  }


  /**
   * 检查当前用户是否拉黑了目标用户
   */
  public function isBlocked($current_user_id, $target_user_id) {
    $this->db->where('userid', $current_user_id);
    $this->db->where('blocked_userid', $target_user_id);
    return $this->db->count_all_results('t_user_block') > 0;
  }


  /**
   * 检查当前用户是否被目标用户拉黑
   */
  public function isBlockedBy($current_user_id, $target_user_id) {
    $this->db->where('userid', $target_user_id);
    $this->db->where('blocked_userid', $current_user_id);
    return $this->db->count_all_results('t_user_block') > 0;
  }


  /**
   * 关注用户
   */
  public function followUser($userid, $target_userid) {
    $data = [
      'userid' => $userid,
      'fuserid' => $target_userid
    ];
    $this->db->insert('t_user_follow', $data);
    return $this->db->insert_id();
  }


  /**
   * 取消关注
   */
  public function unfollowUser($userid, $target_userid) {
    $this->db->where('userid', $userid);
    $this->db->where('fuserid', $target_userid);
    return $this->db->delete('t_user_follow');
  }


  /**
   * 获取我的粉丝列表 (关注我的人)
   * 
   * 排除：我拉黑的人 或 拉黑我的人
   */
  public function getFollowers($userid) {
    $sql = "SELECT u.id as userid, u.wx_name, u.display_name, u.avatar, u.openid, u.unionid,
                   u.handicap, u.signature,
                   f.nickname as remark_name, f.is_special
            FROM t_user_follow f
            JOIN t_user u ON f.userid = u.id
            WHERE f.fuserid = ?
            -- 排除我拉黑的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b1
                WHERE b1.userid = ? AND b1.blocked_userid = f.userid
            )
            -- 排除拉黑我的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b2
                WHERE b2.userid = f.userid AND b2.blocked_userid = ?
            )";

    $followers = $this->db->query($sql, [$userid, $userid, $userid])->result_array();

    foreach ($followers as &$follower) {
      $follower['display_name'] = !empty($follower['display_name']) ? $follower['display_name'] : (!empty($follower['wx_name']) ? $follower['wx_name'] : '未知用户');
    }

    return $followers;
  }


  /**
   * 获取非注册好友(占位用户)列表
   * 
   * 条件：由当前用户创建 (helper_id = userid) 且 reg_type 为手动添加类型
   */
  public function getGhostUsers($userid) {
    $sql = "SELECT id as userid, wx_name, display_name, avatar, mobile, addtime
            FROM t_user
            WHERE helper_id = ?
            AND reg_type IN ('manualAdd', 'manualAddWithMobile')
            ORDER BY addtime DESC";

    $ghosts = $this->db->query($sql, [$userid])->result_array();

    foreach ($ghosts as &$ghost) {
      $ghost['display_name'] = !empty($ghost['display_name']) ? $ghost['display_name'] : $ghost['wx_name'];
    }

    return $ghosts;
  }


  /**
   * 获取非注册好友数量
   */
  public function getGhostUsersCount($userid) {
    $this->db->where('helper_id', $userid);
    $this->db->where_in('reg_type', ['manualAdd', 'manualAddWithMobile']);
    return $this->db->count_all_results('t_user');
  }


  /**
   * 删除非注册好友(占位用户)
   *
   * 只能删除自己创建的占位用户
   */
  public function deleteGhostUser($userid, $ghost_userid) {
    $this->db->where('id', $ghost_userid);
    $this->db->where('helper_id', $userid);
    $this->db->where_in('reg_type', ['manualAdd', 'manualAddWithMobile']);
    return $this->db->delete('t_user');
  }


  /**
   * 获取用户的历史比赛成绩
   */
  public function getGameHistory($userid) {
    // 1. 获取用户参与过的所有已完成比赛
    $sql = "
      SELECT
        g.id as game_id,
        g.name as game_name,
        g.open_time,
        g.create_time,
        c.name as course_name,
        ggu.groupid,
        ggu.tee
      FROM t_game_group_user ggu
      JOIN t_game g ON ggu.gameid = g.id
      LEFT JOIN t_course c ON g.courseid = c.courseid
      WHERE ggu.userid = ?
        AND g.game_status = 'finished'
      ORDER BY COALESCE(g.open_time, g.create_time) DESC
    ";

    $games = $this->db->query($sql, [$userid])->result_array();

    $result = [];

    foreach ($games as $game) {
      $game_id = $game['game_id'];
      $groupid = $game['groupid'];

      // 2. 获取该用户在此比赛的总成绩
      $score_sql = "
        SELECT SUM(score) as total_score
        FROM t_game_score
        WHERE gameid = ? AND user_id = ?
      ";
      $user_score = $this->db->query($score_sql, [$game_id, $userid])->row_array();
      $total_score = $user_score['total_score'] ? intval($user_score['total_score']) : null;

      // 如果没有成绩记录，跳过
      if ($total_score === null) {
        continue;
      }

      // 3. 获取该比赛使用球场的标准杆
      $par_sql = "
        SELECT SUM(ch.par) as total_par
        FROM t_game_court gc
        JOIN t_court_hole ch ON gc.courtid = ch.courtid
        WHERE gc.gameid = ?
      ";
      $par_result = $this->db->query($par_sql, [$game_id])->row_array();
      $total_par = $par_result['total_par'] ? intval($par_result['total_par']) : 72;

      // 4. 获取同组其他球员的成绩
      $players_sql = "
        SELECT
          u.id as userid,
          COALESCE(u.display_name, u.wx_name, '球友') as display_name,
          SUM(gs.score) as score
        FROM t_game_group_user ggu
        JOIN t_user u ON ggu.userid = u.id
        LEFT JOIN t_game_score gs ON gs.gameid = ggu.gameid AND gs.user_id = ggu.userid
        WHERE ggu.gameid = ? AND ggu.groupid = ?
        GROUP BY u.id, u.display_name, u.wx_name
        HAVING SUM(gs.score) IS NOT NULL
        ORDER BY SUM(gs.score) ASC
      ";
      $players = $this->db->query($players_sql, [$game_id, $groupid])->result_array();

      // 格式化球员数据
      $players_formatted = [];
      foreach ($players as $player) {
        $players_formatted[] = [
          'userid' => intval($player['userid']),
          'display_name' => $player['display_name'],
          'score' => intval($player['score'])
        ];
      }

      // 5. 获取比赛总人数
      $count_sql = "
        SELECT COUNT(DISTINCT userid) as total_players
        FROM t_game_group_user
        WHERE gameid = ?
      ";
      $count_result = $this->db->query($count_sql, [$game_id])->row_array();
      $total_players = intval($count_result['total_players']);

      $result[] = [
        'game_id' => intval($game_id),
        'game_name' => $game['game_name'],
        'course_name' => $game['course_name'] ?: '未知球场',
        'open_time' => $game['open_time'] ?: $game['create_time'],
        'tee' => $game['tee'] ?: 'WHITE',
        'total_score' => $total_score,
        'total_par' => $total_par,
        'over_par' => $total_score - $total_par,
        'players' => $players_formatted,
        'total_players' => $total_players
      ];
    }

    return $result;
  }


  /**
   * 更新用户资料
   */
  public function updateProfile($userid, $data) {
    $this->db->where('id', $userid);
    $this->db->update('t_user', $data);
  }
}
