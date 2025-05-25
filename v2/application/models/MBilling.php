<?php


class MBilling extends CI_Model {
  public function __construct() {
    parent::__construct();
  }




  private function _getV2Sql($billmonth, $tierid) {
    $sql = " 
          insert into s3_global_cur_raw_subtotal( 
          tierid, product_region,payerid, linkid, billmonth,
          lineItem_ProductCode,product_ProductName,
           lineItem_UsageType,
          lineItem_LineItemDescription,
          lineItem_UnblendedCost,
          lineItem_UsageAmount
          )  
                   SELECT
          tierid, product_region,payerid, linkid, billmonth,
          lineItem_ProductCode,
          product_ProductName, lineItem_UsageType,
          lineItem_LineItemDescription,
          sum(lineItem_UnblendedCost),
          sum(lineItem_UsageAmount)
          FROM s3_global_cur_raw
          WHERE billmonth = '$billmonth'  AND tierid = $tierid AND 
          lineItem_LineItemType not in ('Refund','EdpDiscount','DistributorDiscount')
          GROUP BY
          tierid, product_region,payerid, linkid, billmonth, 
          lineItem_ProductCode,product_ProductName, lineItem_UsageType,
          lineItem_LineItemDescription";
    return $sql;
  }



  public function PreParePivotMask($billmonth, $tierid) {

    // truncate 表格 s3_global_cur_month_pivot_detail_stack
    $this->db->truncate('s3_global_cur_raw_subtotal');
    // 获取 sql 来写入表格 s3_global_cur_month_pivot_detail_stack
    $sql = $this->_getV2Sql($billmonth, $tierid);
    // 执行 sql
    $this->db->query($sql);
  }




  public function RenderCSVLinkHandler($billmonth, $tierid, $linkid) {

    $firstlinkdate =  $billmonth . '-01';
    $lastlinkdate =  date('Y-m-d', strtotime($firstlinkdate . ' +1 month -1 day'));
    $billCreateDate = date('Y-m-d', strtotime($firstlinkdate . ' +1 month +5 day'));

    $linkname = $this->MCloudLevel->getLinkNameByLinkId($linkid);
    $tiername = $this->MCloudLevel->getTierNameByTierid($tierid);



    // 分产品+地区+使用类型+描述汇总
    $sql = " 
     select    product_ProductName,
            CASE 
                WHEN product_region = '' OR product_region IS NULL THEN '---'
                WHEN r.name IS NULL THEN product_region
                ELSE r.name
            END as product_region,
            lineItem_UsageType,
            lineItem_LineItemDescription,
            sum(lineItem_UsageAmount) as totalUsageAmount,
            sum(lineItem_UnblendedCost)   as totalUnblendedCost
    from s3_global_cur_raw_subtotal s
    LEFT JOIN aws_regions r ON s.product_region = r.code
    where linkid='$linkid' and billmonth='$billmonth'
    group by   product_ProductName,
    lineItem_UsageType,
               CASE 
                   WHEN product_region = '' OR product_region IS NULL THEN '---'
                   WHEN r.name IS NULL THEN product_region
                   ELSE r.name
               END,
               lineItem_LineItemDescription
       
    order by product_ProductName,
             CASE 
                 WHEN product_region = '' OR product_region IS NULL THEN '---'
                 WHEN r.name IS NULL THEN product_region
                 ELSE r.name
             END,
               lineItem_LineItemDescription";

    $div_4layer_data = $this->db->query($sql)->result_array();


    $rawCostsql = " select  
    sum(lineItem_UnblendedCost)     as linkTotalCost
    from s3_global_cur_raw_subtotal 
    where linkid='$linkid' and billmonth='$billmonth' ";
    $rawRow = $this->db->query($rawCostsql)->row_array();
    $totalCost = $rawRow['linkTotalCost'];

    $level0_sql = "select lineItem_ProductCode as product ,product_ProductName,sum(lineItem_UnblendedCost) as cost_subtotal from s3_global_cur_raw_subtotal where linkid='$linkid' and billmonth='$billmonth' group by lineItem_ProductCode,product_ProductName";
    $level0_data = $this->db->query($level0_sql)->result_array();



    $excelData = [
      'billmonth' => $billmonth,
      'linkid' => $linkid,
      'excelProdCostLogs' => $div_4layer_data,
      'linkname' => $linkname,
      'tiername' => $tiername,
      'totalCost' => $totalCost,
      'firstlinkdate' => date('Y/m/d', strtotime($firstlinkdate)),
      'lastlinkdate' => date('Y/m/d', strtotime($lastlinkdate)),
      'billCreateDate' => date('Y/m/d', strtotime($billCreateDate)),
    ];


    $PdfLinkInfo = $this->GetPdfLinkInfo($billmonth, $tierid, $linkid);

    $pdfTotalCost = $PdfLinkInfo['totalCost'];

    $excelTotalCost = $excelData['totalCost'];

    $pdfEqualExcel = true;

    if (floatval($pdfTotalCost) != floatval($excelTotalCost)) {
      $pdfEqualExcel = false;
    }


    $linkProdCostDiffArr = $this->compareProdCost($level0_data, $PdfLinkInfo['productLogs']);

    // debug($linkProdCostDiffArr);
    // die;


    // 判断 pdf 账单里面的金额与excel 账单里面的金额是否相等
    $excelData['pdfEqualExcel'] = $pdfEqualExcel;
    $excelData['linkProdCostDiffArr'] = $linkProdCostDiffArr;


    $filename = $this->MBillExcelLink->renderLinkExcel($excelData);
    return $filename;
  }





