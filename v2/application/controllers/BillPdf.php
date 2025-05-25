<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

defined('BASEPATH') or exit('No direct script access allowed');
class BillPdf extends CI_Controller {
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


    public function GetTier2PaperInfo() {
        $json_paras = (array) json_decode(file_get_contents('php://input'), true);
        $paperid = $json_paras['paperid'];
        $row = $this->db->get_where('bill_tier2', ['id' => $paperid])->row_array();
        $res = [];
        $res['code'] = 200;
        $res['paperinfo'] = $row;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }

    public function GetPdfDatas() {
        $json_paras = (array) json_decode(file_get_contents('php://input'), true);
        $tierid = $json_paras['tierid'];
        $billmonth = $json_paras['billmonth'];
        $this->db->where('tierid', $tierid);
        $this->db->where('billmonth', $billmonth);
        $bills = $this->db->get('bill_tier2')->result_array();
        $res = [
            'code' => 200,
            'bills' => $bills
        ];
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }

    private function getBillRowJson($billid) {
        $this->db->where('id', $billid);
        $billData = $this->db->get('bill_tier2')->row_array();
        $billData['companyInfo'] = json_decode($billData['companyInfo'], true);
        $billData['customerInfo'] = json_decode($billData['customerInfo'], true);
        $billData['billInfo'] = json_decode($billData['billInfo'], true);
        $billData['billSummary'] = json_decode($billData['billSummary'], true);
        $billData['billSummary']['adjustMoney'] = $billData['adjustMoney'];
        $billData['bankInfo'] = json_decode($billData['bankInfo'], true);
        $billData['linkSummary'] = json_decode($billData['linkSummary'], true);
        // 整条记录.
        $billData['row'] = $billData;
        return $billData;
    }


    public function RenderPdf() {

        $renderType = $_GET['renderType'];
        $billid = $_GET['billid'];
        $billData = $this->getBillRowJson($billid);
        // debug($billData);
        // die;

        if ($billData['paperRegion'] == 'china') {
            $this->MBillPdfChina->cnPdfWithContent(5, 5, 5, $billData, $renderType, $billData['alterRegion']);
        }

        if ($billData['paperRegion'] == 'global') {
            $this->MBillPdfGlobal->globalPdfWithContent(5, 5, 5,  $billData, $renderType, $billData['alterRegion']);
        }
    }




    public function zipTier2LinkCsv() {


        $json_paras = (array) json_decode(file_get_contents('php://input'), true);
        $tierid = $json_paras['tierid'];
        $billmonth = $json_paras['billmonth'];


        $tiername = $this->MCloudLevel->getTierNameByTierid($tierid);

        // 重新生成pivot mask
        clog('重新生成pivot mask.' . $billmonth . '-->' . $tierid);
        $this->MBilling->PreParePivotMask($billmonth, $tierid);



        $this->db->distinct();
        $this->db->select('linkid');
        $linkids = $this->db->get_where('tier2_cust_linkid', ['tierid' => $tierid])->result_array();


        $total = count($linkids);

        // delete all files in /tmp which name end with .xlsx 
        $files = glob('/tmp/*.xlsx');
        foreach ($files as $file) {
            unlink($file);
        }

        foreach ($linkids as $key => $item) {
            clog('生成excel进度:' .  ($key + 1) . "/" . $total . '-->' . $item['linkid']);
            // $this->RenderCSVLinkHandler('F', $item['linkid'], $billmonth);
            $filename = $this->MBilling->RenderCSVLinkHandler($billmonth, $tierid, $item['linkid']);
        }

        $zipname = "/var/www/html/download/" . $billmonth . '-' . $tiername . '.zip';

        // delete zip file if exists
        if (file_exists($zipname)) {
            unlink($zipname);
        }


        $zip = new ZipArchive();




        $zip->open($zipname, ZipArchive::CREATE);
        // compress all files in /tmp which name starts with  $data['billmonth'] . '-' . $data['tiername'] 
        $normal_files = glob('/tmp/' . $billmonth . '-' . $tiername . '-*.xlsx');
        foreach ($normal_files as $file) {
            $zip->addFile($file);
        }


        $unequeal_files = glob('/tmp/U' . $billmonth . '-' . $tiername . '-*.xlsx');
        foreach ($unequeal_files as $file) {
            $zip->addFile($file);
        }



        $zip->close();
        $filename = $billmonth . '-' . $tiername . '.zip';
        $excel_url = 'http://' . $_SERVER['HTTP_HOST'] . '/download/';
        $ret = array("code" => 200, "data" => ["url" => $excel_url . $filename, "name" => $filename]);
        echo json_encode($ret);
    }







