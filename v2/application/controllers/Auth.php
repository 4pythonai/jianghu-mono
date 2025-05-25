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






  public function loginMobile() {
    // sleep(13);
    $json_paras = (array) json_decode(file_get_contents('php://input'));

    if (!array_key_exists('mobile', $json_paras)) {
      http_response_code(401);
      return false;
    }

    if (!array_key_exists('password', $json_paras)) {
      http_response_code(401);
      return false;
    }

    $mobile =   $json_paras['mobile'];
    $password = $json_paras['password'];
    $password = $this->AesEncrypt->aes_decrypt($password);



    $trylogin = $this->db_login($mobile, $password);
    if (!('success' == $trylogin)) {
      $ret = array('code' => 401, 'message' => 'Message:[mobile/password] not match');
      http_response_code(401);
      echo json_encode($ret);
      return false;
    }

    $userRow = $this->MUser->getUserByMobile($mobile);
    $user = $userRow['user'];
    $profile = $this->MUser->getUserProfile($user);


    $ret = [];
    if (empty($profile['role_code'])) {
      $ret = ['profile' => $profile, 'code' => 500, 'message' => '该用户无任何角色'];
      echo json_encode($ret);
      return;
    }

    $data = ['transaction_id' => $json_paras['transaction_id'], 'login_datetime' => date('Y-m-d h:i:s'), 'mobile' => $mobile];
    $this->db->insert('nanx_qrcode_login_session', $data);

    $ret = ['token' =>  $this->JwtToken($mobile, $user),   'profile' => $profile, 'code' => 200];
    echo json_encode($ret);
  }



  public function loginTier2() {

    $json_paras = (array) json_decode(file_get_contents('php://input'));

    if (!array_key_exists('mobile', $json_paras)) {
      http_response_code(401);
      return false;
    }

    if (!array_key_exists('password', $json_paras)) {
      http_response_code(401);
      return false;
    }


    $mobile =   $json_paras['mobile'];
    $password = $json_paras['password'];
    $password = $this->AesEncrypt->aes_decrypt($password);
    $trylogin = $this->tier2_login($mobile, $password);


    if (!('success' == $trylogin)) {
      $ret = array('code' => 401, 'message' => 'Message:[mobile/password] not match');
      http_response_code(401);
      echo json_encode($ret);
      return false;
    }

    $this->db->where('tierUid', $mobile);
    $this->db->select('id,ifCompetence,partner_type,usd_to_rmb_handrate, rmb_to_usd_handrate, name, prov, old_name, real_name, address, name_global, address_global, sales, contract, mobile, contractno, author, email, tierUid, password, salt');
    $profile = $this->db->get('tier2')->row_array();
    $profile['role_code'] = 'admin';

    $ret = [];
    $data = ['transaction_id' => $json_paras['transaction_id'], 'login_datetime' => date('Y-m-d h:i:s'), 'mobile' => $mobile];
    $this->db->insert('nanx_qrcode_login_session', $data);
    $ret = ['token' =>  $this->JwtToken($mobile, $profile['name']),   'profile' => $profile, 'code' => 200];
    echo json_encode($ret);
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
