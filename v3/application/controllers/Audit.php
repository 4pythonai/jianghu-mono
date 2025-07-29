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
        $this->load->model('gamble/MDonation');
    }

    public function printResult($result) {
        $this->load->view('gamble/VGambleResut', $result);
    }


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
            'gambleSysName' => $row['gambleSysName'],
            'userRuleId' => $row['userRuleId'],
            'gameid' => $row['gameid'],
            'gambleid' => $gambleid,
            'groupid' => $row['groupid'],
            'userid' => $row['creator_id']
        ];


        $web_url = config_item('web_url');
        $detail_url = "{$web_url}/v3/index.php/Audit/index?gambleid={$gambleid}";

        // 生成二维码图片
        $qrcode_url = generate_qrcode($detail_url, "gamble_result_{$gambleid}.png");

        $final_result = $this->GamblePipe->GetGambleResult($cfg);
        if ($debugMode) {
            $simple = $final_result;
            // unset($simple['holes']);
            debug($simple);
        }

        $final_result['qrcode_url'] = $qrcode_url;
        $this->printResult($final_result);
    }
}
