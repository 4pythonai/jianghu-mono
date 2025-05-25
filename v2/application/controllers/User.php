<?php

defined('BASEPATH') or exit('No direct script access allowed');

class User extends MY_Controller {


    public function __construct() {
        parent::__construct();
    }



    public function logout() {
        http_response_code(401);
        return false;
        die();
    }

    function profile() {

        $user = $this->getUser();
        $profile = $this->MUser->getUserProfile($user);
        $ret = array(
            "code" => 200,
            "message" => "success",
            "data" => $profile
        );
        echo json_encode($ret);
    }


    public function resetPassword() {

        $json_paras = (array) json_decode(file_get_contents('php://input'), true);
        $this->load->model('MUser');
        $mobile = $json_paras['mobile'];
        $new_pwd = '12345678';
        $salt = randstr(6);
        $pwd_try_with_salt = md5(md5($new_pwd) .   $salt);
        $data = ['password' => $pwd_try_with_salt, 'salt' => $salt];
        $this->db->where('mobile', $mobile);
        $this->db->update('nanx_user', $data);
        $db_error = $this->db->error();

        if (0 == $db_error['code']) {
            $ret = ['code' => 200, 'message' => '密码重置成功(12345678)', 'data' => null];
        } else {
            $ret = ['code' => $db_error['code'], 'message' => '数据库操作失败,DBcode:' . $db_error['code'], 'data' => null];
        }
        echo json_encode($ret);
    }

    public function changepwd() {

        $json_paras = (array) json_decode(file_get_contents('php://input'), true);
        $this->load->model('MUser');
        $mobile = $this->getMobile();
        $new_pwd = $json_paras['new_pwd'];
        $salt = randstr(6);

        $pwd_try_with_salt = md5(md5($new_pwd) .  $salt);
        $data = ['password' => $pwd_try_with_salt, 'salt' => $salt];
        $this->db->where('mobile', $mobile);
        $this->db->update('nanx_user', $data);
        $db_error = $this->db->error();

        if (0 == $db_error['code']) {
            $ret = ['code' => 200, 'message' => '密码更新成功', 'data' => null];
        } else {
            $ret = ['code' => $db_error['code'], 'message' => '数据库操作失败,DBcode:' . $db_error['code'], 'data' => null];
        }
        echo json_encode($ret);
    }
}