  public function GetPdfLinkInfo($billmonth, $tierid, $linkid) {
    $query = $this->db->select('linkSummary')
      ->from('bill_tier2')
      ->where('billmonth', $billmonth)
      ->where('tierid', $tierid)
      ->get();

    $totalCost = 0;
    $productLogs = [];

    $all_linkSummaries = [];

    foreach ($query->result() as $row) {
      // Decode JSON string to array
      $linkSummaries = json_decode($row->linkSummary, true);
      // 将 linkSummaries 每个元素 添加到 all_linkSummaries 数组中
      $all_linkSummaries = array_merge($all_linkSummaries, $linkSummaries);
    }


    foreach ($all_linkSummaries as $summary) {
      // Check if this is the link we're looking for
      if (isset($summary['linkid_linkname']) && strpos($summary['linkid_linkname'], $linkid . '/') === 0) {
        $totalCost = floatval($summary['totalCost']);
        $productLogs = $summary['productLogs'];
      }
    }

    return  ['totalCost' => $totalCost, 'productLogs' => $productLogs];
  }

  private function compareProdCost($level0_data, $pdfProductLogs) {

    // debug($level0_data);
    // die;

    $costDiffArr = [];

    // Create lookup array for PDF product costs
    $pdfCosts = [];
    foreach ($pdfProductLogs as $pdfProduct) {
      $pdfCosts[$pdfProduct['productCode']] = floatval($pdfProduct['totalCost']);
    }

    // Compare each product in level0_data with PDF costs
    foreach ($level0_data as $excelProduct) {
      $productCode = $excelProduct['product'];
      $excelCost = floatval($excelProduct['cost_subtotal']);
      $pdfCost = isset($pdfCosts[$productCode]) ? $pdfCosts[$productCode] : 0.0;

      // Compare costs with small epsilon to handle floating point precision
      if (abs($excelCost - $pdfCost) > 0.0001) {
        $costDiffArr[] = [
          'productCode' => ' ' . $productCode,
          'excelCost' =>  $excelCost,
          'pdfCost' => $pdfCost,
          'difference' => $excelCost - $pdfCost
        ];
      }
    }

    // Also check for products that exist in PDF but not in Excel
    foreach ($pdfCosts as $productCode => $pdfCost) {
      $existsInExcel = false;
      foreach ($level0_data as $excelProduct) {
        if ($excelProduct['product'] === $productCode) {
          $existsInExcel = true;
          break;
        }
      }

      if (!$existsInExcel && abs($pdfCost) > 0.0001) {
        $costDiffArr[] = [
          'productCode' => $productCode,
          'excelCost' => 0.0,
          'pdfCost' => $pdfCost,
          'difference' => -$pdfCost
        ];
      }
    }

    return $costDiffArr;
  }
}
