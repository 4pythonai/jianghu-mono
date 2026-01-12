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



  public function updateNickName($userid, $nickname) {
    $this->db->where('id', $userid);
    $this->db->update('t_user', ['wx_nickname' => $nickname, 'nickname' => $nickname]);
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
    $sql = "SELECT u.wx_nickname, u.avatar, u.openid, u.unionid, 
                   f1.fuserid as userid, f1.nickname as remark_name, f1.ifstar
            FROM t_follow f1
            -- 互相关注：他也关注了我
            JOIN t_follow f2 ON f1.userid = f2.fuserid AND f1.fuserid = f2.userid
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

    // 为前端添加 nickname 字段：优先使用备注名，否则使用微信昵称
    foreach ($friends as &$friend) {
      $friend['nickname'] = !empty($friend['remark_name']) ? $friend['remark_name'] : $friend['wx_nickname'];
    }

    return $friends;
  }

  /**
   * 获取我关注的人列表
   * 
   * 排除：我拉黑的人 或 拉黑我的人
   */
  public function getFollowings($userid) {
    $sql = "SELECT u.wx_nickname, u.avatar, u.openid, u.unionid, 
                   f.fuserid as userid, f.nickname as remark_name, f.ifstar
            FROM t_follow f
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
      $following['nickname'] = !empty($following['remark_name']) ? $following['remark_name'] : $following['wx_nickname'];
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
      'nickname' => $remarkName,
      'wx_nickname' => $remarkName,
      'mobile' => $mobile,
      'addtime' => date('Y-m-d H:i:s'),
      'reg_type' => 'manualAdd',
      'avatar' =>  '/avatar/user_default_avatar.png',
      'helper_id' => $helperid
    ];
    $this->db->insert('t_user', $new_user);
    return $this->db->insert_id();
  }

  //添加注册用户
  public function addMobileGhostUser($helperid, $remarkName, $mobile) {
    $new_user = [
      'wx_nickname' => $remarkName,
      'nickname' => $remarkName,
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
    $row['nickname'] = $jhuser['nickname'];
    $row['wx_nickname'] = $jhuser['nickname'];
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


  public function getPlayerInfo($userid) {
    $players_query = "
        SELECT
            u.id as userid,
            u.wx_nickname as wx_nickname,
            u.avatar
        FROM t_user u
        WHERE id = ? ";

    $user = $this->db->query($players_query, [$userid])->row_array();
    return $user;
  }


  public function getNicknameById($userid) {
    $this->db->where('id', $userid);
    $user = $this->db->get('t_user')->row_array();
    return $user['wx_nickname'];
  }


  /**
   * 检查当前用户是否关注了目标用户
   */
  public function isFollowing($current_user_id, $target_user_id) {
    $this->db->where('userid', $current_user_id);
    $this->db->where('fuserid', $target_user_id);
    return $this->db->count_all_results('t_follow') > 0;
  }


  /**
   * 获取用户的粉丝数量
   */
  public function getFollowersCount($user_id) {
    $this->db->where('fuserid', $user_id);
    return $this->db->count_all_results('t_follow');
  }


  /**
   * 获取用户的关注数量
   */
  public function getFollowingCount($user_id) {
    $this->db->where('userid', $user_id);
    return $this->db->count_all_results('t_follow');
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
    $this->db->insert('t_follow', $data);
    return $this->db->insert_id();
  }


  /**
   * 取消关注
   */
  public function unfollowUser($userid, $target_userid) {
    $this->db->where('userid', $userid);
    $this->db->where('fuserid', $target_userid);
    return $this->db->delete('t_follow');
  }
}
