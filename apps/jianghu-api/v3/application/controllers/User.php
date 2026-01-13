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


    /**
     * 获取通讯录概览数据
     * 返回: 球队数量、关注数量、粉丝数量、非注册好友数量、好友列表
     */
    public function getContactsOverview() {
        try {
            $userid = $this->getUser();
            if (!$userid) {
                echo json_encode([
                    'code' => 401,
                    'message' => '请先登录'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // 获取各类数量
            $teams_count = $this->MUser->getTeamsCount($userid);
            $followings_count = $this->MUser->getFollowingCount($userid);
            $followers_count = $this->MUser->getFollowersCount($userid);
            $ghosts_count = $this->MUser->getGhostUsersCount($userid);

            // 获取好友列表 (互相关注)
            $friends = $this->MUser->getFriends($userid);

            echo json_encode([
                'code' => 200,
                'teams_count' => $teams_count,
                'followings_count' => $followings_count,
                'followers_count' => $followers_count,
                'ghosts_count' => $ghosts_count,
                'friends' => $friends,
                'friends_count' => count($friends)
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误'
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    /**
     * 获取我的粉丝列表 (关注我的人)
     */
    public function getFollowers() {
        try {
            $userid = $this->getUser();
            if (!$userid) {
                echo json_encode([
                    'code' => 401,
                    'message' => '请先登录'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $followers = $this->MUser->getFollowers($userid);

            echo json_encode([
                'code' => 200,
                'followers' => $followers,
                'total' => count($followers)
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    /**
     * 获取我关注的人列表
     */
    public function getFollowings() {
        try {
            $userid = $this->getUser();
            if (!$userid) {
                echo json_encode([
                    'code' => 401,
                    'message' => '请先登录'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $followings = $this->MUser->getFollowings($userid);

            echo json_encode([
                'code' => 200,
                'followings' => $followings,
                'total' => count($followings)
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误'
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    /**
     * 获取非注册好友(占位用户)列表
     */
    public function getGhostUsers() {
        try {
            $userid = $this->getUser();
            if (!$userid) {
                echo json_encode([
                    'code' => 401,
                    'message' => '请先登录'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $ghosts = $this->MUser->getGhostUsers($userid);

            echo json_encode([
                'code' => 200,
                'ghosts' => $ghosts,
                'total' => count($ghosts)
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误'
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    /**
     * 删除非注册好友(占位用户)
     */
    public function deleteGhostUser() {
        try {
            $userid = $this->getUser();
            if (!$userid) {
                echo json_encode([
                    'code' => 401,
                    'message' => '请先登录'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $json_paras = json_decode(file_get_contents('php://input'), true);
            $ghost_userid = isset($json_paras['ghost_userid']) ? intval($json_paras['ghost_userid']) : 0;

            if (!$ghost_userid) {
                echo json_encode([
                    'code' => 400,
                    'message' => '缺少用户ID'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $result = $this->MUser->deleteGhostUser($userid, $ghost_userid);

            if ($result) {
                echo json_encode([
                    'code' => 200,
                    'message' => '删除成功'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode([
                    'code' => 400,
                    'message' => '删除失败，该用户不存在或无权删除'
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误'
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    /**
     * 获取用户历史比赛成绩
     */
    public function getGameHistory() {
        try {
            $userid = $this->getUser();
            if (!$userid) {
                echo json_encode([
                    'code' => 401,
                    'message' => '请先登录'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $games = $this->MUser->getGameHistory($userid);

            echo json_encode([
                'code' => 200,
                'games' => $games,
                'total' => count($games)
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    /**
     * 更新用户资料（签名、性别）
     */
    public function updateProfile() {
        try {
            $userid = $this->getUser();
            if (!$userid) {
                echo json_encode([
                    'code' => 401,
                    'message' => '请先登录'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $json_paras = json_decode(file_get_contents('php://input'), true);

            $updateData = [];

            // 签名
            if (isset($json_paras['signature'])) {
                $updateData['signature'] = trim($json_paras['signature']);
            }

            // 性别 (male/female/unknown)
            if (isset($json_paras['gender'])) {
                $gender = $json_paras['gender'];
                if (in_array($gender, ['male', 'female', 'unknown'])) {
                    $updateData['gender'] = $gender;
                }
            }

            if (empty($updateData)) {
                echo json_encode([
                    'code' => 400,
                    'message' => '没有需要更新的内容'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $this->MUser->updateProfile($userid, $updateData);

            // 返回更新后的用户信息
            $user = $this->MUser->getUserbyId($userid);

            echo json_encode([
                'code' => 200,
                'message' => '更新成功',
                'user' => $user
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    /**
     * 生成用户二维码
     * 用于个人资料页面展示
     */
    public function UserQrcode() {
        logtext('<hr/>');
        logtext('<div><span class=functionname>' . date('Y-m-d H:i:s') . '  User/UserQrcode</span></div>');
        
        try {
            $userid = $this->getUser();
            if (!$userid) {
                echo json_encode([
                    'code' => 401,
                    'message' => '请先登录'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            logtext("  用户ID: " . $userid);

            // 获取用户信息
            $user = $this->MUser->getUserbyId($userid);
            if (!$user) {
                echo json_encode([
                    'code' => 404,
                    'message' => '用户不存在'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // 检查是否已经有二维码
            if (!empty($user['qrcode'])) {
                logtext("  已有二维码: " . $user['qrcode']);
                echo json_encode([
                    'code' => 200,
                    'message' => '获取成功',
                    'qrcode_url' => $user['qrcode']
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // 生成小程序码
            $filename = "user_qrcode_{$userid}.png";
            $qrcodePath = FCPATH . '../upload/qrcodes/' . $filename;
            
            // 获取微信access_token
            $access_token = $this->getWechatAccessToken();
            if (!$access_token) {
                throw new Exception('获取微信access_token失败');
            }
            
            logtext("  access_token获取成功");

            // 使用 getwxacode 接口生成小程序码
            $wechat_api_url = "https://api.weixin.qq.com/wxa/getwxacode?access_token={$access_token}";
            
            // 页面路径和参数
            $path = "pages/user-profile/user-profile?user_id={$userid}";
            
            logtext("  生成小程序码路径: " . $path);
            
            $post_data = json_encode([
                'path' => $path,
                'width' => 430
            ]);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $wechat_api_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            logtext("  微信接口返回HTTP状态码: " . $httpCode);

            if ($httpCode !== 200) {
                throw new Exception('微信接口返回错误状态码: ' . $httpCode);
            }

            // 检查返回结果是否是错误信息
            $resultJson = json_decode($result, true);
            if ($resultJson && isset($resultJson['errcode']) && $resultJson['errcode'] != 0) {
                $errorMsg = isset($resultJson['errmsg']) ? $resultJson['errmsg'] : '未知错误';
                logtext("  微信接口返回错误: errcode={$resultJson['errcode']}, errmsg={$errorMsg}");
                throw new Exception("微信接口错误: {$errorMsg} (errcode: {$resultJson['errcode']})");
            }

            // 保存二维码到服务器
            $upload_path = FCPATH . '../upload/qrcodes/';
            if (!is_dir($upload_path)) {
                mkdir($upload_path, 0755, true);
            }
            
            if (!file_put_contents($qrcodePath, $result)) {
                throw new Exception('保存二维码文件失败');
            }

            logtext("  二维码保存成功: " . $qrcodePath);

            // 更新数据库中的二维码路径
            $qrcodeUrl = '/upload/qrcodes/' . $filename;
            $this->MUser->updateUserQrcode($userid, $qrcodeUrl);

            echo json_encode([
                'code' => 200,
                'message' => '生成成功',
                'qrcode_url' => $qrcodeUrl
            ], JSON_UNESCAPED_UNICODE);

        } catch (Exception $e) {
            logtext("  生成二维码失败: " . $e->getMessage());
            echo json_encode([
                'code' => 500,
                'message' => '生成二维码失败: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    /**
     * 获取微信access_token
     * 参考Game控制器的实现
     */
    private function getWechatAccessToken() {
        $appid = config_item('appid');
        $secret = config_item('secret');
        $url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={$appid}&secret={$secret}";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        return isset($result['access_token']) ? $result['access_token'] : false;
    }
}
