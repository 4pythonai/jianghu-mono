<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class User extends MY_Controller {
    // public function __construct() {
    //     parent::__construct();
    //     header('Access-Control-Allow-Origin: * ');
    //     header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
    //     header('Access-Control-Allow-Credentials', true);
    //     header('Content-Type: application/json; charset=utf-8');
    //     if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
    //         exit();
    //     }
    // }


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



    public function getUserInfo() {
        try {
            $json_paras = (array) json_decode(file_get_contents('php://input'));
            $user_id = isset($json_paras['user_id']) ? intval($json_paras['user_id']) : 0;
        } catch (Exception $e) {
            $ret['code'] = 500;
        }
    }


    public function uploadAvatar() {
        logtext('<hr/>');
        logtext('<div><span class =functionname>' . date('Y-m-d H:i:s') . '  User/uploadAvatar</span></div>');
        logtext(" FILES:" . json_encode($_FILES, JSON_UNESCAPED_UNICODE));
        logtext(" POST:" . json_encode($_POST, JSON_UNESCAPED_UNICODE));

        try {
            // 验证token
            $headers = getallheaders();
            $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
            $payload = $this->MJwtUtil->verifyToken($token);

            if (!$payload) {
                throw new \RuntimeException('无效的token');
            }

            $user_id = $payload['uid'];

            // 检查是否有文件上传
            if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
                throw new \RuntimeException('文件上传失败');
            }

            $file = $_FILES['avatar'];

            // 验证文件类型（头像一般是图片）
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!in_array($file['type'], $allowedTypes)) {
                throw new \RuntimeException('文件类型不支持，仅支持 JPG, PNG, GIF 格式');
            }

            // 验证文件大小（限制为5MB）
            $maxSize = 5 * 1024 * 1024; // 5MB
            if ($file['size'] > $maxSize) {
                throw new \RuntimeException('文件大小超过限制（最大5MB）');
            }

            // 生成文件名
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $fileName = 'avatar_' . $user_id . '_' . time() . '.' . $extension;
            $targetPath = '/tmp/' . $fileName;

            // 移动文件到目标目录
            if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                throw new \RuntimeException('文件保存失败');
            }

            logtext("  文件保存成功: " . $targetPath);

            // 可以在这里更新用户的头像路径到数据库
            // $this->MUser->updateUserAvatar($user_id, $fileName);

            echo json_encode([
                'code' => 200,
                'success' => true,
                'message' => '头像upload Success ',
                'data' => [
                    'filename' => $fileName,
                    'path' => $targetPath,
                    'size' => $file['size'],
                    'type' => $file['type']
                ]
            ]);
        } catch (\Exception $e) {
            logtext("  上传失败: " . $e->getMessage());
            echo json_encode([
                'code' => 500,
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }


    public function updateNickName() {
        try {
            $json_paras = (array) json_decode(file_get_contents('php://input'));
            $user_id = isset($json_paras['user_id']) ? intval($json_paras['user_id']) : 0;
            $nickname = isset($json_paras['nickname']) ? $json_paras['nickname'] : '';

            $this->MUser->updateNickName($user_id, $nickname);

            echo json_encode([
                'code' => 200,
                'success' => true,
                'message' => 'OK 更新昵称成功',
            ]);
        } catch (Exception $e) {
            $ret['code'] = 500;
            $ret['message'] = '服务器内部错误';
            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        }
    }
}
