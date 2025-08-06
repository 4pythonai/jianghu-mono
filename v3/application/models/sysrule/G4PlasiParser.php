<?php

class G4PlasiParser  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }



  public function parserRawData($userid, $json_paras) {

    debug($json_paras);

    // 获取必需参数
    $gamblesysname = $json_paras['gamblesysname'] ?? null;
    // check  key exists stroking_config and stroking_config is not empty

    // 准备插入数据
    $insert_data = [
      'creator_id' => $userid,
      'gambleSysName' => $gamblesysname,
      'gambleUserName' => $json_paras['user_rulename'] ?? '',
      'playersNumber' => 4, // 默认4人
      'badScoreBaseLine' => 'Par+4', // 默认值
      'badScoreMaxLost' => 10000000, // 默认值
      // 'stroking_config' =>  $stroking_config,
      'drawConfig' => $json_paras['lasi_dingdong_config'] ?? 'DrawEqual',
      'eatingRange' => json_encode($json_paras['eatingRange'] ?? []),
      'meatValueConfig' => $json_paras['meatValueConfig'] ?? 'MEAT_AS_1',
      'meatMaxValue' => $json_paras['meatMaxValue'] ?? 10000000,
      'dutyConfig' => $json_paras['lasi_baodong_config']['dutyConfig'],
      'PartnerDutyCondition' => $json_paras['lasi_baodong_config']['PartnerDutyCondition'],
      'RewardConfig' => json_encode($json_paras['RewardConfig']),
    ];
    // debug($insert_data);
    return $insert_data;
  }
}
