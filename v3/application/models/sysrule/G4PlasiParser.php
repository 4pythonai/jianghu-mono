<?php

class G4PlasiParser  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }



  public function parserRawData($userid, $config) {


    $gambleSysName = $config['gambleSysName'];
    $gambleUserName = $config['gambleUserName'];

    $_reward = [];

    $tmp = json_decode($config['RewardConfig'], true);
    $_reward['rewardPair'] = $tmp['rewardPair'];
    $_reward['rewardPreCondition'] = $tmp['rewardPreCondition'];
    $_reward['rewardType'] = $tmp['rewardType'];




    $_kpis = [];

    // debug($config['kpis']);
    // die;

    // if $config['kpis'] is string ,convet to array 
    if (is_string($config['kpis'])) {
      $config['kpis'] = json_decode($config['kpis'], true);
    }

    $_kpis['kpiValues'] = $config['kpis']['kpiValues'];



    $_kpis['indicators'] = $config['kpis']['indicators'];
    $_kpis['totalCalculationType'] = $config['kpis']['totalCalculationType'];

    // indicators

    // 

    //     rewardPair: [{scoreName: "Par", rewardValue: 0}, {scoreName: "Birdie", rewardValue: 1},…]
    // rewardPreCondition: "total_win"
    // rewardType: "add"


    // 准备插入数据
    $insert_data = [
      'creator_id' => $userid,
      'gambleSysName' => $gambleSysName,
      'gambleUserName' => $gambleUserName,
      'playersNumber' => $config['playersNumber'],
      'RewardConfig' => json_encode($_reward),
      'dutyConfig' => $config['dutyConfig'],
      'PartnerDutyCondition' => $config['PartnerDutyCondition'],
      'badScoreBaseLine' => $config['badScoreBaseLine'],
      'badScoreMaxLost' => 10000000, // 默认值
      'drawConfig' => $config['drawConfig'],
      'meatValueConfig' => $config['meatValueConfig'],
      'meatMaxValue' => $config['meatMaxValue'],
      'eatingRange' =>  $config['eatingRange'],
      'kpis' => json_encode($_kpis),

    ];
    return $insert_data;
  }
}
