<?php


class MJwtUtil extends CI_Model {

    private static $secretKey = 'golf-api-key-20201245'; // 替换为你的密钥
    private static $algorithm = 'HS256'; // 加密算法

    public function __construct() {
        parent::__construct();
    }




    /**
     * 生成JWT Token
     * @param array $payload 负载数据
     * @param int $expire 过期时间(秒)
     * @return string JWT Token
     */
    public static function generateToken(array $payload, int $expire): string {
        $header = [
            'alg' => self::$algorithm,
            'typ' => 'JWT'
        ];

        // 设置标准声明
        $payload['iat'] = time(); // 签发时间
        $payload['exp'] = time() + $expire; // 过期时间

        $base64Header = self::base64UrlEncode(json_encode($header));
        $base64Payload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, self::$secretKey, true);
        $base64Signature = self::base64UrlEncode($signature);

        return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
    }

    /**
     * 验证JWT Token
     * @param string $token JWT Token
     * @return array|false 成功返回payload数组，失败返回false
     */
    public static function verifyToken(string $token) {
        $tokens = explode('.', $token);
        if (count($tokens) != 3) {
            return false;
        }

        list($base64Header, $base64Payload, $base64Signature) = $tokens;

        // 验证签名
        $signature = self::base64UrlDecode($base64Signature);
        $expectedSignature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, self::$secretKey, true);

        if (!hash_equals($signature, $expectedSignature)) {
            logtext('MJwtUtil  验证签名 verify failed');
            return false;
        }

        $payload = json_decode(self::base64UrlDecode($base64Payload), true);

        // 验证过期时间
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            logtext('MJwtUtil  验证过期时间 verify failed');
            logtext('过期时间:' .  $payload['exp'] . ' <当前时间:' . time());
            return false;
        } else {
            logtext('MJwtUtil  验证过期时间 verify success');
            $remainingSeconds = $payload['exp'] - time();
            $days = floor($remainingSeconds / 86400);
            $hours = floor(($remainingSeconds % 86400) / 3600);
            $minutes = floor(($remainingSeconds % 3600) / 60);
            $seconds = $remainingSeconds % 60;
            logtext('Token还有' . $days . '天' . $hours . '小时' . $minutes . '分钟' . $seconds . '秒过期');
        }

        return $payload;
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}
