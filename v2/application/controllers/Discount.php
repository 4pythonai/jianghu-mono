<?php

declare(strict_types=1);


if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class Discount extends MY_Controller {
    public function __construct() {

        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
    }


    public function oneLinkDiscountDebug() {

        $para = (array) json_decode(file_get_contents('php://input'), true);
        $this->load->model('MDiscountCalculator');

        $mdisCount = new MDiscountCalculator(
            $para['billmonth'],
            $para['id'],
            $para['tierid'],
            $para['payerid'],
            $para['linkid']
        );

        $mdisCount->init();
        $res = $mdisCount->calculateTotalDiscount();
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }


    public  function getLinkRelatedChances() {
        $para = (array)json_decode(file_get_contents('php://input'), true);
        $linkid = $para['linkid'];

        $sql = "SELECT * FROM saleschance WHERE aws_linkids LIKE '%$linkid%'";
        $rows = $this->db->query($sql)->result_array();
        $res = [];
        $res['code'] = 200;
        $res['message'] = 'success';
        $res['chances'] = $rows;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }




    public function saveLinkChance() {
        $para = (array)json_decode(file_get_contents('php://input'), true);
        $rowid = $para['rowid'];
        $selectedChance = $para['selectedChance'];


        // 更新数据库
        $this->db->where('id', $rowid);
        $result = $this->db->update('tier2_cust_linkid', ['chanceid' => $selectedChance]);

        if ($result) {
            $response = [
                'code' => 200,
                'message' => '保存机会ID成功'
            ];
        } else {
            $response = [
                'code' => 500,
                'message' => '保存机会ID失败'
            ];
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    }

    // TODO: cfg_monthly_discount_tpl 与表格 结构 cfg_monthly_discount 完全一致.
    public function discountMonthCal() {
        $para = (array)json_decode(file_get_contents('php://input'), true);
        $billmonth = $para['billmonth'];
        // 清除 cfg_monthly_discount billmonth 数据

        $sql = "delete from cfg_monthly_discount where billmonth = ?";
        $this->db->query($sql, [$billmonth]);



        // firt truncate table  cfg_monthly_discount_tpl
        // $this->db->query("TRUNCATE TABLE cfg_monthly_discount_tpl");

        // 生成 cfg_monthly_discount billmonth 数据

        $this->load->model('MDiscountBatcher');
        $this->MDiscountBatcher->batchDiscount($billmonth);
        $res = [];
        $res['code'] = 200;
        $res['message'] = '批量计算月: ' . $billmonth . ' 成功';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }


    public function  transferDraft() {
        $para = (array)json_decode(file_get_contents('php://input'), true);
        $billmonth = $para['billmonth'];
        $this->load->model('MDiscountBatcher');
        $dberr = $this->MDiscountBatcher->transferDraft($billmonth);

        if ($dberr['code'] != 0) {
            $res = [];
            $res['code'] = 500;
            $res['message'] = '转入失败';
            $res['dberr'] = $dberr;
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            return;
        } else {
            $res = [];
            $res['code'] = 200;
            $res['message'] = '转入成功';
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        }
    }



    public function  transferLinkDraft() {
        $para = (array)json_decode(file_get_contents('php://input'), true);
        $billmonth = $para['billmonth'];
        $linkid = $para['linkid'];
        $this->load->model('MDiscountBatcher');
        $dberr = $this->MDiscountBatcher->transferLinkDraft($billmonth, $linkid);

        if ($dberr['code'] != 0) {
            $res = [];
            $res['code'] = 500;
            $res['message'] = '转入失败';
            $res['dberr'] = $dberr;
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            return;
        } else {
            $res = [];
            $res['code'] = 200;
            $res['message'] = '转入成功';
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        }
    }
}
