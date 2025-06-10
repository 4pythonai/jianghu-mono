<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class User extends MY_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }


    // 获取好友列表
    public function getFriendList() {
        try {
            $json_paras = (array) json_decode(file_get_contents('php://input'));
            $user_id = isset($json_paras['user_id']) ? intval($json_paras['user_id']) : 0;
            $ret = [];
            $friends = $this->MUser->getFriends($user_id);
            $ret['code'] = 200;
            $ret['data'] = [
                'friends' => $friends,
                'total' => count($friends)
            ];

            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            $ret['code'] = 500;
            $ret['message'] = '服务器内部错误';
            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        }
    }
}
