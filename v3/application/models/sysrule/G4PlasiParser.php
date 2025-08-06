<?php

class G4PlasiParser  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }



  public function parserRawData($userid, $config) {


    // debug($config);
    $gambleSysName = $config['gambleSysName'];
    $gambleUserName = $config['gambleUserName'];

    // 准备插入数据
    $insert_data = [
      'creator_id' => $userid,
      'gambleSysName' => $gambleSysName,
      'gambleUserName' => $gambleUserName,
      'playersNumber' => 4, // 默认4人

      'RewardConfig' => json_encode($config['LasiRewardConfig']),

      'dutyConfig' => $config['LasiKoufen']['dutyConfig'],
      'PartnerDutyCondition' => $config['LasiKoufen']['PartnerDutyCondition'],

      'badScoreBaseLine' => 'Par+4', // 默认值
      'badScoreMaxLost' => 10000000, // 默认值
      'drawConfig' => $config['LasiDingDong']['dingdongConfig'],
      'meatValueConfig' => $config['LasiEatmeat']['meatValueConfig'],
      'meatMaxValue' => $config['LasiEatmeat']['meatMaxValue'],
      'eatingRange' => json_encode($config['LasiEatmeat']['eatingRange'] ?? []),
      'kpis' => json_encode($config['LasiKPI'] ?? []),

    ];
    // debug($insert_data);
    return $insert_data;
  }
}
