<?php
defined('BASEPATH') or exit('No direct script access allowed');
class Configuration extends MY_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
        set_time_limit(0);
    }



    public function GetDiscountByItemID() {
        // sleep(4);
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $itemid = intval($para['itemid']);
        $this->db->where('id', $itemid);
        $itemRow = $this->db->get('cfg_link_discount')->row_array();
        $this->_GetFreshDiscountByItemID($itemRow);
    }


    // 判断逻辑:
    /**
     * 
     *  如果 productCode 在  原始表格里面  bill_BillingEntity=='AWS Marketplace'的 product_ProductName 里面
     *  因为当时存储时候, 对 AWS Marketplace,进行了 productCode <==> product_ProductName,
     *  因为许多product_code 是乱码
     * 
     * 
     * 
     */


    private function  checkIfMarketPlace($billmonth, $payerid,  $linkid, $productCode) {


        $this->db->where('billmonth', $billmonth);
        $this->db->where('payerid', $payerid);
        $this->db->where('linkid', $linkid);
        $this->db->where('productCode', $productCode);
        $this->db->select('ifMarketPlace');
        $pivot_row = $this->db->get('s3_global_cur_month_pivot')->row_array();

        if ($pivot_row) {
            return $pivot_row['ifMarketPlace'];
        } else {
            return 'n';
        }
    }




    //  第一次获取的配置
    private function _GetFreshDiscountByItemID($itemRow) {

        $billmonth = $itemRow['billmonth'];
        $linkid = $itemRow['linkid'];
        $payerid =   $itemRow['payerid'];
        $ProductTypePairs = $this->GetAWSLinkidProductTypePair($billmonth, $payerid, $linkid);
        $itemRow['JumpLogs'] = $this->MLinkBillingConfig->getLinkJumpLog($linkid);


        $res = [];
        $res['code'] = 200;
        $res['configitem'] = $itemRow;
        $itemid = $itemRow['id'];
        $rows = $this->db->where('itemid', $itemid)->select('productCode, usageType,ifMarketPlace, discount, cutoption')->get('cfg_link_prod_discount')->result_array();



        $rows = array_map(function ($configitem) {
            $configitem['expandedTypes'] = [];
            return $configitem;
        }, $rows);



        $res['ProductTypePairs'] = $ProductTypePairs;
        $res['discountConfigs'] = $rows;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }






    public function SaveLinkidDiscountConfiguration() {
        // 读取参数
        $para = (array) json_decode(file_get_contents('php://input'), true);

        $itemid = intval($para['itemid']);
        $billmonth = $para['billmonth'];
        $payerid = $para['payerid'];
        $linkid = $para['linkid'];


        $discountItemConfigs = $para['discountItemConfigs'];

        $newArray = [];

        foreach ($discountItemConfigs as $item) {
            if (!empty($item['expandedTypes'])) {
                foreach ($item['expandedTypes'] as $expandedType) {
                    $newArray[] = [
                        'itemid' => $itemid,
                        'billmonth' => $billmonth,
                        'payerid' => $payerid,
                        'linkid' => $linkid,
                        'productCode' => $item['productCode'],
                        'usageType' => $expandedType['usageType'],
                        'ifMarketPlace' => $item['ifMarketPlace'],
                        'discount' => $expandedType['discount'],
                        'cutoption' => $expandedType['cutoption']
                    ];
                }
            } else {
                $newArray[] = [
                    'itemid' => $itemid,
                    'billmonth' => $billmonth,
                    'payerid' => $payerid,
                    'linkid' => $linkid,
                    'productCode' => $item['productCode'],
                    'usageType' => $item['usageType'],
                    'ifMarketPlace' => $item['ifMarketPlace'],
                    'discount' => $item['discount'],
                    'cutoption' => $item['cutoption']
                ];
            }
        }



        $this->db->delete('cfg_link_prod_discount', ['itemid' => $itemid]);

        $cfg_link_prod_discount_rows_total = $this->db->where('billmonth', $billmonth)->get('cfg_link_prod_discount')->num_rows();

        if ($cfg_link_prod_discount_rows_total == 0) {
            $res = [];
            $res['code'] = 500;
            $res['message'] = "误删除";
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            exit();
        }


        $this->db->insert_batch('cfg_link_prod_discount', $newArray);



        if ($this->db->error()['code'] !== 0) {
            $res = [];
            $res['code'] = 500;
            $res['message'] = 'Database error: ' . $this->db->error()['message'];
        } else {
            $res = [];
            $res['code'] = 200;
            $res['message'] = '保存配置成功';
            $res['billmonth'] = $billmonth;
            $res['cfg_link_prod_discount_rows_total'] = $cfg_link_prod_discount_rows_total;
        }
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }




    //  获取   payerid/linkID 涉及到的产品
    public function GetAWSLinkidProductTypePair($billmonth, $payerid, $linkid) {

        $sql = "SELECT DISTINCT productCode, usageType 
        FROM s3_global_cur_month_pivot 
        WHERE billmonth = '{$billmonth}' 
        AND payerid='{$payerid}' 
        AND linkid = '{$linkid}'";

        $result = $this->db->query($sql)->result_array();
        $processed_data = [];

        foreach ($result as $row) {
            $productCode = $row['productCode'];
            $usageType = $row['usageType'];



            $found = false;
            foreach ($processed_data as &$item) {
                if ($item['productCode'] == $productCode) {
                    if (!in_array($usageType, $item['usageTypes'])) {
                        $item['usageTypes'][] = $usageType;
                    }
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                $processed_data[] = [
                    'productCode' => $productCode,
                    'ifMarketPlace' => $this->checkIfMarketPlace($billmonth, $payerid,  $linkid, $productCode),
                    'usageTypes' => [$usageType]
                ];
            }
        }

        return  $processed_data;
    }




    public function GetProdAndTypeDiscounts($billmonth, $payerid, $linkid) {

        $sql = "SELECT DISTINCT productCode, usageType 
        FROM s3_global_cur_month_pivot 
        WHERE billmonth = '{$billmonth}' 
        AND payerid='{$payerid}' 
        AND linkid = '{$linkid}'";

        $result = $this->db->query($sql)->result_array();
        $processed_data = [];

        foreach ($result as $row) {
            $productCode = $row['productCode'];
            $usageType = $row['usageType'];

            $found = false;
            foreach ($processed_data as &$item) {
                if ($item['productCode'] == $productCode) {
                    if (!in_array($usageType, $item['usageTypes'])) {
                        $item['usageTypes'][] = $usageType;
                    }
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                $processed_data[] = [
                    'productCode' => $productCode,
                    'usageTypes' => [$usageType]
                ];
            }
        }

        return  $processed_data;
    }



    public function BatchFixMissingMonthlyDiscount() {

        $para = (array) json_decode(file_get_contents('php://input'), true);
        $linkids = array_column($para['linkids'], 'linkid');
        $unique_linkids = array_unique($linkids);
        $billmonth = $para['billmonth'];

        $missing_month_discount = [];
        foreach ($unique_linkids as  $item) {
            # code...
            $tmp = [];
            $tmp['discount'] = 0;
            $tmp['linkid'] = $item;
            $tmp['billmonth'] = $billmonth;
            $tmp['memo'] = '从Audit补齐';
            $missing_month_discount[] = $tmp;
        }




        $this->db->trans_start(); // 开始事务
        try {
            $this->db->insert_batch('cfg_monthly_discount', $missing_month_discount);
            if ($this->db->trans_status() === FALSE) {
                throw new Exception("数据插入失败");
            }

            $this->db->trans_commit(); // 提交事务
            $res = [
                'code' => 200,
                'message' => '数据插入成功'
            ];
        } catch (Exception $e) {
            $this->db->trans_rollback(); // 回滚事务
            $res = [
                'code' => 500,
                'message' => $e->getMessage()
            ];
        }
        $this->db->trans_complete(); // 结束事务

        // 修正 tierid
        $sql = " UPDATE cfg_monthly_discount te
                JOIN tier2_cust_linkid tc ON te.linkid = tc.linkid
                SET te.tierid = tc.tierid where billmonth='{$billmonth}' and te.tierid is null; ";
        $this->db->query($sql);

        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }




    public function SaveForcedCredit() {
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $billmonth = $para['billmonth'];

        $payerid = $para['payerid'];
        $linkid = $para['linkid'];
        $productCode = $para['productCode'];
        $usageType = $para['usageType'];
        $ForcedCredit = $para['ForcedCredit'];
        $tierid = $this->MCloudLevel->getTierIDByLinkId($linkid);


        $this->db->where('billmonth', $billmonth);
        $this->db->where('tierid', $tierid);
        $this->db->where('payerid', $payerid);
        $this->db->where('linkid', $linkid);
        $this->db->where('productCode', $productCode);
        $this->db->where('usageType', $usageType);

        $this->db->delete('forced_credit');
        $row = [
            'billmonth' => $billmonth,
            'tierid' => $tierid,
            'payerid' => $payerid,
            'linkid' => $linkid,
            'productCode' => $productCode,
            'usageType' => $usageType,
            'ForcedCredit' => $ForcedCredit,
            'adddate' => date('Y-m-d H:i:s', time())

        ];


        $this->db->insert('forced_credit', $row);
        if ($this->db->error()['code'] !== 0) {
            $res = [];
            $res['code'] = 500;
            $res['message'] = 'Database error: ' . $this->db->error()['message'];
        } else {
            $res = [];
            $res['code'] = 200;
            $res['message'] = '保存Credit成功';
        }
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }
}
