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
        logtext(" 参数:" . json_encode(file_get_contents('php://input'), JSON_UNESCAPED_UNICODE));

        $json_paras = $this->readRequestBody();
        $code = $json_paras['code'] ?? '';
        $encryptedData = $json_paras['encryptedData'] ?? '';
        $iv = $json_paras['iv'] ?? '';

        try {
            if (empty($code) || empty($encryptedData) || empty($iv)) {
                throw new \InvalidArgumentException('缺少必要参数');
            }

            $session = $this->requestSessionByCode($code);
            $session_key = $session['session_key'];

            // 解密数据
            $decrypted = openssl_decrypt(
                base64_decode($encryptedData),
                'aes-128-cbc',
                base64_decode($session_key),
                OPENSSL_RAW_DATA,
                base64_decode($iv)
            );

            if ($decrypted === false) {
                throw new \RuntimeException('解密失败');
            }

            $phoneInfo = json_decode($decrypted, true);
            logtext("  解密后数据->" . json_encode($phoneInfo));

            if (!isset($phoneInfo['phoneNumber'])) {
                throw new \RuntimeException('获取手机号失败');
            }

            // 获取用户信息
            $payload = $this->requireToken();
            $user_id = $payload['uid'];

            // 更新用户手机号
            $this->MUser->updateUserPhone($user_id, $phoneInfo['phoneNumber']);

            $user = $this->MUser->getUserbyId($user_id);
            $profileStatus = $this->buildProfileStatus($user);

            echo json_encode([
                'code' => 200,
                'success' => true,
                'phoneNumber' => $phoneInfo['phoneNumber'],
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
        $nickname = isset($profile['wx_nickname']) ? $profile['wx_nickname'] : '';
        $altNickname = isset($profile['nickname']) ? $profile['nickname'] : '';
        $avatar = isset($profile['avatar']) ? $profile['avatar'] : '';
        $hasNickname = !empty($nickname) || !empty($altNickname);
        $hasAvatar = !empty($avatar) && strpos($avatar, 'user_default_avatar.png') === false;
        $hasMobile = !empty($profile['mobile']);

        return [
            'has_nickname' => $hasNickname,
            'has_avatar' => $hasAvatar,
            'has_mobile' => $hasMobile
        ];
    }
}
