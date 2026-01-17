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



  public function logout() {
    http_response_code(401);
    return false;
    die();
  }
}
