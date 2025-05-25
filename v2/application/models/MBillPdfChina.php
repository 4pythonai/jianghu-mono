<?php
require_once APPPATH . 'third_party/TCPDF/tcpdf.php';

use Aws\S3\S3Client;
use Aws\Sts\StsClient;

ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class MBillPdfChina extends CI_Model {


    function cnPdfWithContent($marginTopAndBottom, $marginLeftAndRight, $gridSize, $data, $renderType, $alterRegion) {
        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        $START_POINT = 30;

        $pdf->setPrintHeader(false);
        $pdf->SetMargins($marginLeftAndRight, $marginTopAndBottom, $marginLeftAndRight);
        $pdf->AddPage();
        $pdf->SetAutoPageBreak(false, 0);

        $this->addHeader($pdf, $data, $marginLeftAndRight, $START_POINT, $alterRegion);
        $this->addBody($pdf, $data, $marginLeftAndRight, $alterRegion, $START_POINT - 10);
        $this->addFooter($pdf, $data, $marginLeftAndRight, $alterRegion, $START_POINT - 10);


        $pdf->AddPage();
        $pdf->SetAutoPageBreak(true, 0);

        $pdf->SetXY($marginLeftAndRight, 0); // 设置文本开始的位置
        $pdf->SetFillColor(134, 205, 249);
        $gap = 0;
        $START_POINT = 5;
        $pdf->Rect($marginLeftAndRight, $START_POINT + $gap, 200, 10, 'DF'); // 'DF' 表示画边框并填充
        $pdf->SetXY($marginLeftAndRight, $START_POINT + $gap); // 设置文本开始的位置
        $pdf->SetFont('microsoftyaheib', '', 10);
        $pdf->Cell(100, 10, "已链接账户总览", 0, 0, 'L', false);

        $pdf->SetFont('msyh', '', 8);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 10 + $gap); // 设置文本开始的位置
        $this->addLinkList($pdf, $data, $marginLeftAndRight);

        $pdf->AddPage();
        $this->addDdetail($pdf, $data, $marginLeftAndRight);
        $pdfname = "/tmp/" . $data['billInfo']['billNumber'] . ".pdf";
        $pdf->Output($pdfname, $renderType); // 'I' for inline display, 'D' for download, 'F' for saving to file
    }



    function addHeader(&$pdf, $data, $marginLeftAndRight, $START_POINT, $alterRegion) {

        $pdf->SetFont('msyh', '', 10);
        $pdf->SetTextColor(0, 0, 0);
        if ($alterRegion == 'global') {
            $pdf->Image('/var/www/html/v2/application/controllers/logo-global.png', 5, 5, 35.28, 13.93, 'PNG');
        } else {
            $pdf->Image('/var/www/html/v2/application/controllers/logo-cn.png', 5, 5, 35.28, 13.93, 'PNG');
        }

        $pdf->SetXY(110, 8);
        $pdf->Cell(0, 0, '光环云平台付款通知', 0, 0, 'L');

        $pdf->SetXY(110, 14);
        $pdf->Cell(0, 0, '如果您遇到任何关于账户账单问题，请通过邮件联系我们。', 0, 0, 'L');


        $pdf->SetXY(110, 20);
        $pdf->Cell(0, 0, '客服邮箱:' . $data['companyInfo']['contactEmail'], 0, 0, 'L');

        $pdf->SetXY($marginLeftAndRight, $START_POINT);
        $pdf->SetFont('microsoftyaheib', '', 13);

        $pdf->Cell(0, 10, "客户名称: ", 0, 'L');
        $pdf->SetFont('msyh', '', 10);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 6);
        $pdf->Cell(0, 10,  $data['customerInfo']['name'], 0, 'L');




        // 防止地址太长，换行
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 20);
        $pdf->SetFont('microsoftyaheib', 'B', 13);
        $pdf->Cell(0, 10, "公司地址: ", 0, 'L');
        $pdf->SetFont('msyh', '', 10);
        // Save the current X and Y positions
        $addressX = $marginLeftAndRight;
        $addressY = $START_POINT + 30; // Adjust this to leave enough space below "公司地址"
        // Set the X and Y position for the address
        $pdf->SetXY($addressX, $addressY);
        $width = 200; // Adjust this width to fit your desired layout
        $pdf->MultiCell($width, 5, $data['customerInfo']['address'], 0, 'L');



        $pdf->SetXY(110, $START_POINT);
        $pdf->SetFont('microsoftyaheib', 'B', 13);
        $pdf->Cell(0, 10, "付款账单总览", 0, 'L');
        $pdf->SetLineStyle(array('width' => 0.1, 'cap' => 'butt', 'join' => 'miter', 'dash' => '0', 'color' => array(0, 0, 0)));
        $pdf->Line(110, $START_POINT + 9, 205, $START_POINT + 9);


        $pdf->SetFont('msyh', '', 10);
        $pdf->SetXY(110, $START_POINT + 8);
        $pdf->Cell(0, 10, "账单号:", 0, 'L');
        $pdf->SetXY(0, $START_POINT + 8);
        $pdf->Cell(0, 10,  $data['billInfo']['billNumber'], 0, 0, 'R');
        $pdf->SetFont('msyh', '', 8);
        $pdf->SetXY(110, $START_POINT + 13);
        $pdf->Cell(0, 10, "进行电子资金转账付款时，请务必引用上述账单号", 0, 'L');

        $pdf->SetLineStyle(array('width' => 0.2, 'cap' => 'butt', 'join' => 'miter', 'dash' => '0', 'color' => array(0, 0, 0)));
        $pdf->Line(110, $START_POINT + 21, 205, $START_POINT + 21);


        $pdf->SetFont('msyh', '', 10);
        $pdf->SetXY(110, $START_POINT + 20);
        $pdf->Cell(0, 10, "账单通知日期:", 0, 'L');
        $pdf->SetXY(0, $START_POINT + 20);
        $pdf->Cell(0, 10,  $data['billInfo']['billCreateDate'], 0, 0, 'R');
        $pdf->SetLineStyle(array('width' => 0.2, 'cap' => 'butt', 'join' => 'miter', 'dash' => '0', 'color' => array(0, 0, 0)));
        $pdf->Line(110, $START_POINT + 28, 205, $START_POINT + 28);
        $pdf->SetFont('microsoftyaheib', '', 10);
        $pdf->SetXY(110, $START_POINT + 28);
        $pdf->Cell(0, 10, "账单总金额:", 0, 'L');
        $pdf->SetXY(0, $START_POINT + 28);

        // 人民币账单转了美元
        if ($alterRegion == 'global') {
            $pdf->Cell(0, 10,  "$" . $data['row']['altTotalRealCostAmountDue'], 0, 0, 'R');
        } else {
            $pdf->Cell(0, 10,  '￥' . $data['billSummary']['totalRealCostAmountDue'], 0, 0, 'R');
        }
    }


    function addBody(&$pdf, $data, $marginLeftAndRight, $alterRegion, $START_POINT) {

        $pdf->SetFont('msyh', 'B', 13);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 50);
        $pdf->Cell(0, 10, "本付款通知所属的账单日期为:" . $data['billSummary']['billingPeriodStart'] . " 到 " . $data['billSummary']['billingPeriodEnd'], 0, 'L');

        $pdf->SetXY($marginLeftAndRight, $START_POINT + 58);
        $pdf->Cell(0, 10, "付款到期日:" . $data['billInfo']['billPayDay'], 0, 'L');
        $pdf->SetFillColor(134, 205, 249);
        $pdf->Rect($marginLeftAndRight, $START_POINT + 70, 200, 10, 'DF'); // 'DF' 表示画边框并填充

        $pdf->SetXY($marginLeftAndRight, $START_POINT + 70); // 设置文本开始的位置
        $pdf->Cell(100, 10, "账单号:" . $data['billInfo']['billNumber'], 0, 0, 'L', false);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 80); // 调整 Y 坐标根据需要的位置

        // 定义列宽
        $columnWidth = 100;

        // 定义行高
        $rowHeight = 8;

        // 生成表格头部
        $pdf->Cell($columnWidth, $rowHeight, "服务费用", 1, 0, 'L'); // 列1
        $pdf->Cell($columnWidth, $rowHeight,  '￥' . $data['billSummary']['totalRealCostAmountDue'], 1, 1, 'R'); // 列2

        // 生成表格内容
        $pdf->SetFont('msyh', '', 11);
        $pdf->Cell($columnWidth, $rowHeight, "    资源使用费(含税6%)", 1, 0, 'L'); // 列1
        $pdf->Cell($columnWidth, $rowHeight,  '￥' . $data['billSummary']['totalCost'], 1, 1, 'R'); // 列2


        $pdf->Cell($columnWidth, $rowHeight, "    Credit", 1, 0, 'L'); // 列1 (空)
        $pdf->Cell($columnWidth, $rowHeight, '￥' . $data['totalCredit'], 1, 1, 'R'); // 列2 (空)

        $pdf->Cell($columnWidth, $rowHeight, "    折扣", 1, 0, 'L'); // 列1 (空)
        if ($data['billSummary']['totalDiscount'] == 0) {
            $pdf->Cell($columnWidth, $rowHeight, '￥' . $data['billSummary']['totalDiscount'], 1, 1, 'R'); // 列2 (空)
        } else {
            $pdf->Cell($columnWidth, $rowHeight, '￥-' . $data['billSummary']['totalDiscount'], 1, 1, 'R'); // 列2 (空)
        }



        $pdf->Cell($columnWidth, $rowHeight, "    调整费用(含税6%)", 1, 0, 'L'); // 列1 (空)
        $pdf->Cell($columnWidth, $rowHeight, '￥' . $data['billSummary']['adjustMoney'], 1, 1, 'R'); // 列2 (空)

        if ($alterRegion == 'global') {
            $pdf->Cell($columnWidth, $rowHeight, "    汇率", 1, 0, 'L'); // 列1 (空)
            $pdf->Cell($columnWidth, $rowHeight, $data['row']['usdrate'], 1, 1, 'R'); // 列2 (空)
        }

        $pdf->SetFont('msyh', '', 13);
        $pdf->SetFillColor(237, 231, 170);
        $pdf->Cell($columnWidth, $rowHeight, "本付款通知总计", 1, 0, 'L', True); // 列1 (空)

        if ($alterRegion == 'global') {
            $pdf->Cell($columnWidth, $rowHeight, '$' . $data['row']['altTotalRealCostAmountDue'], 1, 1, 'R', True); // 列2 (空)
        } else {
            $pdf->Cell($columnWidth, $rowHeight, '￥' . $data['billSummary']['totalRealCostAmountDue'], 1, 1, 'R', True); // 列2 (空)
        }
    }

    function addFooter(&$pdf, $data, $marginLeftAndRight, $alterRegion, $START_POINT) {

        if ($alterRegion == 'global') {
            $this->addHongKongFooter($pdf, $data, $marginLeftAndRight, $alterRegion, $START_POINT);
        } else {
            $this->addChinaFooter($pdf, $data, $marginLeftAndRight, $alterRegion, $START_POINT);
        }
    }


    function addHongKongFooter(&$pdf, $data, $marginLeftAndRight, $alterRegion, $START_POINT) {

        $pdf->SetXY($marginLeftAndRight, $START_POINT + 138); // 设置文本开始的位置
        $pdf->Cell(0, 10, "请将以上账单所列金额付款至香港光环云数据有限公司以下指定账户", 0, 0, 'L', false); // 'C' 表示居中对齐

        $pdf->SetFont('msyh', '', 10);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 145); // 设置文本开始的位置
        $pdf->Cell(0, 10, "    为了能将您的付款信息和账单进行匹配，请务必将“账单号”填至汇款备注中。如果您对付款通知的付款有任何疑问或遇到", 0, 0, 'L', false);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 152); // 设置文本开始的位置
        $pdf->Cell(0, 10, "任何问题，请邮件联系我们的客户服务团队。", 0, 0, 'L', false);


        $pdf->SetFont('microsoftyaheib', '', 13);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 164);
        $pdf->Cell(0, 10, "资金转账信息", 0, 0, 'L', false);

        $this->db->where('region', 'global');
        $bank = $this->db->get('bill_config')->row_array();
        $bankdata = ['bankInfo' => $bank];
        $this->addHongKongBank($pdf, $bankdata, $marginLeftAndRight, $START_POINT);

        $pdf->SetFont('msyh', '', 10);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 218); // 设置文本开始的位置
        $pdf->Cell(0, 10, "上述收费包括您账户发生的费用，以及通过整合账单中所有由您负责付款的账户发生的费用,感谢您选择香港光环云数据有限公司。", 0, 0, 'L', false);


        $pdf->SetFont('microsoftyaheib', 'B', 14);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 228); // 设置文本开始的位置
        $pdf->Cell(0, 10, "此致", 0, 0, 'L', false);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 234); // 设置文本开始的位置
        $pdf->Cell(0, 10, "香港光环云数据有限公司", 0, 0, 'L', false);

        $text = $data['companyInfo']['legalDisclaimer'];
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 244); // 设置文本开始的位置

        $pdf->SetFont('msyh', '', 10);
        $pdf->MultiCell(180, 10,  $text, 0, 'L');
    }




    function addChinaBank(&$pdf, $data, $marginLeftAndRight, $START_POINT) {

        $pdf->SetFont('msyh', '', 10);
        $payGapHeight = 175;
        $payItemGap = 6;


        $pdf->SetXY($marginLeftAndRight, $START_POINT + $payGapHeight);
        $pdf->Cell(0, 10, "公司名称:", 0, 'L');
        $pdf->SetXY($marginLeftAndRight + 88, $START_POINT + $payGapHeight);
        $pdf->Cell(0, 10, $data['bankInfo']['beneficiaryName'], 0, 'L');

        $pdf->SetXY($marginLeftAndRight, $START_POINT + $payGapHeight + $payItemGap);
        $pdf->Cell(0, 10, "税号:       ", 0, 'L');
        $pdf->SetXY($marginLeftAndRight + 88, $START_POINT + $payGapHeight + $payItemGap);
        $pdf->Cell(0, 10, $data['bankInfo']['swiftCode'], 0, 'L');

        $pdf->SetXY($marginLeftAndRight, $START_POINT + $payGapHeight + 2 * $payItemGap);
        $pdf->Cell(0, 10, "开户银行:       ", 0, 'L');
        $pdf->SetXY($marginLeftAndRight + 88, $START_POINT +  $payGapHeight + 2 * $payItemGap);
        $pdf->Cell(0, 10, $data['bankInfo']['bankName'], 0, 'L');


        $pdf->SetXY($marginLeftAndRight, $START_POINT + $payGapHeight + 3 * $payItemGap);
        $pdf->Cell(0, 10, "银行账户:", 0, 'L');

        $pdf->SetXY($marginLeftAndRight + 88, $START_POINT + $payGapHeight + 3 * $payItemGap);
        $pdf->Cell(0, 10, $data['bankInfo']['accountNumber'], 0, 'L');

        $pdf->SetXY($marginLeftAndRight, $START_POINT + $payGapHeight + 4 * $payItemGap);
        $pdf->Cell(0, 10, "单位地址:", 0, 'L');

        $pdf->SetXY($marginLeftAndRight + 88, $START_POINT + $payGapHeight + 4 * $payItemGap);
        $pdf->Cell(0, 10, $data['bankInfo']['bankAddress'], 0, 'L');
    }

    public function addHongKongBank(&$pdf, $data, $marginLeftAndRight, $START_POINT) {

        $pdf->SetFont('msyh', '', 10);
        $payGapHeight = 176;
        $payItemGap = 6;


        $pdf->SetXY($marginLeftAndRight, $START_POINT + $payGapHeight);
        $pdf->Cell(0, 10, "收款人名称(Beneficiary's Name):", 0, 'L');
        $pdf->SetXY($marginLeftAndRight + 88, $START_POINT + $payGapHeight);
        $pdf->Cell(0, 10, $data['bankInfo']['recipient_name'], 0, 'L');

        $pdf->SetXY($marginLeftAndRight, $START_POINT + $payGapHeight + $payItemGap);
        $pdf->Cell(0, 10, "收款人开户行名称(Beneficiary's Bank Name):       ", 0, 'L');
        $pdf->SetXY($marginLeftAndRight + 88, $START_POINT + $payGapHeight + $payItemGap);
        $pdf->Cell(0, 10, $data['bankInfo']['bank_name'], 0, 'L');

        $pdf->SetXY($marginLeftAndRight, $START_POINT + $payGapHeight + 2 * $payItemGap);
        $pdf->Cell(0, 10, "收款人账号(Beneficiary's Account Numbe):       ", 0, 'L');
        $pdf->SetXY($marginLeftAndRight + 88, $START_POINT +  $payGapHeight + 2 * $payItemGap);
        $pdf->Cell(0, 10, $data['bankInfo']['account_number'], 0, 'L');


        $pdf->SetXY($marginLeftAndRight, $START_POINT + $payGapHeight + 3 * $payItemGap);
        $pdf->Cell(0, 10, "收款人开户行SWIFT号码(Beneficiary's SWIFT):", 0, 'L');

        $pdf->SetXY($marginLeftAndRight + 88, $START_POINT + $payGapHeight + 3 * $payItemGap);
        $pdf->Cell(0, 10, $data['bankInfo']['bank_swift_code'], 0, 'L');



        $labelWidth = 100; // 收款人开户行地址(Beneficiary's Bank Address) 的宽度
        $valueWidth = 110; // $data['bankInfo']['bankAddress'] 的宽度

        // 设置两个元素的相同Y坐标
        $yPosition = $START_POINT + 205;
        $yPosition = $START_POINT + 2 + $payGapHeight + 4 * $payItemGap;


        // 第一个 MultiCell 用于标签文本
        $pdf->SetXY($marginLeftAndRight, $yPosition);
        $pdf->MultiCell($labelWidth, 10, "收款人开户行地址(Beneficiary's Bank Address):", 0, 'L');

        // // 第二个 MultiCell 用于银行地址
        $pdf->SetXY($marginLeftAndRight + 88, $yPosition);
        $pdf->MultiCell($valueWidth, 10, $data['bankInfo']['bank_address'], 0, 'L');
    }




    function addChinaFooter(&$pdf, $data, $marginLeftAndRight, $alterRegion, $START_POINT) {

        $pdf->SetXY($marginLeftAndRight, $START_POINT + 135); // 设置文本开始的位置
        $pdf->Cell(0, 10, "请将以上账单所列金额付款至光环云数据有限公司以下指定账户。", 0, 0, 'L', false); // 'C' 表示居中对齐

        $pdf->SetFont('msyh', '', 10);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 145); // 设置文本开始的位置
        $pdf->Cell(0, 10, "    为了能将您的付款信息和账单进行匹配，请务必将“账单号”填至汇款备注中。如果您对付款通知的付款有任何疑问或遇到", 0, 0, 'L', false);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 152); // 设置文本开始的位置
        $pdf->Cell(0, 10, "任何问题，请邮件联系我们的客户服务团队。", 0, 0, 'L', false);


        $pdf->SetFont('microsoftyaheib', '', 13);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 164);
        $pdf->Cell(0, 10, "资金转账信息", 0, 0, 'L', false);
        $this->addChinaBank($pdf, $data, $marginLeftAndRight, $START_POINT);

        $pdf->SetFont('msyh', '', 10);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 218); // 设置文本开始的位置
        $pdf->Cell(0, 10, "上述收费包括您账户发生的费用，以及通过整合账单中所有由您负责付款的账户发生的费用,感谢您选择光环云数据有限公司。", 0, 0, 'L', false);


        $pdf->SetFont('microsoftyaheib', 'B', 14);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 228); // 设置文本开始的位置
        $pdf->Cell(0, 10, "此致", 0, 0, 'L', false);
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 234); // 设置文本开始的位置
        $pdf->Cell(0, 10, "光环云数据有限公司", 0, 0, 'L', false);

        $text = $data['companyInfo']['legalDisclaimer'];
        $pdf->SetXY($marginLeftAndRight, $START_POINT + 244); // 设置文本开始的位置

        $pdf->SetFont('msyh', '', 10);
        $pdf->MultiCell(180, 10,  $text, 0, 'L');
    }




    public function addLinkList(&$pdf, $data, $marginLeftAndRight) {

        foreach ($data['linkSummary'] as $linkItem) {

            // 获取数据
            $linkid_linkname = $linkItem['linkid_linkname'];
            $totalCost = $linkItem['totalCost'];
            $totalDiscount = $linkItem['totalDiscount'];
            $totalCostAmountDue = $linkItem['totalCostAmountDue'];
            $totalCredit = $linkItem['totalCredit'];

            // 第一行: linkid_linkname 和 totalCostAmountDue

            $pdf->SetTextColor(237, 113, 0);
            $pdf->SetFont('microsoftyaheib', 'B', 9);


            $pdf->SetX($marginLeftAndRight); // 设置起始位置
            $pdf->Cell(140, 8, $linkid_linkname, 1, 0, 'L'); // 左列, 边框设置为 1
            $pdf->Cell(60, 8, "￥" . $totalCostAmountDue, 1, 1, 'R'); // 右列

            $pdf->SetTextColor(0, 0, 0);


            // 第二行: 资源使用费 和 totalCost
            $pdf->SetX($marginLeftAndRight); // 设置起始位置
            $pdf->Cell(140, 8, "    资源使用费(含税6%)", 1, 0, 'L'); // 左列
            $pdf->Cell(60, 8, "￥" . $totalCost, 1, 1, 'R'); // 右列


            // 第3行: 资源使用费 和 totalCost
            $pdf->SetX($marginLeftAndRight); // 设置起始位置
            $pdf->Cell(140, 8, "    Credit", 1, 0, 'L'); // 左列
            $pdf->Cell(60, 8, "￥" . $totalCredit, 1, 1, 'R'); // 右列




            // 第4行: 折扣 和 totalDiscount
            $pdf->SetX($marginLeftAndRight); // 设置起始位置
            $pdf->Cell(140, 8, "    折扣", 1, 0, 'L'); // 左列
            // $pdf->Cell(60, 8, "￥" . $totalDiscount, 1, 1, 'R'); // 右列
            if ($totalDiscount == 0) {
                $pdf->Cell(60, 8, "￥" . $totalDiscount, 1, 1, 'R'); // 右列
            } else {
                $pdf->Cell(60, 8, "￥-" . $totalDiscount, 1, 1, 'R'); // 右列
            }
        }
    }

    public function addDdetail(&$pdf, $data, $marginLeftAndRight) {
        $pdf->Ln(10);

        $pdf->SetLineStyle(array('width' => 0.1, 'cap' => 'butt', 'join' => 'miter', 'dash' => '0', 'color' => array(0, 0, 255)));
        $currentY = $pdf->GetY();
        $pdf->Rect($marginLeftAndRight, $currentY, 200, 10, 'DF'); // 'DF' 表示画边框并填充
        $pdf->SetFont('microsoftyaheib', '', 10);

        $pdf->Cell(100, 10, "已链接账户产品明细", 0, 0, 'L', false);

        $pdf->SetXY($marginLeftAndRight, $currentY + 10); // 设置文本开始的位置

        $pdf->SetFont('msyh', '', 8);
        $pdf->SetLineStyle(array('width' => 0.1, 'cap' => 'butt', 'join' => 'miter', 'dash' => '0', 'color' => array(0, 0, 0)));
        $pdf->SetLineWidth(0.1);

        foreach ($data['linkSummary'] as $linkItem) {

            // 获取数据
            $linkid_linkname = $linkItem['linkid_linkname'];
            $totalCostAmountDue = $linkItem['totalCostAmountDue'];

            // 第一行: linkid_linkname 和 totalCostAmountDue
            $pdf->SetX($marginLeftAndRight); // 设置起始位置
            $pdf->SetFont('microsoftyaheib', 'B', 9);
            $pdf->Cell(140, 8, $linkid_linkname, 1, 0, 'L'); // 左列, 边框设置为 1
            $pdf->Cell(60, 8, "￥" . $totalCostAmountDue, 1, 1, 'R'); // 右列
            $this->addProdLogs($pdf, $linkItem['productLogs'], $marginLeftAndRight);
        }
    }


    public function addProdLogs(&$pdf, $logs, $marginLeftAndRight) {

        foreach ($logs as $prodItem) {

            // 第一行: linkid_linkname 和 totalCostAmountDue
            $pdf->SetX($marginLeftAndRight); // 设置起始位置

            $pdf->SetTextColor(237, 113, 0);
            $pdf->SetFont('microsoftyaheib', 'B', 9);

            $pdf->Cell(140, 8, '    ' . $prodItem['productCode'], 1, 0, 'L'); // 左列, 边框设置为 1
            $pdf->Cell(60, 8, "￥" . $prodItem['totalCostAmountDue'], 1, 1, 'R'); // 右列
            $pdf->SetTextColor(0, 0, 0);

            $pdf->SetX($marginLeftAndRight); // 设置起始位置
            $pdf->Cell(140, 8, '      ' . "资源使用费(含税6%)", 1, 0, 'L'); // 左列
            $pdf->Cell(60, 8, "￥" . $prodItem['totalCost'], 1, 1, 'R'); // 右列

            $pdf->SetX($marginLeftAndRight); // 设置起始位置
            $pdf->Cell(140, 8, '      ' . "服务税费", 1, 0, 'L'); // 左列
            $pdf->Cell(60, 8, "￥" . $prodItem['serviceTax'], 1, 1, 'R'); // 右列

            $pdf->SetX($marginLeftAndRight); // 设置起始位置
            $pdf->Cell(140, 8, '      ' . "Credit", 1, 0, 'L'); // 左列
            $pdf->Cell(60, 8, "￥" . $prodItem['totalCredit'], 1, 1, 'R'); // 右列

            $pdf->SetX($marginLeftAndRight); // 设置起始位置
            $pdf->Cell(140, 8, '      ' . "折扣", 1, 0, 'L'); // 左列
            if ($prodItem['totalDiscount'] == 0) {
                $pdf->Cell(60, 8, "￥" . $prodItem['totalDiscount'], 1, 1, 'R'); // 右列

            } else {
                $pdf->Cell(60, 8, "￥-" . $prodItem['totalDiscount'], 1, 1, 'R'); // 右列
            }
        }
    }
}
