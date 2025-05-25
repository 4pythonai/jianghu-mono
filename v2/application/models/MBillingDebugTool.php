<?php

class MBillingDebugTool  extends CI_Model {
  public function __construct() {
    parent::__construct();
  }


  public function ShowLinkidConfigure($that) {
    if ($that->hasDiscountConfigure) {
      clog("此LinkID 数据库有折扣配置,折扣率: $that->L1_discount ", 'black', 'normal', 4);
    }
  }


  public function show_finnal_result($that) {
    clog("最后结果", 'red',  'normal', 4);
    $sql = "select productCode,
                ROUND(sum(totalCost),4) as totalCost,
                ROUND(sum(discount),4) as discount ,
                ROUND(sum(shouldpay),4)   as shouldpay 
                from s3_global_cur_month_pivot where linkid='$that->linkid' and payerid = '$that->payerid'
                and billmonth='$that->billmonth' 
                group by productCode";
    $rows = $this->db->query($sql)->result_array();
    clog("分产品小计:", 'red', 'normal', 5);
    clog($rows, 'red', 'normal', 4);


    $sql = "select sum(totalCost) as totalCost,sum(discount) as discount ,sum(shouldpay)  as shouldpay 
                from s3_global_cur_month_pivot where linkid='$that->linkid' and payerid = '$that->payerid'
                and billmonth='$that->billmonth' ";
    $row = $this->db->query($sql)->row_array();


    $formatted_total = sprintf('%.2f', $row['totalCost']);
    $formatted_discount = sprintf('%.2f', $row['discount']);
    $formatted_shouldpay = $formatted_total - $formatted_discount;

    clog("总费用:" . $row['totalCost'] . '----------小数点后2位:' . $formatted_total, 'red', 'normal', 4);
    clog("折扣:" . $row['discount'] . '----------小数点后2位:' . $formatted_discount, 'red', 'normal', 4);
    clog("应收费用:" . $row['shouldpay'] . '----------小数点后2位:' . $formatted_total  . "减去" . $formatted_discount . "等于" . $formatted_shouldpay, 'red', 'normal', 4);
  }



  // 小计合计,添加subtotal行

  public function CalSubTotal($NotPPAUsedTypesFee) {
    // Initialize total counters
    $total_r_Fee = '0';
    $total_r_Usage = '0';
    $total_r_SavingsPlanRecurringFee = '';
    $total_subtotal = '0';

    // Iterate through each product usage pair
    foreach ($NotPPAUsedTypesFee as &$pair) {
      // Accumulate totals
      $total_r_Fee = bcadd($total_r_Fee, $pair['r_Fee'], 10);
      $total_r_Usage = bcadd($total_r_Usage, $pair['r_Usage'], 10);
      $total_r_SavingsPlanRecurringFee = bcadd($total_r_SavingsPlanRecurringFee, $pair['r_SavingsPlanRecurringFee'], 10);
      $total_subtotal = bcadd($total_subtotal, $pair['subtotal(r_Fee+r_Usage+r_SavingsPlanRecurringFee)'], 10);
    }

    // Append the summary row
    $summaryRow = [
      'productCode' => '汇总',
      'usageType' => '',
      'r_Fee' => $total_r_Fee,
      'r_Usage' => $total_r_Usage,
      'r_SavingsPlanRecurringFee' => $total_r_SavingsPlanRecurringFee,
      'subtotal(r_Fee+r_Usage)' => $total_subtotal
    ];

    // Add summary row to the array
    $NotPPAUsedTypesFee[] = $summaryRow;
    return $NotPPAUsedTypesFee;
  }
}
