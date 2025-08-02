<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MRuntimeConfig extends CI_Model {


    public function getGambleConfig($gambleid) {
        $sql = "select * from t_gamble_x_runtime where id=$gambleid";
        $RunTimeConfigRow = $this->db->query($sql)->row_array();

        $userRuleId = $RunTimeConfigRow['userRuleId'];
        $sql = "select * from t_gamble_rules_user where id=$userRuleId";
        $GambleConfigRow = $this->db->query($sql)->row_array();



        $RunTimeConfigRow['deductionConfig'] = $GambleConfigRow['deductionConfig'];
        $RunTimeConfigRow['deductionMaxValue'] = $GambleConfigRow['deductionMaxValue'];
        $RunTimeConfigRow['drawConfig'] = $GambleConfigRow['drawConfig'];
        $RunTimeConfigRow['eatingRange'] = $GambleConfigRow['eatingRange'];
        $RunTimeConfigRow['meatValueConfig'] = $GambleConfigRow['meatValueConfig'];
        $RunTimeConfigRow['meatMaxValue'] = $GambleConfigRow['meatMaxValue'];
        $RunTimeConfigRow['dutyConfig'] = $GambleConfigRow['dutyConfig'];

        // 防御性处理 kickConfig ,  donationCfg
        $kickConfig = $RunTimeConfigRow['kickConfig'];
        if (!empty($kickConfig) && is_string($kickConfig)) {
            $decoded = json_decode($kickConfig, true);
            $RunTimeConfigRow['kickConfig'] = $decoded !== null ? $decoded : null;
        } else {
            $RunTimeConfigRow['kickConfig'] = null;
        }

        $donationCfg = $RunTimeConfigRow['donationCfg'];
        if (!empty($donationCfg) && is_string($donationCfg)) {
            $decoded = json_decode($donationCfg, true);
            $RunTimeConfigRow['donationCfg'] = $decoded !== null ? $decoded : null;
        } else {
            $RunTimeConfigRow['donationCfg'] = null;
        }

        // 缓存结果
        return $RunTimeConfigRow;
    }
}
