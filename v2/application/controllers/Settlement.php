<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Settlement extends MY_Controller {

    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }

    /** 添加一个项, 参数: billid, billNumber, money, 插入记录后, 修改 tier2_bill 的 settled 字段 */
    public function addSettlementItem() {
        $json_paras = (array) json_decode(file_get_contents('php://input'), true);

        if (!isset($json_paras['billid']) || !isset($json_paras['billNumber']) || !isset($json_paras['money'])) {
            $res = [];
            $res['code'] = 200;
            $res['message'] = '缺少必要的参数';
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            return;
        }

        $billid = $json_paras['billid'];
        $billNumber = $json_paras['billNumber'];
        $money = $json_paras['money'];
        $author = $this->getUser();
        $memo =  array_key_exists('memo', $json_paras) ? $json_paras['memo'] : '';
        $settlement_data = [
            'billNumber' => $billNumber,
            'billid' => $billid,
            'money' => $money,
            'memo' => $memo,
            'adddate' => date('Y-m-d H:i:s'),
            'author' => $author
        ];
        $this->db->insert('bill_settlement', $settlement_data);

        // Update the `settled` field in `tier2_bill`
        $this->db->set('settled', 'IFNULL(settled, 0) + ' . (float)$money, FALSE);
        $this->db->where('id', $billid);
        $this->db->update('bill_tier2');


        $billRow = $this->db->get_where('bill_tier2', ['id' => $billid])->row_array();
        //  没有费率转换
        if (empty($billRow['alterRegion'])) {
            //同时修改 unsettled 字段
            $this->db->set('unsettled', ' totalRealCostAmountDue  - IFNULL(settled, 0) ', FALSE);
            $this->db->where('id', $billid);
            $this->db->update('bill_tier2');
        } else {
            $this->db->set('unsettled', ' altTotalRealCostAmountDue  - IFNULL(settled, 0) ', FALSE);
            $this->db->where('id', $billid);
            $this->db->update('bill_tier2');
        }




        // Response
        $res['code'] = 200;
        $res['message'] = '添加销账记录成功';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }

    /** 删除一项, 参数 settleid, 删除记录后, 修改 tier2_bill 的 settled 字段 */
    public function deleteSettlementItem() {
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $settleid = $para['settleid'];

        $this->db->select('billid, money');
        $this->db->where('id', $settleid);
        $settlement = $this->db->get('bill_settlement')->row();

        if (!$settlement) {
            $res = [];
            $res['code'] = 200;
            $res['message'] = '找不到对应的销账记录';
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            return;
        }

        // Delete the settlement record
        $this->db->where('id', $settleid);
        $this->db->delete('bill_settlement');
        $this->db->set('settled', 'GREATEST(IFNULL(settled, 0) - ' . (float)$settlement->money . ', 0)', FALSE);
        $this->db->where('id', $settlement->billid);
        $this->db->update('bill_tier2');
        // Response
        $res['code'] = 200;
        $res['message'] = '删除销账记录成功';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }

    /** 获取销账记录, 参数: billid */
    public function getSettleRecordsByBillid() {
        $json_paras = (array) json_decode(file_get_contents('php://input'), true);
        $billid = $json_paras['billid'];
        $this->db->where('billid', $billid);
        $settlements = $this->db->get('bill_settlement')->result_array();
        $res = [];
        $res['code'] = 200;
        $res['records'] = $settlements;
        $res['message'] = '获取销账记录成功';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }
}
