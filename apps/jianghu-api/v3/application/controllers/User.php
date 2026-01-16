<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}



class User extends MY_Controller {


    // 获取好友列表
    public function getFriendList() {
        $user_id = $this->getUser();
        $ret = [];
        $friends = $this->MUser->getFriends($user_id);
        $ret['code'] = 200;
        $ret['friends'] = $friends;
        $ret['total'] = count($friends);
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }



    public function getUserInfo() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = intval($json_paras['user_id']);
    }


    // public function getUserProfile() {
    //     try {
    //         $json_paras = json_decode(file_get_contents('php://input'), true);
    //         $user_id = isset($json_paras['user_id']) ? intval($json_paras['user_id']) : 0;

    //         if (!$user_id) {
    //             echo json_encode([
    //                 'code' => 400,
    //                 'message' => '缺少用户ID'
    //             ], JSON_UNESCAPED_UNICODE);
    //             return;
    //         }

    //         $user = $this->MUser->getUserProfile($user_id);

    //         if (!$user) {
    //             echo json_encode([
    //                 'code' => 404,
    //                 'message' => '用户不存在'
    //             ], JSON_UNESCAPED_UNICODE);
    //             return;
    //         }

    //         // 获取当前登录用户ID
    //         $current_user_id = $this->getUser();

    //         // 获取关系信息
    //         $is_self = ($current_user_id == $user_id);
    //         $is_following = false;
    //         $is_blocked = false;
    //         $is_blocked_by = false;
    //         if ($current_user_id && !$is_self) {
    //             $is_following = $this->MUser->isFollowing($current_user_id, $user_id);
    //             $is_blocked = $this->MUser->isBlocked($current_user_id, $user_id);
    //             $is_blocked_by = $this->MUser->isBlockedBy($current_user_id, $user_id);
    //         }

    //         // 获取统计数据
    //         $followers_count = $this->MUser->getFollowersCount($user_id);
    //         $games_count = $this->MUser->getGamesCount($user_id);
    //         $teams_count = $this->MUser->getTeamsCount($user_id);

    //         echo json_encode([
    //             'code' => 200,
    //             'message' => 'OK',
    //             'data' => [
    //                 'user' => $user,
    //                 'relationship' => [
    //                     'is_self' => $is_self,
    //                     'is_following' => $is_following,
    //                     'is_blocked' => $is_blocked,
    //                     'is_blocked_by' => $is_blocked_by
    //                 ],
    //                 'stats' => [
    //                     'gamesCount' => $games_count,
    //                     'teamsCount' => $teams_count,
    //                     'followers_count' => $followers_count
    //                 ]
    //             ]
    //         ], JSON_UNESCAPED_UNICODE);
    //     } catch (Exception $e) {
    //         // 记录异常详情到日志
    //         logtext('<div class="error-block" style="background:#ffebee; border-left:4px solid #f44336; padding:10px; margin:10px 0;">');
    //         logtext('<strong style="color:#c62828;">[User/getUserProfile ERROR] ' . date('Y-m-d H:i:s') . '</strong>');
    //         logtext('Exception: ' . get_class($e));
    //         logtext('Message: ' . $e->getMessage());
    //         logtext('File: ' . $e->getFile() . ':' . $e->getLine());
    //         logtext('Stack trace:');
    //         logtext($e->getTraceAsString());
    //         logtext('Request params: ' . json_encode($json_paras ?? [], JSON_UNESCAPED_UNICODE));
    //         logtext('User ID: ' . ($user_id ?? 'N/A'));
    //         logtext('</div>');

    //         echo json_encode([
    //             'code' => 500,
    //             'message' => '服务器内部错误'
    //         ], JSON_UNESCAPED_UNICODE);
    //     }
    // }

    public function getUserProfile() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = intval($json_paras['user_id']);
        $current_user_id = $this->getUser();

        $user = $this->MUser->getUserProfile($user_id, $current_user_id);

        $is_self = ($current_user_id == $user_id);
        $is_following = $this->MUser->isFollowing($current_user_id, $user_id);
        $is_blocked = $this->MUser->isBlocked($current_user_id, $user_id);
        $is_blocked_by = $this->MUser->isBlockedBy($current_user_id, $user_id);

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
    }


    // 关注用户
    public function followUser() {
        $current_user_id = $this->getUser();
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $target_user_id = intval($json_paras['user_id']);

        $this->MUser->followUser($current_user_id, $target_user_id);

        echo json_encode([
            'code' => 200,
            'message' => '关注成功'
        ], JSON_UNESCAPED_UNICODE);
    }


    // 取消关注
    public function unfollowUser() {
        $current_user_id = $this->getUser();
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $target_user_id = intval($json_paras['user_id']);

        $this->MUser->unfollowUser($current_user_id, $target_user_id);

        echo json_encode([
            'code' => 200,
            'message' => '取消关注成功'
        ], JSON_UNESCAPED_UNICODE);
    }


    public function uploadAvatar() {
        logtext('<hr/>');
        logtext('<div><span class =functionname>' . date('Y-m-d H:i:s') . '  User/uploadAvatar</span></div>');
        logtext(" FILES:" . json_encode($_FILES, JSON_UNESCAPED_UNICODE));
        logtext(" POST:" . json_encode($_POST, JSON_UNESCAPED_UNICODE));

        $user_id = $this->getUser();
        logtext("  用户ID: " . $user_id);

        $file = $_FILES['avatar'];

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'avatar_' . $user_id . '_' . time() . '.' . $extension;
        $date_folder = date('Y/m/d/');
        $full_path = '/var/www/html/avatar/' . $date_folder;
        logtext("  文件保存路径: " . $full_path);
        if (!is_dir($full_path)) {
            mkdir($full_path, 0755, true);
        }
        $targetPath = $full_path . $fileName;

        move_uploaded_file($file['tmp_name'], $targetPath);

        logtext("  文件保存成功: " . $targetPath);

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
    }


    public function updateDisplayName() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $user_id = intval($json_paras['user_id']);
        $display_name = $json_paras['display_name'];

        $this->MUser->updateDisplayName($user_id, $display_name);

        echo json_encode([
            'code' => 200,
            'success' => true,
            'message' => 'OK 更新显示名称成功',
        ]);
    }


    public function createAndSelect() {
        $user_id = $this->getUser();
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $remarkName = trim($json_paras['remarkName']);
        $mobile = trim($json_paras['mobile']);

        if (strlen($mobile) !== 11) {
            $newuserid = $this->MUser->addRemakGhostUser($user_id, $remarkName, '');
            $ret = [];
            $ret['code'] = 200;
            $ret['message'] = 'OK 添加非注册用户成功';
            $ret['user'] = $this->MUser->getUserbyId($newuserid);
            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
            return;
        }

        $searchResult = $this->MUser->doubleSearchMobile($mobile);

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
        } else {
            $newuserid = $this->MUser->addMobileGhostUser($user_id, $remarkName, $mobile);
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
        $user_id = $this->getUser();

        $teams_count = $this->MUser->getTeamsCount($user_id);
        $followings_count = $this->MUser->getFollowingCount($user_id);
        $followers_count = $this->MUser->getFollowersCount($user_id);
        $ghosts_count = $this->MUser->getGhostUsersCount($user_id);

        $friends = $this->MUser->getFriends($user_id);

        echo json_encode([
            'code' => 200,
            'teams_count' => $teams_count,
            'followings_count' => $followings_count,
            'followers_count' => $followers_count,
            'ghosts_count' => $ghosts_count,
            'friends' => $friends,
            'friends_count' => count($friends)
        ], JSON_UNESCAPED_UNICODE);
    }



    /**
     * 获取我的粉丝列表 (关注我的人)
     */
    public function getFollowers() {
        $user_id = $this->getUser();
        $followers = $this->MUser->getFollowers($user_id);

        echo json_encode([
            'code' => 200,
            'followers' => $followers,
            'total' => count($followers)
        ], JSON_UNESCAPED_UNICODE);
    }


    /**
     * 获取我关注的人列表
     */
    public function getFollowings() {

        $user_id = $this->getUser();
        $followings = $this->MUser->getFollowings($user_id);
        echo json_encode([
            'code' => 200,
            'followings' => $followings,
            'total' => count($followings)
        ], JSON_UNESCAPED_UNICODE);
    }



    /**
     * 获取非注册好友(占位用户)列表
     */
    public function getGhostUsers() {
        $user_id = $this->getUser();
        $ghosts = $this->MUser->getGhostUsers($user_id);

        echo json_encode([
            'code' => 200,
            'ghosts' => $ghosts,
            'total' => count($ghosts)
        ], JSON_UNESCAPED_UNICODE);
    }


    /**
     * 删除非注册好友(占位用户)
     */
    public function deleteGhostUser() {
        $user_id = $this->getUser();
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $ghost_userid = intval($json_paras['ghost_userid']);

        $this->MUser->deleteGhostUser($user_id, $ghost_userid);

        echo json_encode([
            'code' => 200,
            'message' => '删除成功'
        ], JSON_UNESCAPED_UNICODE);
    }


    /**
     * 获取用户历史比赛成绩
     */
    public function getGameHistory() {
        $user_id = $this->getUser();
        $games = $this->MUser->getGameHistory($user_id);

        echo json_encode([
            'code' => 200,
            'games' => $games,
            'total' => count($games)
        ], JSON_UNESCAPED_UNICODE);
    }


    /**
     * 更新用户资料（签名、性别）
     */
    public function updateProfile() {
        $user_id = $this->getUser();
        $json_paras = json_decode(file_get_contents('php://input'), true);

        $updateData = [];

        if (isset($json_paras['signature'])) {
            $updateData['signature'] = trim($json_paras['signature']);
        }

        if (isset($json_paras['gender'])) {
            $updateData['gender'] = $json_paras['gender'];
        }

        $this->MUser->updateProfile($user_id, $updateData);

        $user = $this->MUser->getUserbyId($user_id);

        echo json_encode([
            'code' => 200,
            'message' => '更新成功',
            'user' => $user
        ], JSON_UNESCAPED_UNICODE);
    }


    /**
     * 生成用户二维码
     * 用于个人资料页面展示
     */
    public function UserQrcode() {

        $user_id = $this->getUser();

        $user = $this->MUser->getUserbyId($user_id);

        // 检查是否需要强制重新生成
        // 临时方案：为了修复路径问题，暂时强制重新生成所有二维码
        // 如果二维码文件不存在，也需要重新生成
        $forceRegenerate = false;
        if (!empty($user['qrcode'])) {
            $existingQrcodePath = FCPATH . '..' . $user['qrcode'];
            if (!file_exists($existingQrcodePath)) {
                logtext("  二维码文件不存在，需要重新生成");
                $forceRegenerate = true;
            }
            // 临时：强制重新生成以使用新路径
            // TODO: 后续可以添加路径版本检查，只在新路径格式时重新生成
            $forceRegenerate = true;
            logtext("  强制重新生成二维码以使用新路径格式");
        }

        // 如果不需要强制重新生成，返回已有二维码
        if (!$forceRegenerate && !empty($user['qrcode'])) {
            logtext("  已有二维码: " . $user['qrcode']);
            echo json_encode([
                'code' => 200,
                'message' => '获取成功',
                'qrcode_url' => $user['qrcode']
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $filename = "user_qrcode_{$user_id}.png";
        $qrcodePath = FCPATH . '../upload/qrcodes/' . $filename;

        $access_token = $this->getWechatAccessToken();

        $wechat_api_url = "https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token={$access_token}";
        $path = "packagePlayer/user-profile/user-profile";
        $path = ltrim($path, '/');


        // scene 字段用于传递参数，最大32个字符
        // 格式：user_id=14
        $scene = "user_id={$user_id}";

        logtext("  scene参数: " . $scene);

        $post_data = json_encode([
            'scene' => $scene,
            'page' => $path,
            'width' => 460,
            'env_version' => 'develop',
            'auto_color' => false,
            'is_hyaline' => false,
            'check_path' => false  // 设置为 false，跳过路径校验（适用于页面未发布或分包页面）
        ], JSON_UNESCAPED_UNICODE);

        logtext("  请求数据: " . $post_data);

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

        // 检查返回结果是否是图片（成功时返回图片二进制数据）
        // 如果返回的是 JSON 错误信息，说明生成失败
        $isJson = false;
        $errorInfo = null;
        if (substr($result, 0, 1) === '{') {
            $isJson = true;
            $errorInfo = json_decode($result, true);
            logtext("  微信API返回错误: " . json_encode($errorInfo, JSON_UNESCAPED_UNICODE));
        }

        if ($isJson || $httpCode !== 200) {
            logtext("  二维码生成失败，HTTP状态码: " . $httpCode);
            $errorMsg = isset($errorInfo['errmsg']) ? $errorInfo['errmsg'] : '未知错误';
            echo json_encode([
                'code' => 500,
                'message' => '二维码生成失败: ' . $errorMsg,
                'error_info' => $errorInfo
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $upload_path = FCPATH . '../upload/qrcodes/';
        if (!is_dir($upload_path)) {
            mkdir($upload_path, 0755, true);
        }

        file_put_contents($qrcodePath, $result);

        logtext("  二维码保存成功: " . $qrcodePath);

        $qrcodeUrl = '/upload/qrcodes/' . $filename;
        $this->MUser->updateUserQrcode($user_id, $qrcodeUrl);

        echo json_encode([
            'code' => 200,
            'message' => '生成成功',
            'qrcode_url' => $qrcodeUrl
        ], JSON_UNESCAPED_UNICODE);
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

    public function updateRemark() {
        $user_id = $this->getUser();
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $target_user_id = intval($json_paras['target_user_id']);
        $remark_name = trim($json_paras['remark_name']);

        $this->MUser->updateRemark($user_id, $target_user_id, $remark_name);

        echo json_encode([
            'code' => 200,
            'message' => '更新成功'
        ], JSON_UNESCAPED_UNICODE);
    }



    public function blockUser() {
        $user_id = $this->getUser();
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $blocked_userid = intval($json_paras['blocked_userid']);
        $this->MUser->blockUser($user_id, $blocked_userid);

        echo json_encode([
            'code' => 200,
            'message' => '拉黑成功'
        ], JSON_UNESCAPED_UNICODE);
    }
}
