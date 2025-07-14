<?php

declare(strict_types=1);
set_time_limit(0);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}




class Audit extends CI_Controller {
    public function __construct() {

        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
        $this->load->model('GamblePipe');
        $this->load->model('GamblePipeRunner');
        $this->load->model('gamble/MGambleDataFactory');
        $this->load->model('gamble/MRuntimeConfig');
        $this->load->model('gamble/MStroking');
        $this->load->model('gamble/MIndicator');
        $this->load->model('gamble/MRedBlue');
        $this->load->model('gamble/MMoney');
        $this->load->model('gamble/MRanking');
        $this->load->model('gamble/GambleContext');
        $this->load->model('gamble/MRanking');
        $this->load->model('gamble/GambleContext');
        $this->load->model('gamble/MMeat');
    }

    public function printResult($result) {
        $this->load->view('gamble/VGambleResut', $result);
    }

    /**
     * 生成二维码图片
     * @param string $text 要编码的文本
     * @param string $filename 输出文件名（可选）
     * @return string 二维码图片URL
     */
    public function generateQRCode($text, $filename = null) {
        // 加载二维码库
        require_once APPPATH . 'libraries/phpqrcode/qrlib.php';

        // 设置二维码参数
        $errorCorrectionLevel = 'L'; // 容错级别 L/M/Q/H
        $matrixPointSize = 6;        // 二维码大小
        $margin = 2;                 // 边距

        // 生成文件名
        if (!$filename) {
            $filename = 'qr_' . date('YmdHis') . '_' . uniqid() . '.png';
        }

        // 确保文件名以.png结尾
        if (!preg_match('/\.png$/i', $filename)) {
            $filename .= '.png';
        }

        // 设置保存路径 FCPATH 上一级目录
        $upload_path = FCPATH . '../upload/qrcodes/';

        if (!is_dir($upload_path)) {
            mkdir($upload_path, 0755, true);
        }

        $file_path = $upload_path . $filename;

        // 生成二维码
        QRcode::png($text, $file_path, $errorCorrectionLevel, $matrixPointSize, $margin);

        // 返回访问URL
        $web_url = config_item('web_url');
        $qrcode_url = $web_url . '/upload/qrcodes/' . $filename;
        return $qrcode_url;
    }

    /**
     * 优化后的赌球结果页面（生成二维码图片）
     */
    public function index() {
        $userAgent = $_SERVER['HTTP_USER_AGENT'];
        if (strpos($userAgent, 'miniProgram') !== false) {
            $debugMode = false; // 小程序
        } else {
            $debugMode = true; // 浏览器
        }

        $paras = $_GET;
        $gambleid = $paras['gambleid'];
        $row = $this->db->get_where('t_gamble_runtime', ['id' => $gambleid])->row_array();
        $cfg = [
            'gambleSysName' => '8421',
            'userRuleId' => $row['userRuleId'],
            'gameid' => $row['gameid'],
            'runtimeid' => $gambleid,
            'groupid' => $row['groupid'],
            'userid' => $row['creator_id']
        ];

        // 生成查看详情的URL
        $detail_url = "https://qiaoyincapital.com/v3/index.php/Audit/index?gambleid={$gambleid}";

        // 生成二维码图片
        $qrcode_url = $this->generateQRCode($detail_url, "gamble_result_{$gambleid}.png");

        $final_result = $this->GamblePipe->GetGambleResult($cfg);
        if ($debugMode) {
            debug($final_result);
        }

        $final_result['qrcode_url'] = $qrcode_url;
        $this->printResult($final_result);
    }
}
