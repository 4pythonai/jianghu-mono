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
            $resized_player,
            $player_image,
            0,
            0,
            0,
            0,
            $target_width,
            $target_height,
            $player_width,
            $player_height
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
     * 添加二维码到背景图片右下角
     * @param resource $bg_image 背景图片资源
     * @param resource $qrcode_image 二维码图片资源
     * @param float $size 二维码相对背景宽度的比例
     * @param int $margin 二维码与背景图片边缘的距离
     * @return void
     */

    private function addMiniQrCode($bg_image, $qrcode_image, $size = 0.6, $margin = 20) {
        // 获取背景图片尺寸
        $bg_width = imagesx($bg_image);
        $bg_height = imagesy($bg_image);

        // 计算二维码的尺寸
        $qr_size = (int)($bg_width * $size);

        // 创建缩放后的二维码资源
        $resized_qr = imagecreatetruecolor($qr_size, $qr_size);
        imagealphablending($resized_qr, false);
        imagesavealpha($resized_qr, true);
        imagecopyresampled($resized_qr, $qrcode_image, 0, 0, 0, 0, $qr_size, $qr_size, imagesx($qrcode_image), imagesy($qrcode_image));

        // 创建圆形遮罩
        $circle = imagecreatetruecolor($qr_size, $qr_size);
        imagealphablending($circle, false);
        imagesavealpha($circle, true);
        $transparent = imagecolorallocatealpha($circle, 0, 0, 0, 127);
        imagefilledrectangle($circle, 0, 0, $qr_size, $qr_size, $transparent);
        $white = imagecolorallocatealpha($circle, 255, 255, 255, 0);
        imagefilledellipse($circle, $qr_size / 2, $qr_size / 2, $qr_size, $qr_size, $white);

        // 应用圆形遮罩
        $final_qr = imagecreatetruecolor($qr_size, $qr_size);
        imagealphablending($final_qr, false);
        imagesavealpha($final_qr, true);
        imagefilledrectangle($final_qr, 0, 0, $qr_size, $qr_size, $transparent);
        for ($x = 0; $x < $qr_size; $x++) {
            for ($y = 0; $y < $qr_size; $y++) {
                $alpha = (imagecolorat($circle, $x, $y) & 0x7F000000) >> 24;
                if ($alpha == 0) { // 圆内
                    $color = imagecolorat($resized_qr, $x, $y);
                    imagesetpixel($final_qr, $x, $y, $color);
                }
            }
        }
        imagedestroy($resized_qr);
        imagedestroy($circle);

        // 计算二维码在背景图片右下角的位置
        $qr_x = $bg_width - $qr_size - $margin;
        $qr_y = $bg_height - $qr_size - $margin;

        // 合并二维码到背景图片
        imagecopy($bg_image, $final_qr, $qr_x, $qr_y, 0, 0, $qr_size, $qr_size);
        imagedestroy($final_qr);
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

        // 添加二维码到背景图片右下角，二维码大小为背景宽度的0.6
        $this->addMiniQrCode($bg_image, $qrcode_image, 0.15, 20);

        // 保存图片到 golf-poster/tmp/test.png
        $img_path = FCPATH . '../golf-poster/tmp/test.png';
        imagepng($bg_image, $img_path);
        imagedestroy($bg_image);
        imagedestroy($qrcode_image);
        imagedestroy($player_image);

        echo json_encode([
            'code' => 200,
            'msg' => 'success',
            'data' => $img_path
        ], JSON_UNESCAPED_UNICODE);
    }
}
