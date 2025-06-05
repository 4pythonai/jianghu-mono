<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Poster extends CI_Controller {
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
     * 生成带圆角、半透明、毛玻璃质感的矩形资源
     * @param int $width
     * @param int $height
     * @return resource
     */
    private function createGlassRectResource($width, $height) {
        $radius = (int)min($width, $height) * 0.06; // 圆角半径
        $img = imagecreatetruecolor($width, $height);
        imagealphablending($img, false);
        imagesavealpha($img, true);
        $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
        imagefilledrectangle($img, 0, 0, $width, $height, $transparent);
        $glass = imagecolorallocatealpha($img, 255, 255, 255, 100);
        $this->drawRoundedRect($img, 0, 0, $width, $height, $radius, $glass);
        $this->simpleBlur($img, 2);
        $highlight = imagecolorallocatealpha($img, 255, 255, 255, 110);
        imagefilledellipse($img, $width/2, $height/3, $width*0.8, $height*0.3, $highlight);
        return $img;
    }

    public function createPoster() {
        // 获取背景图片路径
        $bg_path = FCPATH . '../golf-poster/mobile_bg.png';
        $qrcode_path = FCPATH . '../golf-poster/mini-code-removebg-preview.png';
        $player_path = FCPATH . '../golf-poster/player-pure.png';
        
        // 读取图片内容
        $bg_content = file_get_contents($bg_path);
        $qrcode_content = file_get_contents($qrcode_path);
        $player_content = file_get_contents($player_path);
        
        if ($bg_content === false || $qrcode_content === false || $player_content === false) {
            echo json_encode([
                'code' => 500,
                'msg' => '无法读取图片内容'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 创建图片资源
        $bg_image = imagecreatefromstring($bg_content);
        $qrcode_image = imagecreatefromstring($qrcode_content);
        $player_image = imagecreatefromstring($player_content);
        
        if ($bg_image === false || $qrcode_image === false || $player_image === false) {
            echo json_encode([
                'code' => 500,
                'msg' => '无法创建图片资源'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 添加用户照片到背景图片
        $this->addPlayerImg($bg_image, $player_image, 0.6); // 用户照片高度占背景高度的 60%

        // 生成毛玻璃矩形（二维码容器）
        $glass_width = 400;
        $glass_height = 400;
        $glass_image = $this->createGlassRectResource($glass_width, $glass_height);

        // 在毛玻璃矩形中央添加二维码
        // 这里我们需要一个新的 addMiniQrCodeToRect 方法，二维码居中
        $this->addMiniQrCode($glass_image, $qrcode_image, 0.5, 0); // scale_factor=0.5, margin=0

        // 计算毛玻璃矩形放在背景图的位置（居中）
        $bg_width = imagesx($bg_image);
        $bg_height = imagesy($bg_image);
        $glass_x = ($bg_width - $glass_width) / 2;
        $glass_y = ($bg_height - $glass_height) / 2;

        // 合并毛玻璃矩形到背景图
        imagecopy($bg_image, $glass_image, $glass_x, $glass_y, 0, 0, $glass_width, $glass_height);

        // 输出图片
        header('Content-Type: image/png');
        imagepng($bg_image);
        imagedestroy($bg_image);
        imagedestroy($qrcode_image);
        imagedestroy($player_image);
        imagedestroy($glass_image);
    }

    
    /**
     * 添加用户照片到背景图片
     * @param resource $bg_image 背景图片资源
     * @param resource $player_image 用户照片资源
     * @param float $height_ratio 用户照片高度占背景高度的比例 (0-1)
     * @return void
     */

    private function addPlayerImg($bg_image, $player_image, $height_ratio = 0.6) {
        // 获取图片尺寸
        $bg_width = imagesx($bg_image);
        $bg_height = imagesy($bg_image);
        $player_width = imagesx($player_image);
        $player_height = imagesy($player_image);

        // 计算用户照片的目标高度
        $target_height = $bg_height * $height_ratio;
        
        // 计算等比例缩放后的宽度
        $target_width = $player_width * ($target_height / $player_height);

        // 创建调整大小后的用户照片
        $resized_player = imagecreatetruecolor($target_width, $target_height);
        
        // 保持透明度
        imagealphablending($resized_player, false);
        imagesavealpha($resized_player, true);
        $transparent = imagecolorallocatealpha($resized_player, 255, 255, 255, 127);
        imagefilledrectangle($resized_player, 0, 0, $target_width, $target_height, $transparent);

        // 调整用户照片大小
        imagecopyresampled(
            $resized_player, $player_image,
            0, 0, 0, 0,
            $target_width, $target_height,
            $player_width, $player_height
        );

        // 计算用户照片位置（水平居中，垂直位置在背景高度的 20% 处）
        $player_x = ($bg_width - $target_width) / 2;
        $player_y = $bg_height * 0.2;

        // 合并图片
        imagecopy($bg_image, $resized_player, $player_x, $player_y, 0, 0, $target_width, $target_height);

        // 释放临时图片资源
        imagedestroy($resized_player);
    }

    /**
     * 添加圆形二维码到背景图片
     * @param resource $bg_image 背景图片资源
     * @param resource $qrcode_image 二维码图片资源
     * @param float $scale_factor 缩放因子 (0-1)
     * @param int $margin 边距
     * @return void
     */
    private function addMiniQrCode($bg_image, $qrcode_image, $scale_factor = 0.4, $margin = 20) {
        // 获取图片尺寸
        $bg_width = imagesx($bg_image);
        $bg_height = imagesy($bg_image);
        $qrcode_width = imagesx($qrcode_image);
        $qrcode_height = imagesy($qrcode_image);

        // 计算圆形二维码尺寸
        $circle_size = min($qrcode_width, $qrcode_height) * $scale_factor;
        
        // 创建圆形二维码
        $circle_image = imagecreatetruecolor($circle_size, $circle_size);
        
        // 保持透明度
        imagealphablending($circle_image, false);
        imagesavealpha($circle_image, true);
        $transparent = imagecolorallocatealpha($circle_image, 255, 255, 255, 127);
        imagefilledrectangle($circle_image, 0, 0, $circle_size, $circle_size, $transparent);
        
        // 创建圆形遮罩
        $mask = imagecreatetruecolor($circle_size, $circle_size);
        $white = imagecolorallocate($mask, 255, 255, 255);
        $black = imagecolorallocate($mask, 0, 0, 0);
        imagefilledrectangle($mask, 0, 0, $circle_size, $circle_size, $white);
        imagefilledellipse($mask, $circle_size/2, $circle_size/2, $circle_size, $circle_size, $black);
        
        // 调整二维码大小以适应圆形
        $resized_qrcode = imagecreatetruecolor($circle_size, $circle_size);
        imagecopyresampled($resized_qrcode, $qrcode_image, 0, 0, 0, 0, $circle_size, $circle_size, $qrcode_width, $qrcode_height);
        
        // 应用圆形遮罩
        for($x = 0; $x < $circle_size; $x++) {
            for($y = 0; $y < $circle_size; $y++) {
                $mask_color = imagecolorat($mask, $x, $y);
                if($mask_color == 0) { // 如果是黑色（圆形内）
                    $color = imagecolorat($resized_qrcode, $x, $y);
                    imagesetpixel($circle_image, $x, $y, $color);
                }
            }
        }

        // 计算二维码位置（右下角，留出边距）
        $qrcode_x = $bg_width - $circle_size - $margin;
        $qrcode_y = $bg_height - $circle_size - $margin;

        // 合并图片
        imagecopy($bg_image, $circle_image, $qrcode_x, $qrcode_y, 0, 0, $circle_size, $circle_size);

        // 释放临时图片资源
        imagedestroy($circle_image);
        imagedestroy($mask);
        imagedestroy($resized_qrcode);
    }

    /**
     * 画圆角矩形
     */
    private function drawRoundedRect($img, $x, $y, $w, $h, $r, $color) {
        // 中间
        imagefilledrectangle($img, $x+$r, $y, $x+$w-$r-1, $y+$h-1, $color);
        imagefilledrectangle($img, $x, $y+$r, $x+$w-1, $y+$h-$r-1, $color);
        // 四角
        imagefilledellipse($img, $x+$r, $y+$r, $r*2, $r*2, $color);
        imagefilledellipse($img, $x+$w-$r-1, $y+$r, $r*2, $r*2, $color);
        imagefilledellipse($img, $x+$r, $y+$h-$r-1, $r*2, $r*2, $color);
        imagefilledellipse($img, $x+$w-$r-1, $y+$h-$r-1, $r*2, $r*2, $color);
    }

    /**
     * 简单均值模糊（近似毛玻璃）
     */
    private function simpleBlur($img, $level = 1) {
        $w = imagesx($img);
        $h = imagesy($img);
        for ($l = 0; $l < $level; $l++) {
            $tmp = imagecreatetruecolor($w, $h);
            imagealphablending($tmp, false);
            imagesavealpha($tmp, true);
            for ($x = 1; $x < $w-1; $x++) {
                for ($y = 1; $y < $h-1; $y++) {
                    $r = $g = $b = $a = 0;
                    for ($dx = -1; $dx <= 1; $dx++) {
                        for ($dy = -1; $dy <= 1; $dy++) {
                            $c = imagecolorat($img, $x+$dx, $y+$dy);
                            $r += ($c >> 16) & 0xFF;
                            $g += ($c >> 8) & 0xFF;
                            $b += $c & 0xFF;
                            $a += ($c >> 24) & 0x7F;
                        }
                    }
                    $r = (int)($r/9);
                    $g = (int)($g/9);
                    $b = (int)($b/9);
                    $a = (int)($a/9);
                    $col = imagecolorallocatealpha($tmp, $r, $g, $b, $a);
                    imagesetpixel($tmp, $x, $y, $col);
                }
            }
            imagecopy($img, $tmp, 0, 0, 0, 0, $w, $h);
            imagedestroy($tmp);
        }
    }

 
    


}
