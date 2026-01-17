<?php

require 'vendor/autoload.php';


class MWeixin extends CI_Model {

    /**
     * 获取微信access_token
     * 参考Game控制器的实现
     */
    public function getWechatAccessToken() {
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

    /**
     * 获取小程序码图片（二进制数据）
     */
    public function createQrcodeImg($apiName, $payload, $fileOptions = null) {
        $access_token = $this->getWechatAccessToken();
        if (!$access_token) {
            return [
                'success' => false,
                'error' => [
                    'message' => 'access_token获取失败'
                ]
            ];
        }

        $wechat_api_url = "https://api.weixin.qq.com/wxa/{$apiName}?access_token={$access_token}";
        $post_data = json_encode($payload, JSON_UNESCAPED_UNICODE);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $wechat_api_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($result === false) {
            return [
                'success' => false,
                'http_code' => $httpCode,
                'error' => [
                    'message' => $curlError ?: 'curl请求失败'
                ]
            ];
        }

        $errorInfo = null;
        $isJson = false;
        if (is_string($result) && $result !== '' && $result[0] === '{') {
            $isJson = true;
            $errorInfo = json_decode($result, true);
        }

        if ($isJson || $httpCode !== 200) {
            return [
                'success' => false,
                'http_code' => $httpCode,
                'error' => $errorInfo,
                'raw' => $result
            ];
        }

        $response = [
            'success' => true,
            'http_code' => $httpCode,
            'data' => $result
        ];

        if (!empty($fileOptions)) {
            $savePath = $fileOptions['save_path'] ?? null;
            $publicUrl = $fileOptions['public_url'] ?? null;
            $ensureDir = $fileOptions['ensure_dir'] ?? null;

            if (empty($savePath)) {
                return [
                    'success' => false,
                    'http_code' => $httpCode,
                    'error' => [
                        'message' => 'save_path不能为空'
                    ]
                ];
            }

            if (empty($ensureDir)) {
                $ensureDir = dirname($savePath);
            }

            if (!is_dir($ensureDir)) {
                if (!mkdir($ensureDir, 0755, true)) {
                    return [
                        'success' => false,
                        'http_code' => $httpCode,
                        'error' => [
                            'message' => '二维码目录创建失败'
                        ]
                    ];
                }
            }

            $bytesWritten = file_put_contents($savePath, $result);
            if ($bytesWritten === false) {
                return [
                    'success' => false,
                    'http_code' => $httpCode,
                    'error' => [
                        'message' => '二维码写入失败'
                    ]
                ];
            }

            $response['file_path'] = $savePath;
            if (!empty($publicUrl)) {
                $response['file_url'] = $publicUrl;
            }
        }

        return $response;
    }
}
