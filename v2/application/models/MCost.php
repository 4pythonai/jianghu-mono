<?php


class MCost extends CI_Model {
  public function __construct() {
    parent::__construct();
  }

  // 财务需要的执行,先由php执行
  private function setCreditField($billmonth) {
    $sql = "
    UPDATE cfg_link_discount d
    SET Credit = (
        SELECT SUM(p.r_Credit)
        FROM s3_global_cur_month_pivot p
        WHERE p.billmonth = d.billmonth
        AND p.payerid = d.payerid
        AND p.tierid = d.tierid
        AND p.linkid = d.linkid
        AND p.billmonth = '$billmonth'
    )
    WHERE d.billmonth = '$billmonth'
    ";

    return $sql;
  }
}
