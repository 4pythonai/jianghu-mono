<?php

class MUser  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }



  public function getUserProfile($user_id, $current_user_id = null) {
    if ($current_user_id) {
      // 如果有当前用户ID，LEFT JOIN t_user_remark 获取备注名，并计算 show_name
      $sql = "
        SELECT 
          u.*,
          ur.remark_name,
          COALESCE(ur.remark_name, u.display_name, u.wx_name, '球友') as show_name
        FROM t_user u
        LEFT JOIN t_user_remark ur ON ur.user_id = ? AND ur.target_id = u.id
        WHERE u.id = ?
      ";
      $user = $this->db->query($sql, [$current_user_id, $user_id])->row_array();
    } else {
      // 如果没有当前用户ID，只查询基本信息
      $this->db->where('id', $user_id);
      $user = $this->db->get('t_user')->row_array();
      if ($user) {
        // 即使没有当前用户，也计算一个默认的 show_name
        $user['show_name'] = !empty($user['display_name']) ? $user['display_name'] : (!empty($user['wx_name']) ? $user['wx_name'] : '球友');
      }
    }
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



  public function getUserbyId($user_id) {
    $this->db->where('id', $user_id);
    $user = $this->db->get('t_user')->row_array();
    return $user;
  }



  public function updateDisplayName($user_id, $display_name) {
    $this->db->where('id', $user_id);
    $this->db->update('t_user', ['display_name' => $display_name]);
  }





  public  function updateUserPhone($user_id, $phoneNumber) {
    $this->db->where('id', $user_id);
    $this->db->update('t_user', ['mobile' => $phoneNumber]);
  }





  /**
   * 获取好友列表
   * 
   * 好友定义：互相关注（我关注他 且 他也关注我）
   * 排除：我拉黑的人 或 拉黑我的人
   */
  public function getFriends($user_id) {
    $sql = "SELECT u.id as user_id, u.wx_name, u.display_name, u.avatar, u.openid, u.unionid,
                   f1.is_special,
                   ur.remark_name,
                   COALESCE(ur.remark_name, u.display_name, u.wx_name, '球友') as show_name
            FROM t_user_follow f1
            -- 互相关注：他也关注了我
            JOIN t_user_follow f2 ON f1.user_id = f2.target_id AND f1.target_id = f2.user_id
            JOIN t_user u ON f1.target_id = u.id
            LEFT JOIN t_user_remark ur ON ur.user_id = ? AND ur.target_id = u.id
            WHERE f1.user_id = ?
            -- 排除我拉黑的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b1
                WHERE b1.user_id = f1.user_id AND b1.blocked_userid = f1.target_id
            )
            -- 排除拉黑我的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b2
                WHERE b2.user_id = f1.target_id AND b2.blocked_userid = f1.user_id
            )";

    $friends = $this->db->query($sql, [$user_id, $user_id])->result_array();

    foreach ($friends as &$friend) {
      $friend['user_id'] = (int)$friend['user_id'];
      if (!isset($friend['display_name']) || empty($friend['display_name'])) {
        $friend['display_name'] = $friend['wx_name'];
      }
    }

    return $friends;
  }

  /**
   * 获取我关注的人列表
   * 
   * 排除：我拉黑的人 或 拉黑我的人
   */
  public function getFollowings($user_id) {
    $sql = "SELECT u.id as user_id, u.wx_name, u.display_name, u.avatar, u.openid, u.unionid,
                   u.handicap, u.signature,
                   f.is_special,
                   ur.remark_name,
                   COALESCE(ur.remark_name, u.display_name, u.wx_name, '球友') as show_name
            FROM t_user_follow f
            JOIN t_user u ON f.target_id = u.id
            LEFT JOIN t_user_remark ur ON ur.user_id = ? AND ur.target_id = u.id
            WHERE f.user_id = ?
            -- 排除我拉黑的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b1
                WHERE b1.user_id = f.user_id AND b1.blocked_userid = f.target_id
            )
            -- 排除拉黑我的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b2
                WHERE b2.user_id = f.target_id AND b2.blocked_userid = f.user_id
            )";

    $followings = $this->db->query($sql, [$user_id, $user_id])->result_array();

    foreach ($followings as &$following) {
      $following['user_id'] = (int)$following['user_id'];
      if (!isset($following['display_name']) || empty($following['display_name'])) {
        $following['display_name'] = $following['wx_name'];
      }
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


  public function getPlayerInfo($user_id) {
    $players_query = "
        SELECT
            u.id as user_id,
            u.wx_name,
            u.display_name,
            u.avatar
        FROM t_user u
        WHERE id = ? ";

    $user = $this->db->query($players_query, [$user_id])->row_array();
    return $user;
  }


  /**
   * 检查当前用户是否关注了目标用户
   */
  public function isFollowing($current_user_id, $target_user_id) {
    $this->db->where('user_id', $current_user_id);
    $this->db->where('target_id', $target_user_id);
    return $this->db->count_all_results('t_user_follow') > 0;
  }


  /**
   * 获取用户的粉丝数量
   * 排除拉黑关系，与 getFollowers 保持一致
   */
  public function getFollowersCount($user_id) {
    return $this->getFollowersCountFiltered($user_id);
  }


  /**
   * 获取粉丝数量（排除拉黑用户）
   * 私有方法，供 getFollowersCount 和其他需要的地方调用
   */
  private function getFollowersCountFiltered($user_id) {
    $sql = "SELECT COUNT(*) as cnt
            FROM t_user_follow f
            JOIN t_user u ON f.user_id = u.id
            WHERE f.target_id = ?
            -- 排除我拉黑的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b1
                WHERE b1.user_id = ? AND b1.blocked_userid = f.user_id
            )
            -- 排除拉黑我的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b2
                WHERE b2.user_id = f.user_id AND b2.blocked_userid = ?
            )";
    $result = $this->db->query($sql, [$user_id, $user_id, $user_id])->row();
    return $result ? (int)$result->cnt : 0;
  }


  /**
   * 获取用户的关注数量
   */
  public function getFollowingCount($user_id) {
    $this->db->where('user_id', $user_id);
    return $this->db->count_all_results('t_user_follow');
  }


  /**
   * 获取用户参与的球局数量
   */
  public function getGamesCount($user_id) {
    $this->db->where('user_id', $user_id);
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
    $this->db->where('user_id', $current_user_id);
    $this->db->where('blocked_userid', $target_user_id);
    return $this->db->count_all_results('t_user_block') > 0;
  }


  /**
   * 检查当前用户是否被目标用户拉黑
   */
  public function isBlockedBy($current_user_id, $target_user_id) {
    $this->db->where('user_id', $target_user_id);
    $this->db->where('blocked_userid', $current_user_id);
    return $this->db->count_all_results('t_user_block') > 0;
  }


  /**
   * 关注用户
   */
  public function followUser($user_id, $target_userid) {
    $data = [
      'user_id' => $user_id,
      'target_id' => $target_userid
    ];
    $this->db->insert('t_user_follow', $data);
    return $this->db->insert_id();
  }


  /**
   * 取消关注
   */
  public function unfollowUser($user_id, $target_userid) {
    $this->db->where('user_id', $user_id);
    $this->db->where('target_id', $target_userid);
    return $this->db->delete('t_user_follow');
  }


  /**
   * 获取我的粉丝列表 (关注我的人)
   * 
   * 排除：我拉黑的人 或 拉黑我的人
   */
  public function getFollowers($user_id) {
    $sql = "SELECT u.id as user_id, u.wx_name, u.display_name, u.avatar, u.openid, u.unionid,
                   u.handicap, u.signature,
                   f.is_special,
                   ur.remark_name,
                   COALESCE(ur.remark_name, u.display_name, u.wx_name, '球友') as show_name
            FROM t_user_follow f
            JOIN t_user u ON f.user_id = u.id
            LEFT JOIN t_user_remark ur ON ur.user_id = ? AND ur.target_id = u.id
            WHERE f.target_id = ?
            -- 排除我拉黑的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b1
                WHERE b1.user_id = ? AND b1.blocked_userid = f.user_id
            )
            -- 排除拉黑我的人
            AND NOT EXISTS (
                SELECT 1 FROM t_user_block b2
                WHERE b2.user_id = f.user_id AND b2.blocked_userid = ?
            )";

    $followers = $this->db->query($sql, [$user_id, $user_id, $user_id, $user_id])->result_array();

    // foreach ($followers as &$follower) {
    //   $follower['user_id'] = (int)$follower['user_id'];
    //   if (!isset($follower['display_name']) || empty($follower['display_name'])) {
    //     $follower['display_name'] = !empty($follower['wx_name']) ? $follower['wx_name'] : '未知用户';
    //   }
    // }

    return $followers;
  }


  /**
   * 获取非注册好友(占位用户)列表
   * 
   * 条件：由当前用户创建 (helper_id = user_id) 且 reg_type 为手动添加类型
   */
  public function getGhostUsers($user_id) {
    $sql = "SELECT id as user_id, wx_name, display_name, avatar, mobile, addtime
            FROM t_user
            WHERE helper_id = ?
            AND reg_type IN ('manualAdd', 'manualAddWithMobile')
            ORDER BY addtime DESC";

    $ghosts = $this->db->query($sql, [$user_id])->result_array();

    foreach ($ghosts as &$ghost) {
      $ghost['display_name'] = !empty($ghost['display_name']) ? $ghost['display_name'] : $ghost['wx_name'];
    }

    return $ghosts;
  }


  /**
   * 获取非注册好友数量
   */
  public function getGhostUsersCount($user_id) {
    $this->db->where('helper_id', $user_id);
    $this->db->where_in('reg_type', ['manualAdd', 'manualAddWithMobile']);
    return $this->db->count_all_results('t_user');
  }


  /**
   * 删除非注册好友(占位用户)
   *
   * 只能删除自己创建的占位用户
   */
  public function deleteGhostUser($user_id, $ghost_userid) {
    $this->db->where('id', $ghost_userid);
    $this->db->where('helper_id', $user_id);
    $this->db->where_in('reg_type', ['manualAdd', 'manualAddWithMobile']);
    return $this->db->delete('t_user');
  }


  /**
   * 获取用户的历史比赛成绩
   */
  public function getGameHistory($user_id) {
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
      WHERE ggu.user_id = ?
        AND g.game_status = 'finished'
      ORDER BY COALESCE(g.open_time, g.create_time) DESC
    ";

    $games = $this->db->query($sql, [$user_id])->result_array();

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
      $user_score = $this->db->query($score_sql, [$game_id, $user_id])->row_array();
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
          u.id as user_id,
          COALESCE(u.display_name, u.wx_name, '球友') as display_name,
          SUM(gs.score) as score
        FROM t_game_group_user ggu
        JOIN t_user u ON ggu.user_id = u.id
        LEFT JOIN t_game_score gs ON gs.gameid = ggu.gameid AND gs.user_id = ggu.user_id
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
          'user_id' => intval($player['user_id']),
          'display_name' => $player['display_name'],
          'score' => intval($player['score'])
        ];
      }

      // 5. 获取比赛总人数
      $count_sql = "
        SELECT COUNT(DISTINCT user_id) as total_players
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
  public function updateProfile($user_id, $data) {
    $this->db->where('id', $user_id);
    $this->db->update('t_user', $data);
  }

  /**
   * 批量获取多个用户的 show_name（对当前用户而言）
   * 逻辑：优先返回 remark_name，如果没有则返回 display_name
   * 
   * @param int $current_user_id 当前用户ID（查看者）
   * @param array $target_user_ids 目标用户ID数组
   * @return array 映射数组 [target_user_id => show_name]
   */
  public function getShowNamesForUsers($current_user_id, $target_user_ids) {
    if (empty($target_user_ids) || !$current_user_id) {
      return [];
    }

    // 去重并过滤空值
    $target_user_ids = array_filter(array_unique($target_user_ids));
    if (empty($target_user_ids)) {
      return [];
    }

    // 构建占位符
    $placeholders = implode(',', array_fill(0, count($target_user_ids), '?'));

    $sql = "
      SELECT 
        u.id as target_id,
        COALESCE(ur.remark_name, u.display_name, u.wx_name, '球友') as show_name
      FROM t_user u
      LEFT JOIN t_user_remark ur ON ur.user_id = ? AND ur.target_id = u.id
      WHERE u.id IN ($placeholders)
    ";

    $params = array_merge([$current_user_id], $target_user_ids);
    $result = $this->db->query($sql, $params)->result_array();

    // 转换为映射数组
    $show_names = [];
    foreach ($result as $row) {
      $show_names[$row['target_id']] = $row['show_name'];
    }

    return $show_names;
  }


  public function updateRemark($user_id, $target_user_id, $remark_name) {
    $this->db->where('user_id', $user_id);
    $this->db->where('target_id', $target_user_id);
    $this->db->update('t_user_remark', ['remark_name' => $remark_name]);
  }

  public function blockUser($user_id, $blocked_userid) {
    $this->unBlockUser($user_id, $blocked_userid);
    $this->db->where('user_id', $user_id);
    $this->db->where('blocked_userid', $blocked_userid);
    $this->db->insert('t_user_block', ['user_id' => $user_id, 'blocked_userid' => $blocked_userid]);
  }

  public function unBlockUser($user_id, $blocked_userid) {
    $this->db->where('user_id', $user_id);
    $this->db->where('blocked_userid', $blocked_userid);
    $this->db->delete('t_user_block');
  }
}