    public function TestRenderPdfLink() {

        $renderType = 'I';
        $linkid  =  '120550458801';
        $billmonth = '2024-11';
        $this->RenderCSVLinkHandler($renderType, $linkid, $billmonth);
    }




    // 给前端的 html  viewer
    public function GetOnePdfData() {
        $json_paras = (array) json_decode(file_get_contents('php://input'), true);
        $paperid = $json_paras['paperid'];
        $billData = $this->getBillRowJson($paperid);
        $res = [];
        $res['code'] = 200;
        $res['billData'] = $billData;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }

    public function updatAdjustment() {
        $json_paras = (array) json_decode(file_get_contents('php://input'), true);
        $paperid = $json_paras['paperid'];


        $adjust = floatval($json_paras['adjust']);
        $sql = "update bill_tier2 set adjustMoney= $adjust where id=$paperid";
        $this->db->query($sql);

        // 参考java 代码里面的  totalRealCostAmountDue 的计算公式 TAG:FIX_FORCED_CREDIT
        $absAdjust = abs($adjust);
        if ($adjust > 0) {
            $sql = "update bill_tier2 set totalRealCostAmountDue= totalCost  - totalDiscount -abs(totalCredit) + $absAdjust where id=$paperid";
            $this->db->query($sql);
            $sql = "update bill_tier2 set unsettled             = totalCost  - totalDiscount -abs(totalCredit) + $absAdjust where id=$paperid";
            $this->db->query($sql);
        } else {
            $sql = "update bill_tier2 set totalRealCostAmountDue= totalCost  - totalDiscount -abs(totalCredit) - $absAdjust where id=$paperid";
            $this->db->query($sql);
            $sql = "update bill_tier2 set unsettled             = totalCost  - totalDiscount -abs(totalCredit) - $absAdjust where id=$paperid";
            $this->db->query($sql);
        }
        // debug($sql);
        // $this->db->query($sql);
        $updatedBillData = $this->getBillRowJson($paperid);
        $billSummary = $updatedBillData['billSummary'];
        $billSummary['adjustMoney'] = $adjust;
        $billSummary['totalRealCostAmountDue'] = $updatedBillData['totalRealCostAmountDue'];
        // 回写 billSummary字段
        $this->db->where('id', $paperid);
        $this->db->update('bill_tier2', ['billSummary' => json_encode($billSummary)]);


        $res = [];
        $res['code'] = 200;
        $res['message'] = '调账成功';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }


