<?php


// 批量计算折扣

class MDiscountBatcher extends CI_Model {


  // 计算折扣,放入临时表
  public function batchDiscount($billmonth) {

    $this->load->model('MDiscountCalculator');
    $sql = "SELECT *
                FROM tier2_cust_linkid t1
                WHERE id = (
                    SELECT MAX(id)
                    FROM tier2_cust_linkid t2
                    WHERE t2.linkid = t1.linkid
                ) ";

    $rows = $this->db->query($sql)->result_array();
    $batchDiscounts = [];

    foreach ($rows as $para) {
      $mdisCountCalculator = new MDiscountCalculator(
        $billmonth,
        $para['id'],
        $para['tierid'],
        $para['payerid'],
        $para['linkid']
      );

      $mdisCountCalculator->init();
      $res = $mdisCountCalculator->calculateTotalDiscount();
      if (array_key_exists('海外条件', $res['AllConfig'])) {
        $memo = $res['AllConfig']['海外条件']['value'];
      } else {
        $memo = '';
      }

      $batchDiscounts[] = [
        'billmonth' => $billmonth,
        'tierid' => $para['tierid'],
        'payerid' => $res['payerid'],
        'linkid' => $para['linkid'],
        'discount' => $res['totalDiscountValue'],
        'bossvalue' => $res['totalDiscountValue'],
        'totalDiscountDebug' => $res['totalDiscountDebug'],
        'baseDiscountValue' => $res['baseDiscountValue'],
        'techDiscountValue' => $res['techDiscountValue'],
        'newCustDiscountValue' => $res['newCustDiscountValue'],
        'ceiDiscountValue' => $res['ceiDiscountValue'],
        'growthDiscountValue' => $res['growthDiscountValue'],
        'region' => $res['region_tag']['value'],
        'memo' => $memo,
        'tiername' => $res['tiername'],
        'status' => $para['status'],
        'chanceid' => $para['chanceid']
      ];
    }
    if (count($batchDiscounts) > 0) {
      $this->db->insert_batch('cfg_monthly_discount', $batchDiscounts);
    }
  }


  // 
  // 由 cfg_monthly_discount  => cfg_link_discount, cfg_link_prod_discount
  public function transferDraft($billmonth) {


    $this->db->where('billmonth', $billmonth);
    $this->db->delete('cfg_link_discount');

    $this->db->where('billmonth', $billmonth);
    $this->db->delete('cfg_link_prod_discount');


    $tplRows = $this->db->get_where('cfg_monthly_discount', ['billmonth' => $billmonth])->result_array();
    $batchDiscounts = [];

    foreach ($tplRows as $row) {
      unset($row['id']);
      $batchDiscounts[] = $row;
    }

    if (count($batchDiscounts) > 0) {

      $matrixWithDefaultDiscounts = $this->MLinkBillingConfig->CreateLevelAndProductMatrix($billmonth);
      $marketPlaceProducts = $this->MLinkBillingConfig->GetMonthMarketPlaceProducts($billmonth);
      $this->MLinkBillingConfig->SaveBatchDiscountData($matrixWithDefaultDiscounts, $marketPlaceProducts);
      $dberr = $this->db->error();
      return $dberr;
    } else {
      return ['code' => 0];
    }
  }

  // 单独link处理,稽核后的补齐
  public function transferLinkDraft($billmonth, $linkid) {

    // $this->db->where('billmonth', $billmonth);
    // $this->db->where('linkid', $linkid);
    // $this->db->delete('cfg_link_discount');

    // $this->db->where('billmonth', $billmonth);
    // $this->db->where('linkid', $linkid);
    // $this->db->delete('cfg_link_prod_discount');


    $tplRows = $this->db->get_where('cfg_monthly_discount', ['billmonth' => $billmonth, 'linkid' => $linkid])->result_array();
    $batchDiscounts = [];

    foreach ($tplRows as $row) {
      unset($row['id']);
      $batchDiscounts[] = $row;
    }

    // CreateLinkLevelAndProductMatrix  GLinkidLevelAndProductMatrix


    if (count($batchDiscounts) > 0) {
      $matrixWithDefaultDiscounts = $this->MLinkBillingConfig->CreateLinkLevelAndProductMatrix($billmonth, $linkid);
      $marketPlaceProducts = $this->MLinkBillingConfig->GetMonthMarketPlaceProducts($billmonth);
      $this->MLinkBillingConfig->SaveBatchDiscountData($matrixWithDefaultDiscounts, $marketPlaceProducts);
      $dberr = $this->db->error();
      return $dberr;
    } else {
      return ['code' => 0];
    }
  }
}
