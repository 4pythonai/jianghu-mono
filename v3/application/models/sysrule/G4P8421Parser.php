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
            'badScoreBaseLine' => $config['badScoreBaseLine'],
            'badScoreMaxLost' => $config['badScoreMaxLost'] ?? 10000000,
            'dutyConfig' => $config['dutyConfig'],

            'drawConfig' => $config['drawConfig'],

            'eatingRange' =>  json_encode($config['eatingRange'], JSON_UNESCAPED_UNICODE),
            'meatValueConfig' => $config['meatValueConfig'],
            'meatMaxValue' => $config['meatMaxValue'],
        ];


        return $insert_data;
    }
}
