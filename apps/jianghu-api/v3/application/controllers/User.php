<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}



class User extends MY_Controller {


    // 获取好友列表
    public function getFriendList() {
        try {
            $userid = $this->getUser();
            $ret = [];
            $friends = $this->MUser->getFriends($userid);
            $ret['code'] = 200;
            $ret['friends'] = $friends;
            $ret['total'] = count($friends);
            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            $ret['code'] = 500;
            $ret['message'] = '服务器内部错误';
            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        }
    }



    public function getUserInfo() {
        try {
            $json_paras = json_decode(file_get_contents('php://input'), true);
            $user_id = isset($json_paras['user_id']) ? intval($json_paras['user_id']) : 0;
        } catch (Exception $e) {
            $ret['code'] = 500;
        }
    }


    public function getUserProfile() {
        try {
            $json_paras = json_decode(file_get_contents('php://input'), true);
            $user_id = isset($json_paras['user_id']) ? intval($json_paras['user_id']) : 0;

            if (!$user_id) {
                echo json_encode([
                    'code' => 400,
                    'message' => '缺少用户ID'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $user = $this->MUser->getUserProfile($user_id);

            if (!$user) {
                echo json_encode([
                    'code' => 404,
                    'message' => '用户不存在'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // 获取当前登录用户ID
            $current_user_id = $this->getUser();

            // 获取关系信息
            $is_self = ($current_user_id == $user_id);
            $is_following = false;
            $is_blocked = false;
            $is_blocked_by = false;
            if ($current_user_id && !$is_self) {
                $is_following = $this->MUser->isFollowing($current_user_id, $user_id);
                $is_blocked = $this->MUser->isBlocked($current_user_id, $user_id);
                $is_blocked_by = $this->MUser->isBlockedBy($current_user_id, $user_id);
            }

            // 获取统计数据
            $followers_count = $this->MUser->getFollowersCount($user_id);
            $games_count = $this->MUser->getGamesCount($user_id);
            $teams_count = $this->MUser->getTeamsCount($user_id);

            echo json_encode([
                'code' => 200,
                'message' => 'OK',
                'data' => [
                    'user' => $user,
                    'relationship' => [
                        'is_self' => $is_self,
                        'is_following' => $is_following,
                        'is_blocked' => $is_blocked,
                        'is_blocked_by' => $is_blocked_by
                    ],
                    'stats' => [
                        'gamesCount' => $games_count,
                        'teamsCount' => $teams_count,
                        'followers_count' => $followers_count
                    ]
                ]
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误'
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    // 关注用户
    public function followUser() {
        try {
            $current_user_id = $this->getUser();
            if (!$current_user_id) {
                echo json_encode([
                    'code' => 401,
                    'message' => '请先登录'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $json_paras = json_decode(file_get_contents('php://input'), true);
            $target_user_id = isset($json_paras['user_id']) ? intval($json_paras['user_id']) : 0;

            if (!$target_user_id) {
                echo json_encode([
                    'code' => 400,
                    'message' => '缺少目标用户ID'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            if ($current_user_id == $target_user_id) {
                echo json_encode([
                    'code' => 400,
                    'message' => '不能关注自己'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // 检查是否已关注
            if ($this->MUser->isFollowing($current_user_id, $target_user_id)) {
                echo json_encode([
                    'code' => 400,
                    'message' => '已经关注过了'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $this->MUser->followUser($current_user_id, $target_user_id);

            echo json_encode([
                'code' => 200,
                'message' => '关注成功'
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误'
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    // 取消关注
    public function unfollowUser() {
        try {
            $current_user_id = $this->getUser();
            if (!$current_user_id) {
                echo json_encode([
                    'code' => 401,
                    'message' => '请先登录'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $json_paras = json_decode(file_get_contents('php://input'), true);
            $target_user_id = isset($json_paras['user_id']) ? intval($json_paras['user_id']) : 0;

            if (!$target_user_id) {
                echo json_encode([
                    'code' => 400,
                    'message' => '缺少目标用户ID'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $this->MUser->unfollowUser($current_user_id, $target_user_id);

            echo json_encode([
                'code' => 200,
                'message' => '取消关注成功'
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误'
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    public function uploadAvatar() {
        logtext('<hr/>');
        logtext('<div><span class =functionname>' . date('Y-m-d H:i:s') . '  User/uploadAvatar</span></div>');
        logtext(" FILES:" . json_encode($_FILES, JSON_UNESCAPED_UNICODE));
        logtext(" POST:" . json_encode($_POST, JSON_UNESCAPED_UNICODE));

        try {
            // Token已经在MY_Controller中验证过了，直接获取用户ID
            $user_id = $this->getUser();

            if (!$user_id) {
                throw new \RuntimeException('用户未登录');
            }

            logtext("  用户ID: " . $user_id);

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
            $date_folder = date('Y/m/d/');
            $full_path = '/var/www/html/avatar/' . $date_folder;
            logtext("  文件保存路径: " . $full_path);
            if (!is_dir($full_path)) {
                mkdir($full_path, 0755, true);
            }
            $targetPath = $full_path . $fileName;

            // 移动文件到目标目录
            if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                throw new \RuntimeException('文件保存失败');
            }

            logtext("  文件保存成功: " . $targetPath);

            // 可以在这里更新用户的头像路径到数据库
            $relativePath = '/avatar/' . $date_folder . $fileName;
            $this->MUser->updateUserAvatar($user_id, $relativePath);

            $publicUrl = $relativePath;

            echo json_encode([
                'code' => 200,
                'success' => true,
                'message' => '头像upload Success ',
                'data' => [
                    'filename' => $fileName,
                    'path' => $targetPath,
                    'size' => $file['size'],
                    'type' => $file['type'],
                    'avatar_path' => $relativePath,
                    'avatar' => $publicUrl
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
            $json_paras = json_decode(file_get_contents('php://input'), true);
            $user_id = isset($json_paras['user_id']) ? intval($json_paras['user_id']) : 0;
            $nickname = isset($json_paras['nickname']) ? $json_paras['nickname'] : '';

            $this->MUser->updateNickName($user_id, $nickname);

            echo json_encode([
                'code' => 200,
                'success' => true,
                'message' => 'OK 更新昵称成功',
            ]);
        } catch (Exception $e) {
            $ret = [];
            $ret['code'] = 500;
            $ret['message'] = '服务器内部错误';
            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        }
    }


    public function createAndSelect() {
        $userid = $this->getUser();
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $remarkName = isset($json_paras['remarkName']) ? $json_paras['remarkName'] : '';
        $mobile = isset($json_paras['mobile']) ? $json_paras['mobile'] : '';
        $mobile = trim($mobile);
        $remarkName = trim($remarkName);

        // 没有手机号非注册用户
        if (strlen($mobile) !== 11) {
            $newuserid = $this->MUser->addRemakGhostUser($userid, $remarkName, '');
            $ret = [];
            $ret['code'] = 200;
            $ret['message'] = 'OK 添加非注册用户成功';
            $ret['user'] = $this->MUser->getUserbyId($newuserid);
            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
            return;
        }

        // 有手机号,先搜索

        $searchResult = $this->MUser->doubleSearchMobile($mobile);

        // 找到手机号相关的用户
        if ($searchResult['user']) {
            if ($searchResult['source'] == 'mini') {
                $ret = [];
                $ret['code'] = 200;
                $ret['message'] = 'OK 找到小程序的注册用户';
                $ret['user'] = $this->MUser->getUserbyId($searchResult['user']['id']);
                echo json_encode($ret, JSON_UNESCAPED_UNICODE);
                return;
            }

            if ($searchResult['source'] == 'jhapp') {
                $newuserid = $this->MUser->transferJHUser($searchResult['user']);
                $ret = [];
                $ret['code'] = 200;
                $ret['message'] = 'OK 找到江湖的注册用户';
                $ret['user'] = $this->MUser->getUserbyId($newuserid);
                echo json_encode($ret, JSON_UNESCAPED_UNICODE);
                return;
            }
        } // 有手机号,但是没有找到,添加到小程序数据库
        else {
            $newuserid = $this->MUser->addMobileGhostUser($userid, $remarkName, $mobile);
            $ret = [];
            $ret['code'] = 200;
            $ret['message'] = 'OK 添加非注册用户(withmobile)成功';
            $ret['user'] = $this->MUser->getUserbyId($newuserid);
            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
            return;
        }
    }
}
