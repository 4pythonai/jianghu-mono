<?php

class G4P8421Parser  extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    public function parserRawData($userid, $json_paras) {


        // 获取必需参数
        $gamblesysname = $json_paras['gamblesysname'] ?? null;


        // 准备插入数据
        $insert_data = [
            'creator_id' => $userid,
            'gambleSysName' => $gamblesysname,
            'gambleUserName' => $json_paras['gambleUserName'] ?? $json_paras['user_rulename'] ?? null,
            'playersNumber' => $json_paras['playersNumber'] ?? 4,
            'badScoreBaseLine' => $json_paras['badScoreBaseLine'] ?? 'Par+4',
            'badScoreMaxLost' => $json_paras['badScoreMaxLost'] ?? 10000000,
            'drawConfig' => $json_paras['drawConfig'] ?? 'Diff_2',
            'eatingRange' => isset($json_paras['eatingRange']) ? json_encode($json_paras['eatingRange'], JSON_UNESCAPED_UNICODE) : null,
            'meatValueConfig' => $json_paras['meatValueConfig'] ?? 'MEAT_AS_2',
            'meatMaxValue' => $json_paras['meatMaxValue'] ?? 1000000,
            'dutyConfig' => $json_paras['dutyConfig'] ?? 'DUTY_DINGTOU'
        ];
        return $insert_data;
    }
}
