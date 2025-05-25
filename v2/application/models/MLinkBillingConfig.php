<?php

class MLinkBillingConfig extends CI_Model {
  public function __construct() {
    parent::__construct();
  }

  public function getLinkJumpLog($linkid) {
    $this->db->select('ljh.id as id ,tp.payerid as payerid,ljh.linkid, ljh.belong_start, ljh.belong_end, ljh.jump_tag ');
    $this->db->from('link_jump_history ljh');
    $this->db->join('tier2_payerid tp', 'ljh.payerid = tp.id', 'left');
    $this->db->where('ljh.linkid', $linkid);
    $rows = $this->db->get()->result_array();
    return $rows;
  }



  /**
   * 
   *  tierid	payerid	        linkid	      productCodes
   *       9	417966497442	  085211525492	["AmazonCloudWatch", "AmazonS3", "AWSDataTransfer", "AWSGlue", "awskms"]
   * 
   */

  public function GLevelAndProductMatrix($billmonth) {

    clog("批量配置:从 s3_global_cur_month_pivot 获取唯一的 tierid/payerid/linkid 组合以及相关的 productCodes", 'red');
    $query = $this->db->query("
        SELECT 
            tierid, 
            payerid, 
            linkid, 
            JSON_ARRAYAGG(productCode) AS productCodes 
        FROM (
            SELECT DISTINCT tierid, payerid, linkid, productCode
            FROM s3_global_cur_month_pivot 
            WHERE billmonth = ?
        ) AS subquery
        GROUP BY tierid, payerid, linkid
    ", array($billmonth));
    $results = $query->result_array();
    return $results;
  }

  public function GLinkidLevelAndProductMatrix($billmonth, $linkid) {

    clog("批量配置:从 s3_global_cur_month_pivot 获取唯一的 tierid/payerid/linkid 组合以及相关的 productCodes", 'red');
    $query = $this->db->query("
        SELECT 
            tierid, 
            payerid, 
            linkid, 
            JSON_ARRAYAGG(productCode) AS productCodes 
        FROM (
            SELECT DISTINCT tierid, payerid, linkid, productCode
            FROM s3_global_cur_month_pivot 
            WHERE billmonth = ? and linkid = ?
        ) AS subquery
        GROUP BY tierid, payerid, linkid
    ", array($billmonth, $linkid));
    $results = $query->result_array();
    return $results;
  }



  public function CreateLevelAndProductMatrix($billmonth) {
    $matrix   = $this->GLevelAndProductMatrix($billmonth);
    $discountData = [];
    foreach ($matrix as $row) {
      // 检查 cfg_monthly_discount 表中是否存在对应的折扣
      $discountQuery = $this->db->query("
            SELECT discount 
            FROM cfg_monthly_discount 
            WHERE billmonth = ? AND linkid = ?
        ", array($billmonth, $row['linkid']));
      $discountResult = $discountQuery->row_array();

      if ($discountResult) {
        $discount = $discountResult['discount'];
        $memo = '继承自 cfg_monthly_discount';
      } else {
        $discount = 0;
        $memo = '在 cfg_monthly_discount 未找到';
      }

      $productCodesArray = json_decode($row['productCodes'], true);

      $discountData[] = [
        'billmonth' => $billmonth,
        'tierid' => $row['tierid'],
        'memo' => $memo,
        'payerid' => $row['payerid'],
        'linkid' => $row['linkid'],
        'discountValue' => $discount,
        'productCodes' => $productCodesArray
      ];
    }

    clog("初始折扣设置结束", 'red');
    return $discountData;
  }


  public function CreateLinkLevelAndProductMatrix($billmonth, $linkid) {
    $matrix   = $this->GLinkidLevelAndProductMatrix($billmonth, $linkid);
    $discountData = [];
    foreach ($matrix as $row) {
      // 检查 cfg_monthly_discount 表中是否存在对应的折扣
      $discountQuery = $this->db->query("
            SELECT discount 
            FROM cfg_monthly_discount 
            WHERE billmonth = ? AND linkid = ?
        ", array($billmonth, $row['linkid']));
      $discountResult = $discountQuery->row_array();

      if ($discountResult) {
        $discount = $discountResult['discount'];
        $memo = '继承自 cfg_monthly_discount';
      } else {
        $discount = 0;
        $memo = '在 cfg_monthly_discount 未找到';
      }

      $productCodesArray = json_decode($row['productCodes'], true);

      $discountData[] = [
        'billmonth' => $billmonth,
        'tierid' => $row['tierid'],
        'memo' => $memo,
        'payerid' => $row['payerid'],
        'linkid' => $row['linkid'],
        'discountValue' => $discount,
        'productCodes' => $productCodesArray
      ];
    }

    clog("初始折扣设置结束", 'red');
    return $discountData;
  }


  // 获取 某月所有的 MarketPlace 产品
  public function GetMonthMarketPlaceProducts($billmonth) {

    clog("批量配置:从 s3_global_cur_month_pivot 获取获取所有的MarketPlace产品 ", 'red');
    $rows = $this->db->query(" SELECT  distinct productCode AS productCode FROM s3_global_cur_month_pivot 
                                WHERE  ifMarketPlace ='y' and  billmonth = ? ", [$billmonth])->result_array();

    $MarketPlaceProducts = array_column($rows, 'productCode');
    return $MarketPlaceProducts;
  }



  // 批量保存配置数据(  Main + Detail ),会判断是否是 marketPlace
  // 写入 :cfg_link_discount + cfg_link_prod_discount
  public function SaveBatchDiscountData($discountData, $marketPlaceProducts) {
    clog("保存 主数据/Detail  到 cfg_link_discount/cfg_link_prod_discount", 'red');
    $index = 1;
    foreach ($discountData as $data) {


      $linkDiscountData = [
        'billmonth' => $data['billmonth'],
        'tierid' => $data['tierid'],
        'payerid' => $data['payerid'],
        'linkid' => $data['linkid'],
        'memo' => $data['memo'],
        'discountValue' => $data['discountValue']
      ];

      $this->db->insert('cfg_link_discount', $linkDiscountData);
      $itemId = $this->db->insert_id();

      // 插入到 cfg_link_prod_discount 表,缺省全部为 "cutfirst"
      $detail_configs = [];

      foreach ($data['productCodes'] as $productCode) {
        $cutoption = $this->_SetFirlstOrLater($data['billmonth'], $data['tierid'], $data['payerid'], $data['linkid'], $productCode, $data['discountValue']);

        $linkDetailData = [
          'itemid' => $itemId,
          'billmonth' => $data['billmonth'],
          'payerid' => $data['payerid'],
          'linkid' => $data['linkid'],
          'productCode' => $productCode,
          'usageType' => '*',
          'ifMarketPlace' => in_array($productCode, $marketPlaceProducts) ? 'y' : 'n',
          'discount' =>  in_array($productCode, $marketPlaceProducts) ? 0 : $data['discountValue'],
          'cutoption' => $cutoption
        ];
        $detail_configs[] = $linkDetailData;
      }
      if (count($detail_configs) > 0) {
        $this->db->insert_batch('cfg_link_prod_discount', $detail_configs);
      }
      $index++;
    }
    clog("保存结束", 'red');
    return true;
  }




  // 根据使用量,自动计算 cutfirst,cutlater
  public function  _SetFirlstOrLater($billmonth, $tierid, $payerid, $linkid, $productCode, $discountValue) {
    // debug($productCode);

    $this->db->where('billmonth', $billmonth);
    $this->db->where('tierid', $tierid);
    $this->db->where('payerid', $payerid);
    $this->db->where('linkid', $linkid);
    $this->db->where('productCode', $productCode);

    $sql = "
    SELECT 
            productCode,
            ROUND(SUM(r_DistributorDiscount), 4) AS r_DistributorDiscount,
            ROUND(SUM(totalCost), 4) AS totalCost
        FROM 
            s3_global_cur_month_pivot  
        WHERE billmonth='{$billmonth}' 
        AND  linkid='{$linkid}'
        AND payerid='{$payerid}'
        AND tierid='{$tierid}'
        AND productCode=" . $this->db->escape($productCode) . "
        GROUP BY productCode ";

    $pivotRow = $this->db->query($sql)->row_array();

    if ($pivotRow['totalCost'] == 0) {
      return 'cutfirst';
    }


    // debug($pivotRow);
    $pivPercent = 100 * (abs($pivotRow['r_DistributorDiscount']) / $pivotRow['totalCost']);
    // debug($pivPercent);
    if ($pivPercent > floatval($discountValue)) {
      return 'cutlater';
    } else {
      return 'cutfirst';
    }
  }
}
