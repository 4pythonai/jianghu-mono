<?php

class G4P8421Parser  extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    public function parserRawData($user_id, $config) {


        // 获取必需参数
        $gambleSysName = $config['gambleSysName'];
        $gambleUserName = $config['gambleUserName'];


        // 准备插入数据
        $insert_data = [
            'creator_id' => $user_id,
            'gambleSysName' => $gambleSysName,
            'gambleUserName' => $gambleUserName,
            'playersNumber' => $config['playersNumber'],
            'badScoreBaseLine' => $config['badScoreBaseLine'],
            'badScoreMaxLost' => $config['badScoreMaxLost'] ?? 10000000,
            'dutyConfig' => $config['dutyConfig'],

            'drawConfig' => $config['drawConfig'],

            'eatingRange' =>   $config['eatingRange'],
            'meatValueConfig' => $config['meatValueConfig'],
            'meatMaxValue' => $config['meatMaxValue'],
        ];


        return $insert_data;
    }
}
