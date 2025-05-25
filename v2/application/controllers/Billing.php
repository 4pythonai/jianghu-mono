<?php
defined('BASEPATH') or exit('No direct script access allowed');
class Billing extends MY_Controller {

    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }



    public function GetTier2PaperInfo() {
        $json_paras = (array) json_decode(file_get_contents('php://input'), true);
        $paperid = $json_paras['paperid'];
        $row = $this->db->get_where('bill_tier2', ['id' => $paperid])->row_array();
        $res = [];
        $res['code'] = 200;
        $res['paperinfo'] = $row;

        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }


    /*
       从 cfg_link_discount 读取配置
    */

    private function  billOneLink($billmonth, $tierid, $payerid, $linkid) {


        $this->load->database();
        $this->db->reconnect();
        $this->db->where('billmonth', $billmonth);
        $this->db->where('tierid', $tierid);
        $this->db->where('payerid', $payerid);
        $this->db->where('linkid', $linkid);
        $this->db->select('id as itemid,billmonth, payerid,linkid');
        $linkitem = $this->db->get('cfg_link_discount')->row_array();
        if ($linkitem) {
        } else {
            clog("[警告:未找到折扣配置 billmonth:$billmonth/ tierid:$tierid /Payer: {$payerid} /Link: {$linkid}  ", 'red');
            clog("CUR报告中应该无此Link数据 ", 'red');
        }
    }




    // 获取 S3 下有用的压缩文件名
    private function getS3ObjectKeys($onepayer, $billmonth) {

        $cfg = [
            'ak' => $onepayer['ak'],
            'sk' => $onepayer['sk'],
            'region' => $onepayer['region'],
            'month' => $billmonth,
            'payerid' => $onepayer['payerid'],
            'curtype' => 'months'
        ];
        $s3Result =  $this->CURPipe->ListObjects($cfg);
        $s3objects = $s3Result['s3_objects'];
        $filtered_items = array_filter($s3objects, function ($item) {
            return substr($item['objectkey'], -5) !== '.json';
        });
        return $filtered_items;
    }

    public function  GetLinkidSummary() {
        $para = (array)json_decode(file_get_contents('php://input'), true);
        $billmonth = $para['billmonth'];
        $linkid = $para['linkid'];
        $payerid = $para['payerid'];
        $tierid = $para['tierid'];
        $res = $this->GetLinkidSummaryHandler($billmonth, $tierid, $payerid, $linkid);
        $res['code'] = 200;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }

    public function setInvoceUploadStatus() {
        $para = (array)json_decode(file_get_contents('php://input'), true);
        $id = $para['requestid'];
        $url = $para['url'];
        $uploadTime = date('Y-m-d H:i:s');
        $this->db->where('id', $id);
        $this->db->update('invoice_request', ['invoice_url' => $url, 'upload_time' => $uploadTime]);
        $res = [];
        $res['code'] = 200;
        $res['message'] =  '发票上传成功';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }


    // 添加marketPlace 账单相关

    public function  addMarketPlaceBill() {
        $para = (array)json_decode(file_get_contents('php://input'), true);
        $billmonth = $para['billmonth'];
        $region = $para['region'];
        $totalCost = $para['totalCost'];
        $totalDiscount = $para['totalDiscount'];
        $totalCostAmountDue = $para['totalCostAmountDue'];
        $linkid = $para['linkid'];
        $tierid = $this->MCloudLevel->getTierIDByLinkId($linkid);

        $this->db->where('id', $tierid);
        $this->db->select('author');
        $tier2 = $this->db->get('tier2')->row_array();
        $author = $tier2['author'];

        $bankInfo = $this->getBankInfo($region);
        $companyInfo = $this->getCompanyInfo($region);
        $customerInfo = $this->getCustomerInfo($tierid, $region);
        $billNumber = $this->getBillNumber($tierid, $billmonth);
        $billPayDay = $this->getBillPayDay($billmonth);
        $billCreateDate = date('Y-m-d');
        $billinfo = $this->getBillInfo($billNumber, $billPayDay, $billCreateDate);
        $linkSummary = '[]';
        $billSummary = $this->getBillSummary($billmonth, $totalCost, $totalDiscount, $totalCostAmountDue);

        $data = [
            'billmonth' => $billmonth,
            'paperRegion' => $region,
            'tierid' => $tierid,
            'billinfo' => json_encode($billinfo),
            'bankinfo' => json_encode($bankInfo),
            'companyinfo' => json_encode($companyInfo),
            'billNumber' => $billNumber,
            'customerinfo' => json_encode($customerInfo),
            'totalCost' => $totalCost,
            'totalDiscount' => $totalDiscount,
            'totalCostAmountDue' => $totalCostAmountDue,
            'totalRealCostAmountDue' => $totalCostAmountDue,
            'linkSummary' => $linkSummary,
            'billSummary' => json_encode($billSummary),
            'author' => $author,
            'settled' => 0,
            'unsettled' => $totalCostAmountDue
        ];


        $this->db->insert('bill_tier2', $data);

        $res = [];
        $res['code'] = 200;
        $res['message'] =  '添加账单成功';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }


    private function getBillSummary($billMonth, $totalCost, $totalDiscount,   $totalCostAmountDue) {
        $billSummary = [];
        $billSummary['totalCost'] = $totalCost;
        $billSummary['adjustMoney'] = 0;
        $billSummary['totalDiscount'] = $totalDiscount;
        $start_end = $this->getBillMonthStartEndTimeStamp($billMonth);
        $billSummary['billingPeriodEnd'] = $start_end['end'];
        $billSummary['billingPeriodStart'] = $start_end['start'];
        $billSummary['totalCostAmountDue'] = $totalCostAmountDue;
        $billSummary['totalRealCostAmountDue'] = $totalCostAmountDue;
        return $billSummary;
    }

    private function getBankInfo($region) {
        $this->load->database();
        $this->db->reconnect();
        $this->db->where('region', $region);
        $this->db->select('region,bank_name,bank_address,bank_swift_code,account_number,recipient_name,contact_Email,company_Name,legal_Disclaimer');
        $row = $this->db->get('bill_config')->row_array();
        $bankInfo = [];
        $bankInfo['bankName'] = $row['bank_name'];
        $bankInfo['swiftCode'] = $row['bank_swift_code'];
        $bankInfo['bankAddress'] = $row['bank_address'];
        $bankInfo['accountNumber'] = $row['account_number'];
        $bankInfo['beneficiaryName'] = $row['recipient_name'];
        return $bankInfo;
    }




    private function getCompanyInfo($region) {
        $this->db->where('region', $region);
        $cloudInfo = $this->db->get('bill_config')->row_array();
        $companyInfo = [];
        $companyInfo['companyName'] = $cloudInfo['company_Name'];
        $companyInfo['contactEmail'] = $cloudInfo['contact_Email'];
        $companyInfo['legalDisclaimer'] = $cloudInfo['legal_Disclaimer'];
        return $companyInfo;
    }


    private function getCustomerInfo($tierid, $region) {
        $this->db->where('id', $tierid);
        $row = $this->db->get('tier2')->row_array();
        $customerInfo = [];
        if ($region == 'china') {
            $customerInfo['name'] = $row['name'];
            $customerInfo['address'] = $row['address'];
        } else {
            $customerInfo['name'] = $row['name_global'];
            $customerInfo['address'] = $row['address_global'];
        }
        return $customerInfo;
    }


    private function getBillInfo($billNumber, $billPayDay, $billCreateDate) {

        $billinfo = [];
        $billinfo['billNumber'] = $billNumber;
        $billinfo['billPayDay'] = $billPayDay;
        $billinfo['billCreateDate'] = $billCreateDate;
        return $billinfo;
    }


    private function getBillPayDay(string $billMonth): string {
        $date = DateTime::createFromFormat('Y-m-d', $billMonth . '-01');
        $date->modify('+1 month');
        $date->setDate($date->format('Y'), $date->format('m'), 25);
        return $date->format('Y-m-d');
    }




    private function getBillNumber(int $tierId, string $billMonth): string {
        // Parse the date and add one month
        $date = DateTime::createFromFormat('Y-m-d', $billMonth . '-01');
        $date->modify('+1 month');
        $date->setDate($date->format('Y'), $date->format('m'), 5);

        $billingExecuteDay = $date->format('Ymd');
        $formattedTierId = sprintf('%04d', $tierId);
        $randomString = implode('', array_map(function () {
            return strval(random_int(0, 9));
        }, range(1, 5)));
        return "AWS" . $billingExecuteDay . $formattedTierId . $randomString;
    }



    private function getBillMonthStartEndTimeStamp($billMonth) {
        $date = DateTime::createFromFormat('Y-m-d', $billMonth . '-01');
        $result = [
            'start' => $date->format('Y-m-d'),
            'end' => $date->modify('+1 month')->modify('-1 day')->format('Y-m-d')
        ];
        return $result;
    }

    public function  GetLinkidSummaryHandler($billmonth, $tierid, $payerid, $linkid) {

        $sql = "SELECT 
            productCode,
            productCode AS `key`,
            ROUND(SUM(r_Credit), 4) AS r_Credit,
            ROUND(SUM(r_DiscountedUsage), 4) AS r_DiscountedUsage,
            ROUND(SUM(r_DistributorDiscount), 4) AS r_DistributorDiscount,
            ROUND(SUM(r_Fee), 4) AS r_Fee,
            ROUND(SUM(r_Others), 4) AS r_Others,
            ROUND(SUM(r_PrivateRateDiscount), 2) AS r_PrivateRateDiscount,
            ROUND(SUM(r_Refund), 4) AS r_Refund,
            ROUND(SUM(r_RIFee), 4) AS r_RIFee,
            ROUND(SUM(r_SavingsPlanCoveredUsage), 4) AS r_SavingsPlanCoveredUsage,
            ROUND(SUM(r_SavingsPlanNegation), 4) AS r_SavingsPlanNegation,
            ROUND(SUM(r_SavingsPlanRecurringFee), 4) AS r_SavingsPlanRecurringFee,
            ROUND(SUM(r_Tax), 4) AS r_Tax,
            ROUND(SUM(r_Usage), 4) AS r_Usage,
            ROUND(SUM(totalCost), 4) AS totalCost,
            ROUND(SUM(discount), 4) AS discount,
            ROUND(SUM(shouldpay), 4) AS shouldpay
            
            
        FROM 
            s3_global_cur_month_pivot  
        WHERE billmonth='{$billmonth}' 
        AND  linkid='{$linkid}'
        AND payerid='{$payerid}'
        AND tierid='{$tierid}'
        GROUP BY productCode
        order by productCode ";



        $linkidsummary = $this->db->query($sql)->result_array();
        foreach ($linkidsummary as $key => $oneitem) {

            $productCode = $oneitem['productCode'];

            $sql = "SELECT 
            usageType,
            usageType AS `key`,
            ROUND(SUM(r_Credit), 4) AS r_Credit,
            ROUND(SUM(r_DiscountedUsage), 4) AS r_DiscountedUsage,
            ROUND(SUM(r_DistributorDiscount), 4) AS r_DistributorDiscount,
            ROUND(SUM(r_Fee), 4) AS r_Fee,
            ROUND(SUM(r_Others), 4) AS r_Others,
            ROUND(SUM(r_PrivateRateDiscount), 2) AS r_PrivateRateDiscount,
            ROUND(SUM(r_Refund), 4) AS r_Refund,
            ROUND(SUM(r_RIFee), 4) AS r_RIFee,
            ROUND(SUM(r_SavingsPlanCoveredUsage), 4) AS r_SavingsPlanCoveredUsage,
            ROUND(SUM(r_SavingsPlanNegation), 4) AS r_SavingsPlanNegation,
            ROUND(SUM(r_SavingsPlanRecurringFee), 4) AS r_SavingsPlanRecurringFee,
            ROUND(SUM(r_Tax), 4) AS r_Tax,
            ROUND(SUM(r_Usage), 4) AS r_Usage,
            ROUND(SUM(totalCost), 4) AS totalCost,
            ROUND(SUM(discount), 4) AS discount,
            ROUND(SUM(shouldpay), 4) AS shouldpay
            FROM s3_global_cur_month_pivot  
            WHERE billmonth='{$billmonth}' 
            AND linkid='{$linkid}'
            AND productCode=" . $this->db->escape($productCode) . "
            AND payerid='{$payerid}'
            AND tierid='{$tierid}'
            GROUP BY usageType";
            // echo $sql;

            $linkidsummary[$key]['typelogs'] = $this->db->query($sql)->result_array();
        }


        $total_r_Credit = 0.0;
        foreach ($linkidsummary as $row) {
            $total_r_Credit += (float) $row['r_Credit'];
        }

        $res = [];
        $res['linkidsummary'] = $linkidsummary;
        $res['haveCredit'] = $total_r_Credit ==  0 ? false : true;
        return $res;
    }

    public function getInvoiceRequestSummary() {
        $para = (array)json_decode(file_get_contents('php://input'), true);
        $billid = $para['billid'];
        $this->db->where('billid', $billid);
        $this->db->select(' * ');
        $records = $this->db->get('invoice_request')->result_array();
        $res = [];
        $res['code'] = 200;
        $res['records'] = $records;
        $res['totalRequestMoney'] = $this->getTotalRequestMoney($billid);
        $res['message'] = '获取开票申请历史成功';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }


    private function getTotalRequestMoney($billid) {
        $this->db->where('billid', $billid);
        $this->db->select('COALESCE(SUM(requestMoney), 0) as total');
        $total = $this->db->get('invoice_request')->row_array();
        return $total['total'];
    }

    private function getCurrencyName($region) {

        if ($region === 'global') {
            $realCurrency = '美元';
        } elseif ($region === 'china') {
            $realCurrency = '人民币';
        } else {
            // 如果遇到其他区域值，可选择保留原值或者添加其他逻辑
            $realCurrency = $region;
        }
        return $realCurrency;
    }


    private function checkOverPayment($billid,  $money) {

        $totalRequestMoney = $this->getTotalRequestMoney($billid);
        $billRow = $this->db->get_where('bill_tier2', ['id' => $billid])->row_array();
        //  没有费率转换
        if (empty($billRow['alterRegion'])) {
            $currencyChanged =  false;
            $realCurrency = $this->getCurrencyName($billRow['paperRegion']);
        } else {
            $currencyChanged =  true;
            $realCurrency = $this->getCurrencyName($billRow['alterRegion']);
        }

        if (!$currencyChanged) {
            if (round(floatval($billRow['totalRealCostAmountDue']) - floatval($totalRequestMoney), 2) < round(floatval($money), 2)) {
                $res = [];
                $res['code'] = 500;
                $res['message'] = '开票金额合计超过账单金额, 币种: ' . $realCurrency;
                echo json_encode($res, JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        if ($currencyChanged) {
            if (round(floatval($billRow['altTotalRealCostAmountDue']) - floatval($totalRequestMoney), 2) < round(floatval($money), 2)) {
                $res = [];
                $res['code'] = 500;
                $res['message'] = '开票金额合计超过账单金额, 币种: ' . $realCurrency;
                echo json_encode($res, JSON_UNESCAPED_UNICODE);
                exit();
            }
        }
    }


    private function getRealTotalFee($billid) {

        $billRow = $this->db->get_where('bill_tier2', ['id' => $billid])->row_array();
        //  没有费率转换
        if (empty($billRow['alterRegion'])) {
            return $billRow['totalRealCostAmountDue'];
        } else {
            return $billRow['altTotalRealCostAmountDue'];
        }
    }



    // 注意币种转换,有可能美元账单转为了人民币
    public function addInvoiceRequest() {

        $para = (array) json_decode(file_get_contents('php://input'), true);
        $billid = $para['billid'];
        if (array_key_exists('memo', $para)) {
            $memo = $para['memo'];
        } else {
            $memo = '开票';
        }


        $money = floatval($para['money']);
        $this->checkOverPayment($billid, $money);

        $this->db->where('id', $billid);
        $author = $this->getUser();
        $bill = $this->db->get('bill_tier2')->row_array();

        $data = [];
        $data['billid'] = $billid;
        $data['tierid'] = $bill['tierid'];
        $data['billNumber'] = $bill['billNumber'];
        $data['adddate'] = date('Y-m-d H:i:s');
        $data['author'] = $author;
        $data['paperRegion'] = $bill['paperRegion'];
        $data['alterRegion'] = $bill['alterRegion'];
        $data['totalRealCostAmountDue'] = $this->getRealTotalFee($billid);
        $data['memo'] = $memo;
        $data['requestMoney'] = $money;
        $data['invoiceMeta'] = $this->MCloudLevel->getInvoiceMetaByTierid($bill['tierid']);

        $this->db->insert('invoice_request', $data);
        $dberror = $this->db->error();
        if ($dberror['code'] == 0) {
            $res = [];
            $res['code'] = 200;
            $res['message'] = '开票请求创建成功';
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        } else {
            $res = [];
            $res['code'] = 500;
            $res['message'] = '开票请求创建失败';
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        }
    }

    public function setEntityName() {
        $res = [];

        $sql = "UPDATE bill_tier2 b 
                JOIN tier2 t ON b.tierid = t.id 
                SET b.entityName = t.name_global 
                WHERE b.entityName IS NULL 
                AND b.paperRegion = 'global'";

        $this->db->query($sql);

        $sql = "UPDATE bill_tier2 b 
                JOIN tier2 t ON b.tierid = t.id 
                SET b.entityName = t.name 
                WHERE b.entityName IS NULL 
                AND b.paperRegion = 'china'";

        $this->db->query($sql);

        $sql = "UPDATE bill_tier2 b 
                JOIN tier2 t ON b.tierid = t.id 
                SET b.prov = t.prov ";

        $this->db->query($sql);

        $res['code'] = 200;
        $res['message'] = '设置实体名称成功';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }
}
