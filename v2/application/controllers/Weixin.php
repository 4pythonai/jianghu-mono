<?php

ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Weixin extends CI_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }

    /**
     * 处理微信登录请求
     * 
     * appid : wx62b6740a324428d1
     * secret :4a24df970c85a83473e24f632921da14
     * 
     * @return array 返回登录结果
     */
    public function wxLogin() {
        logtext('<hr/>');
        logtext('<div><span class =functionname>' . date('Y-m-d H:i:s') . '  Weixin/wxlogin</span></div>');
        logtext(" 参数:" . json_encode(file_get_contents('php://input'), JSON_UNESCAPED_UNICODE));

        $json_paras = (array) json_decode(file_get_contents('php://input'));
        $code = $json_paras['code'];

        try {

            if (empty($code)) {
                throw new \InvalidArgumentException('缺少微信登录凭证/code');
            }

            // 微信配置参数 - 需要替换为实际的appid和secret
            $appid = 'wx62b6740a324428d1';
            $secret = '4a24df970c85a83473e24f632921da14';
            $grant_type = 'authorization_code';

            // 构建请求URL
            $url = "https://api.weixin.qq.com/sns/jscode2session?appid={$appid}&secret={$secret}&js_code={$code}&grant_type={$grant_type}";

            // 调用微信API
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $response = curl_exec($ch);
            curl_close($ch);

            // 解析响应
            $result = json_decode($response, true);
            logtext("  微信返回->" . json_encode($result));

            if (isset($result['errcode'])) {
                throw new \RuntimeException("微信登录失败: {$result['errmsg']}");
            }

            // 获取openid和session_key
            $openid = $result['openid'] ?? '';
            $session_key = $result['session_key'] ?? '';

            if (empty($openid)) {
                throw new \RuntimeException('获取openid失败');
            }

            if ($this->MUser->openidExists($openid)) {
                $user = $this->MUser->getUserbyOpenid($openid);
                $mobile = $user['mobile'];
                $user_id = $user['id'];
            } else {
                $user_id = $this->MUser->addWeixinUser($openid);
                $mobile = null;
            }

            $payload = [
                'uid' => $user_id,
                'openid' => $openid,
                'mobile' =>  $mobile
            ];


            $token = $this->MJwtUtil->generateToken($payload, 120);
            echo json_encode([
                'code' => 200,
                'success' => true,
                'token' => $token,
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

        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $payload = $this->MJwtUtil->verifyToken($token);


        $user_id = $payload['uid'];
        $user = $this->MUser->getUserbyId($user_id);
        echo json_encode([
            'code' => 200,
            'success' => true,
            'user' => $user
        ], JSON_UNESCAPED_UNICODE);
    }


    public function bindPhoneNumber() {
        logtext('<hr/>');
        logtext('<div><span class =functionname>' . date('Y-m-d H:i:s') . '  Weixin/bindPhoneNumber</span></div>');
        logtext(" 参数:" . json_encode(file_get_contents('php://input'), JSON_UNESCAPED_UNICODE));

        $json_paras = (array) json_decode(file_get_contents('php://input'));
        $code = $json_paras['code'] ?? '';
        $encryptedData = $json_paras['encryptedData'] ?? '';
        $iv = $json_paras['iv'] ?? '';

        try {
            if (empty($code) || empty($encryptedData) || empty($iv)) {
                throw new \InvalidArgumentException('缺少必要参数');
            }

            // 获取session_key
            $appid = 'wx62b6740a324428d1';
            $secret = '4a24df970c85a83473e24f632921da14';
            $grant_type = 'authorization_code';

            $url = "https://api.weixin.qq.com/sns/jscode2session?appid={$appid}&secret={$secret}&js_code={$code}&grant_type={$grant_type}";

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $response = curl_exec($ch);
            curl_close($ch);

            $result = json_decode($response, true);

            if (isset($result['errcode'])) {
                throw new \RuntimeException("获取session_key失败: {$result['errmsg']}");
            }

            $session_key = $result['session_key'] ?? '';
            if (empty($session_key)) {
                throw new \RuntimeException('获取session_key失败');
            }

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
            $headers = getallheaders();
            $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
            $payload = $this->MJwtUtil->verifyToken($token);

            if (!$payload) {
                throw new \RuntimeException('无效的token');
            }

            $user_id = $payload['uid'];

            // 更新用户手机号
            $this->MUser->updateUserPhone($user_id, $phoneInfo['phoneNumber']);

            echo json_encode([
                'code' => 200,
                'success' => true,
                'phoneNumber' => $phoneInfo['phoneNumber']
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            echo json_encode([
                'code' => 500,
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