    // bill整体转换币种  
    public function BillCurrencyConvertAll() {
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $this->db->where('id', $para['id']);
        $bill = $this->db->get('bill_tier2')->row_array();
        $usdrate = $this->getUsdRate($bill['billmonth']);
        if ($usdrate == '' || $usdrate == 'not_set') {
            $res = [];
            $res['code'] = 500;
            $res['message'] = $bill['billmonth'] . '汇率未设置';
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->db->where('id', $para['tierid']);
        $tier = $this->db->get('tier2')->row_array();

        // 美金转人民币
        if ($para['paperRegion'] == 'global') {

            $alterRegion = 'china';
            $usd_to_rmb_handrate = $tier['usd_to_rmb_handrate'];
            // 换汇手续费
            $handfee = $bill['totalRealCostAmountDue'] * $usdrate * $usd_to_rmb_handrate;
            $valaddtax = ($bill['totalRealCostAmountDue'] * $usdrate + $handfee) * 0.06;
            $altTotalRealCostAmountDue = $bill['totalRealCostAmountDue'] * $usdrate + $handfee + $valaddtax;

            $update = [
                'handfee' => $handfee,
                'usdrate' => $usdrate,
                'valaddtax' => $valaddtax,
                'unsettled' => $altTotalRealCostAmountDue,
                'altTotalRealCostAmountDue' => $altTotalRealCostAmountDue,
                'alterRegion' => $alterRegion
            ];
            $this->db->where('id', $para['id']);
            $this->db->update('bill_tier2', $update);
            $res = [];
            $res['code'] = 200;
            $res['para'] = $para;
            $res['message'] = '转人民币成功';
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        }


        // 人民币转美金
        if ($para['paperRegion'] == 'china') {

            $alterRegion = 'global';
            $altTotalRealCostAmountDue = $bill['totalRealCostAmountDue'] / $usdrate;

            $update = [
                'usdrate' => $usdrate,
                'unsettled' =>                 $altTotalRealCostAmountDue,
                'altTotalRealCostAmountDue' => $altTotalRealCostAmountDue,
                'alterRegion' => $alterRegion
            ];

            $this->db->where('id', $para['id']);
            $this->db->update('bill_tier2', $update);
            $res = [];
            $res['code'] = 200;
            $res['para'] = $para;
            $res['message'] = '转美金成功';
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        }
    }

    public function getUsdRate($billmonth) {

        $this->db->where('billmonth', $billmonth);
        $row = $this->db->get('usd_rate')->row_array();
        if ($row) {
            return $row['rate'];
        } else {
            return "not_set";
        }
    }


    public function confirmBill() {
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $billid = $para['billid'];
        $sql = "update bill_tier2 set confirmdate=now() where id=$billid";
        $this->db->query($sql);
        $res = [];
        $res['code'] = 200;
        $res['message'] = '确认账单成功';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }






    function emailBill() {

        $para = (array) json_decode(file_get_contents('php://input'), true);
        $billid = $para['billid'];
        $billData = $this->getBillRowJson($billid);

        $mailMeta = $this->getBillMailMeta($billData);
        $subject = $mailMeta['subject'];
        $body   = $mailMeta['body'];
        $pdfname = "/tmp/" . $billData['billInfo']['billNumber'] . ".pdf";
        $to_user = $this->getEmailByBillid($billid);
        $retmsg = $this->sendEmailHandler($to_user, $subject, $body, "so@sinnet-cloud.cn", $pdfname, $billData['billmonth']);
        if ($retmsg == 'Success') {
            $res = [];
            $res['code'] = 200;
            $res['message'] = 'Email发送成功';
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        } else {
            $res = [];
            $res['code'] = 500;
            $res['message'] = 'Email发送失败,' . $retmsg;
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        }
    }


    function emailInvoice() {
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $requestid = $para['requestid'];
        $this->db->where('id', $requestid);
        $row = $this->db->get('invoice_request')->row_array();
        $pdfname = '/var/www/html/' . $row['invoice_url'];
        $billid = $row['billid'];

        $this->db->where('id', $billid);
        $billRow = $this->db->get('bill_tier2')->row_array();

        $subject = '电子发票,账单编号:' . $row['billnumber'];
        $body = '请收到邮件后按照电子发票信息付款';
        $to_user = $this->getEmailByBillid($row['billid']);
        $retmsg = $this->sendEmailHandler($to_user, $subject, $body, "ling.liu@sinnet-cloud.cn", $pdfname, $billRow['billmonth']);
        if ($retmsg == 'Success') {
            $res = [];
            $res['code'] = 200;
            $res['message'] = '电子发票发送成功';

            $this->db->where('id', $requestid);
            $data = ['senddate' => date('Y-m-d H:i:s')];
            $this->db->update('invoice_request', $data);



            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        } else {
            $res = [];
            $res['code'] = 500;
            $res['message'] = '电子发票发送失败,' . $retmsg;
            $this->db->where('id', $requestid);
            $data = ['senddate' => date('Y-m-d H:i:s')];
            $this->db->update('invoice_request', $data);
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        }
    }



    private function getBillMailMeta($billData) {

        $custName = $billData['customerInfo']['name'];
        $billmonth = $billData['billmonth'];
        // 2024-11 转换为 2024年11月    
        $billmonth = date('Y年m月', strtotime($billmonth));

        // $billNumber = $billData['billInfo']['billNumber'];
        // $moneyString = '';
        // AWS全线产品使用费账单2024年11月.pdf

        if ($billData['paperRegion'] == 'china') {
            $this->MBillPdfChina->cnPdfWithContent(5, 5, 5, $billData,  'F', $billData['alterRegion']);
            if ($billData['alterRegion'] == 'global') {
                $subject = '香港光环云数据有限公司-AWS全线产品使用费账单' . $billmonth . "---" . $custName;
            } else {
                $subject = '光环云数据有限公司-AWS全线产品使用费账单' . $billmonth . "---" . $custName;
            }
        }

        if ($billData['paperRegion'] == 'global') {
            $this->MBillPdfGlobal->globalPdfWithContent(5, 5, 5,  $billData, 'F', $billData['alterRegion']);

            if ($billData['alterRegion'] == 'china') {
                $subject = '光环云数据有限公司-AWS全线产品使用费账单' . $billmonth . "---" . $custName;
            } else {
                $subject = '香港光环云数据有限公司-AWS全线产品使用费账单' . $billmonth . "---" . $custName;
            }
        }

        return [
            'subject' => $subject,
            'body' => $this->getBillMailMetaForStatement($custName)
        ];
    }


    public function getBillMailMetaForStatement($custName) {
        $html = <<<HTML
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>光环云通知</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px;">
            <div style="width: 700px;">
                <div style="text-align: center;">
                    <img src="https://www.sinnet-cloud.cn/wp-content/themes/ghy/images/black-logo.png" 
                         style="max-width: 100%;" />
                </div>
                <h1 style="font-size: 24px; margin-bottom: 20px;">{$custName},您好:</h1>
        
                <p style="margin-bottom: 15px;">感谢您选择光环云为您提供服务。附件为您所购买的产品/服务的账单，请您按照指定的账户进行汇款，如已付款请忽略，谢谢。</p>
        
                <p style="margin-bottom: 15px;">如遇到任何问题，请您联系我们。感谢您对光环云赋能平台的信赖与支持！</p>
        
                <div style="margin-top: 30px;">
                    <p style="margin-bottom: 5px;">光环云客服中心:</p>
                    <p style="margin-bottom: 5px;">
                        <span style="font-size: 20px; color: #ff7300;">400-688-8535</span>
                        <span style="font-size: 20px; color: #ff7300; margin-left:20px">support@sinnet-cloud.cn</span>
                    </p>
                </div>
        
                <p style="margin-bottom: 15px;">光环云数据有限公司</p>
            </div>
        </body>
        </html>
        HTML;
        return $html;
    }




    private function getEmailByBillid($billid) {
        $this->db->where('id', $billid);
        $row = $this->db->get('bill_tier2')->row_array();
        $email = $row['email'];
        // Remove leading/trailing whitespace and replace spaces
        $email = trim($email);
        $email = str_replace(' ', '', $email);

        // Split the email string by commas and return as an array
        $emailArray = explode(',', $email);
        return $emailArray;
    }


    function sendEmailHandler($toUser, $subject, $body, $ccUser, $attachmentPath, $billmonth) {
        // 邮件服务器配置
        $config = [
            'host' => 'smtp.mxhichina.com',
            'port' => 25,
            'username' => 'support@sinnet-cloud.cn',
            // 'password' => 'QAZwsx123!!!',
            'password' => 'jW3kv4re7J6hNLAB',
            'timeout' => 25000,
            'from' => 'support@sinnet-cloud.cn'
        ];

        $mail = new PHPMailer(true);

        try {
            $mail->Charset = 'UTF-8';
            $mail->isSMTP();
            $mail->Host       = 'ssl://smtp.mxhichina.com';                     //企业邮箱服务器
            $mail->Port       = 465;                                    //端口
            $mail->SMTPAuth   = true;                                   //授权
            $mail->Username   = $config['username'];
            $mail->Password   = $config['password'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;         //启用加密
            //Recipients
            $mail->setFrom($config['from']);
            $mail->addReplyTo($config['from']); //回信地址
            $mail->addCC($ccUser); //抄送人



            // 收件人
            if (is_array($toUser)) {
                // If $toUser is an array, add each email address
                foreach ($toUser as $email) {
                    $mail->addAddress($email);
                }
            } else {
                // If $toUser is a single email address
                $mail->addAddress($toUser);
            }


            // 抄送
            if ($ccUser) {
                $mail->addCC($ccUser);
            }

            // 附件
            $billmonth = date('Y年m月', strtotime($billmonth));
            $custDisplayName = 'AWS全线产品使用费账单' . $billmonth . '.pdf';
            if ($attachmentPath) {
                $mail->addAttachment($attachmentPath, $custDisplayName);
            }

            // 内容
            $mail->isHTML(true);                       // Set email format to HTML
            $mail->Subject = $subject;
            $mail->Body    = $body;

            $mail->send();
            return 'Success';
        } catch (Exception $e) {
            return "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
        }
    }




    public function  invoicePdfData() {

        $path = $_GET['path'];
        $filepath = '/var/www/html/' . $path;
        header('Content-Type: application/pdf');
        header(sprintf("Content-disposition: inline;filename=%s", basename($filepath)));
        readfile($filepath);
        exit;
    }
}
