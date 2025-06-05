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

        $json_paras = (array) json_decode(file_get_contents('php://input'));
        $code = $json_paras['code'];

        try {

            if (empty($code)) {
                throw new \InvalidArgumentException('缺少微信登录凭证');
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

            if (isset($result['errcode'])) {
                throw new \RuntimeException("微信登录失败: {$result['errmsg']}");
            }

            // 获取openid和session_key
            $openid = $result['openid'] ?? '';
            $session_key = $result['session_key'] ?? '';

            if (empty($openid)) {
                throw new \RuntimeException('获取openid失败');
            }

            // TODO: 这里可以添加用户信息处理逻辑
            // 例如：创建/更新用户记录，生成自定义token等

            $payload = [
                'uid' => 111,
                'openid' => $openid,
                'role' =>  'user'
            ];


            $token = $this->MJwtUtil->generateToken($payload, 72000);
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
}
