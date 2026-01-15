<?php

ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Weixin extends CI_Controller {
    private $appid;
    private $secret;

    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
        $this->appid = config_item('appid');
        $this->secret = config_item('secret');
    }

    /**
     * 处理微信登录请求
     * 
 
     * 
     * @return array 返回登录结果
     */
    public function wxLogin() {
        logtext('<hr/>');
        logtext('<div><span class =functionname>' . date('Y-m-d H:i:s') . '  Weixin/wxlogin</span></div>');
        logtext(" 参数:" . json_encode(file_get_contents('php://input'), JSON_UNESCAPED_UNICODE));

        $json_paras = $this->readRequestBody();
        $code = isset($json_paras['code']) ? $json_paras['code'] : '';

        try {
            if (empty($code)) {
                throw new \InvalidArgumentException('缺少微信登录凭证/code');
            }

            $session = $this->requestSessionByCode($code);
            $openid = $session['openid'];
            $session_key = $session['session_key'];

            if ($this->MUser->openidExists($openid)) {
                $user = $this->MUser->getUserbyOpenid($openid);
                $mobile = $user['mobile'];
                $user_id = $user['id'];
                $profile = $this->MUser->getUserbyId($user_id);
            } else {
                $user_id = $this->MUser->addWeixinUser($openid);
                $mobile = null;
                $profile = $this->MUser->getUserbyId($user_id);
            }

            $payload = [
                'uid' => $user_id,
                'openid' => $openid,
                'mobile' =>  $mobile
            ];


            $token = $this->MJwtUtil->generateToken($payload, 864000); // 10 天
            $profileStatus = $this->buildProfileStatus($profile);

            echo json_encode([
                'code' => 200,
                'success' => true,
                'token' => $token,
                'user' => $profile,
                'profile_status' => $profileStatus,
                'need_bind_phone' => !$profileStatus['has_mobile'],
                'openid' => $openid,
                'session_key' => $session_key
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            echo json_encode([
                'code' => 500,
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    public function getUserInfo() {
        logtext('<hr/>');
        logtext('<div><span class =functionname>' . date('Y-m-d H:i:s') . '  Weixin/getUserInfo</span></div>');
        logtext(" 参数:" . json_encode(file_get_contents('php://input'), JSON_UNESCAPED_UNICODE));

        try {
            $payload = $this->requireToken();
            $user_id = $payload['uid'];
            $user = $this->MUser->getUserbyId($user_id);
            $profileStatus = $this->buildProfileStatus($user);
            echo json_encode([
                'code' => 200,
                'success' => true,
                'user' => $user,
                'profile_status' => $profileStatus,
                'need_bind_phone' => !$profileStatus['has_mobile']
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            echo json_encode([
                'code' => 500,
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    public function bindPhoneNumber() {
        logtext('<hr/>');
        logtext('<div><span class =functionname>' . date('Y-m-d H:i:s') . '  Weixin/bindPhoneNumber</span></div>');
        
        // 读取一次请求体
        $rawBody = file_get_contents('php://input');
        logtext(" 参数:" . $rawBody);

        $json_paras = json_decode($rawBody, true);
        if (!is_array($json_paras)) {
            $json_paras = [];
        }

        $code = $json_paras['code'] ?? '';
        
        // 兼容旧版参数
        $encryptedData = $json_paras['encryptedData'] ?? '';
        $iv = $json_paras['iv'] ?? '';

        try {
            $phoneNumber = '';

            // 优先使用新版 API (code换取)
            if (!empty($code)) {
                $access_token = $this->getWechatAccessToken();
                $url = "https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token={$access_token}";
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['code' => $code]));
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                $response = curl_exec($ch);
                curl_close($ch);

                $result = json_decode($response, true);
                logtext("  微信API返回->" . json_encode($result));

                if (isset($result['errcode']) && $result['errcode'] !== 0) {
                    throw new \RuntimeException("获取手机号失败: {$result['errmsg']}");
                }

                $phoneNumber = $result['phone_info']['phoneNumber'];
            } 
            // 降级使用旧版 API (解密)
            else if (!empty($encryptedData) && !empty($iv)) {
                 // 注意: 这里需要 session_key，但如果是通过 wx.login 获取的 code 换取的 session_key，
                 // 会导致解密失败 (因为 encryptedData 是用旧 session_key 加密的)
                 // 除非前端保证不刷新 session_key
                 throw new \RuntimeException('请更新小程序版本以支持手机号绑定');
            } else {
                throw new \InvalidArgumentException('缺少必要参数');
            }

            if (empty($phoneNumber)) {
                throw new \RuntimeException('获取手机号为空');
            }

            // 获取用户信息
            $payload = $this->requireToken();
            $user_id = $payload['uid'];

            // 更新用户手机号
            $this->MUser->updateUserPhone($user_id, $phoneNumber);

            $user = $this->MUser->getUserbyId($user_id);
            $profileStatus = $this->buildProfileStatus($user);

            echo json_encode([
                'code' => 200,
                'success' => true,
                'phoneNumber' => $phoneNumber,
                'user' => $user,
                'profile_status' => $profileStatus,
                'need_bind_phone' => !$profileStatus['has_mobile']
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            echo json_encode([
                'code' => 500,
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    private function getWechatAccessToken() {
        $appid = config_item('appid');
        $secret = config_item('secret');
        // 这里应该添加缓存逻辑，避免频繁调用
        // 简单起见，先直接调用 (生产环境建议使用 Redis 或文件缓存)
        $url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={$appid}&secret={$secret}";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        if (isset($result['errcode']) && $result['errcode'] !== 0) {
             throw new \RuntimeException("获取AccessToken失败: {$result['errmsg']}");
        }
        return $result['access_token'];
    }


    private function readRequestBody() {
        $body = file_get_contents('php://input');
        return $body ? json_decode($body, true) : array();
    }

    private function requestSessionByCode($code) {
        $grant_type = 'authorization_code';
        $url = "https://api.weixin.qq.com/sns/jscode2session?appid={$this->appid}&secret={$this->secret}&js_code={$code}&grant_type={$grant_type}";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        logtext("  微信返回->" . json_encode($result));

        if (isset($result['errcode'])) {
            throw new \RuntimeException("微信登录失败: {$result['errmsg']}");
        }

        if (empty($result['openid']) || empty($result['session_key'])) {
            throw new \RuntimeException('获取openid或session_key失败');
        }

        return $result;
    }

    private function requireToken() {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', isset($headers['Authorization']) ? $headers['Authorization'] : '');
        $payload = $this->MJwtUtil->verifyToken($token);
        if (!$payload) {
            throw new \RuntimeException('无效的token');
        }
        return $payload;
    }

    private function buildProfileStatus($profile) {
        $wx_name = isset($profile['wx_name']) ? $profile['wx_name'] : '';
        $display_name = isset($profile['display_name']) ? $profile['display_name'] : '';
        $avatar = isset($profile['avatar']) ? $profile['avatar'] : '';
        $hasNickname = !empty($wx_name) || !empty($display_name);
        $hasAvatar = !empty($avatar) && strpos($avatar, 'user_default_avatar.png') === false;
        $hasMobile = !empty($profile['mobile']);

        return [
            'has_nickname' => $hasNickname,
            'has_avatar' => $hasAvatar,
            'has_mobile' => $hasMobile
        ];
    }
}
