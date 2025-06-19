<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Auth extends MY_Controller {


  public function __construct() {

    parent::__construct();
    $this->router->fetch_method();
    getallheaders();
    $this->load->helper('my_jwt_helper');
    $this->load->model('AesEncrypt');
  }











  public  function JwtToken($mobile, $user) {
    $this->load->helper('my_jwt_helper');
    $secret_key = 'nanx_xiaoke-20211213';
    $valid_for = '36000000';
    $token = [];
    $token['mobile'] = $mobile;
    $token['exp'] = time() + $valid_for;
    $token['user'] = $user;
    return JWT::encode($token, $secret_key);
  }


  public function db_login($mobile, $pwd_try) {
    $user = $this->db->select('id,user,password,staff_name,active,salt')->get_where('nanx_user', ['mobile' => $mobile])->result_array();
    // $user = $this->db->select('id,name,password,salt')->get_where('tier2', ['tierUid' => $mobile])->result_array();

    if (1 != sizeof($user)) {
      return 'user_not_found';
    }

    if (1 == sizeof($user)) {
      $salt = $user[0]['salt'];
      $pwd_db = $user[0]['password'];

      $pwd_try_with_salt = md5(md5($pwd_try) . $salt);

      if ($pwd_try_with_salt == $pwd_db) {
        return  'success';
      } else {
        return  'false';
      }
    }
  }


  public function tier2_login($mobile, $pwd_try) {
    $this->db->where('tierUid', $mobile);
    $user = $this->db->get('tier2')->result_array();


    if (1 != sizeof($user)) {
      return 'user_not_found';
    }

    if (1 == sizeof($user)) {
      $salt = $user[0]['salt'];
      $pwd_db = $user[0]['password'];
      $pwd_try_with_salt = md5(md5($pwd_try) . $salt);

      if ($pwd_try_with_salt == $pwd_db) {
        return  'success';
      } else {
        return  'false';
      }
    }
  }



  public function logout() {
    http_response_code(401);
    return false;
    die();
  }
}
