<?php

class MUser  extends CI_Model {

  public function __construct() {
    parent::__construct();
    $this->jhdb = $this->load->database('jh_db', TRUE);
  }



  public function getUserProfile($user_id) {
    $this->db->where('id', $user_id);
    $user = $this->db->get('t_user')->row_array();
    $user['avatar'] = config_item('web_url') . $user['avatar'];
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
    if ($user) {
      $user['avatar'] = config_item('web_url') . $user['avatar'];
    }
    return $user;
  }


  public function getUserbyId($user_id) {
    $this->db->where('id', $user_id);
    $user = $this->db->get('t_user')->row_array();
    if ($user) {
      $user['avatar'] = config_item('web_url')  . $user['avatar'];
    }
    return $user;
  }



  public function updateNickName($user_id, $nickname) {
    $this->db->where('id', $user_id);
    $this->db->update('t_user', ['wx_nickname' => $nickname]);
  }





  public  function updateUserPhone($user_id, $phoneNumber) {
    $this->db->where('id', $user_id);
    $this->db->update('t_user', ['mobile' => $phoneNumber]);
  }





  public function getFriends($user_id) {
    $web_url = config_item('web_url');
    $this->db->select("u.wx_nickname, concat('{$web_url}',u.avatar) as avatar, u.openid, u.unionid, f.fuserid as userid, f.nickname as remark_name");
    $this->db->from('t_friend f');
    $this->db->join('t_user u', 'f.fuserid = u.id');
    $this->db->where('f.userid', $user_id);
    $friends = $this->db->get()->result_array();
    return $friends;
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
    $jh_avatar_url = "http://s1.golf-brother.com/data/attach/" . $jhuser['avatar'] . "/" . $jhuser['covername'];
    $avatar_result = downloadJHAvatar($jh_avatar_url);

    if ($avatar_result['success']) {
      $app_avatar_url = $avatar_result['relative_path'];
    } else {
      $app_avatar_url = '/avatar/user_default_avatar.png';
    }


    $row = [];
    $row['nickname'] = $jhuser['nickname'];
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
}
