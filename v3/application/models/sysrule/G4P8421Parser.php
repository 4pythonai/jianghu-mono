<?php

class G4P8421Parser  extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    public function parserRawData($userid, $config) {


        // 获取必需参数
        $gambleSysName = $config['gambleSysName'];
        $gambleUserName = $config['gambleUserName'];


        // 准备插入数据
        $insert_data = [
            'creator_id' => $userid,
            'gambleSysName' => $gambleSysName,
            'gambleUserName' => $gambleUserName,
            'playersNumber' => 4,
            'badScoreBaseLine' => $config['E8421Koufen']['badScoreBaseLine'] ?? 'Par+4',
            'badScoreMaxLost' => $config['E8421Koufen']['badScoreMaxLost'] ?? 10000000,
            'dutyConfig' => $config['E8421Koufen']['dutyConfig'],

            'drawConfig' => $config['Draw8421']['drawConfig'],

            'eatingRange' =>  json_encode($config['E8421Meat']['eatingRange'], JSON_UNESCAPED_UNICODE),
            'meatValueConfig' => $config['E8421Meat']['meatValueConfig'],
            'meatMaxValue' => $config['E8421Meat']['meatMaxValue'],
        ];


        return $insert_data;
    }
}
