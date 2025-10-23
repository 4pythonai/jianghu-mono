<?php
// 方法1: 使用GD库生成图像
function generateGlassmorphismCard($width = 400, $height = 322) {
    // 创建画布
    $image = imagecreatetruecolor($width, $height);

    // 启用透明度
    imagealphablending($image, false);
    imagesavealpha($image, true);

    // 创建背景渐变
    for ($y = 0; $y < $height; $y++) {
        for ($x = 0; $x < $width; $x++) {
            $gradient = sin($x * 0.01) * cos($y * 0.01) * 50 + 100;
            $color = imagecolorallocatealpha(
                $image,
                50 + $gradient,
                80 + $gradient,
                150 + $gradient,
                30
            );
            imagesetpixel($image, $x, $y, $color);
        }
    }

    // 创建圆角矩形
    $radius = 12;
    $cardColor = imagecolorallocatealpha($image, 17, 25, 40, 95); // 75%透明度
    $borderColor = imagecolorallocatealpha($image, 255, 255, 255, 110); // 半透明白边

    // 绘制圆角矩形背景
    drawRoundedRectangle($image, 0, 0, $width - 1, $height - 1, $radius, $cardColor);

    // 绘制边框
    drawRoundedRectangleBorder($image, 0, 0, $width - 1, $height - 1, $radius, $borderColor);

    // 输出图像
    header('Content-Type: image/png');
    imagepng($image);
    imagedestroy($image);
}

// 绘制圆角矩形
function drawRoundedRectangle($image, $x1, $y1, $x2, $y2, $radius, $color) {
    // 主体矩形
    imagefilledrectangle($image, $x1 + $radius, $y1, $x2 - $radius, $y2, $color);
    imagefilledrectangle($image, $x1, $y1 + $radius, $x2, $y2 - $radius, $color);

    // 四个圆角
    imagefilledellipse($image, $x1 + $radius, $y1 + $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($image, $x2 - $radius, $y1 + $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($image, $x1 + $radius, $y2 - $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($image, $x2 - $radius, $y2 - $radius, $radius * 2, $radius * 2, $color);
}

// 绘制圆角矩形边框
function drawRoundedRectangleBorder($image, $x1, $y1, $x2, $y2, $radius, $color) {
    // 直线边框
    imageline($image, $x1 + $radius, $y1, $x2 - $radius, $y1, $color);
    imageline($image, $x1 + $radius, $y2, $x2 - $radius, $y2, $color);
    imageline($image, $x1, $y1 + $radius, $x1, $y2 - $radius, $color);
    imageline($image, $x2, $y1 + $radius, $x2, $y2 - $radius, $color);

    // 圆角边框
    imagearc($image, $x1 + $radius, $y1 + $radius, $radius * 2, $radius * 2, 180, 270, $color);
    imagearc($image, $x2 - $radius, $y1 + $radius, $radius * 2, $radius * 2, 270, 360, $color);
    imagearc($image, $x1 + $radius, $y2 - $radius, $radius * 2, $radius * 2, 90, 180, $color);
    imagearc($image, $x2 - $radius, $y2 - $radius, $radius * 2, $radius * 2, 0, 90, $color);
}
