<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MRuntimeConfig extends CI_Model {


    public function getGambleConfig($gambleid) {
        $sql = "select * from t_gamble_runtime where id=$gambleid";
        $RunTimeConfigRow = $this->db->query($sql)->row_array();
        $userRuleId = $RunTimeConfigRow['userRuleId'];
        $sql = "select * from t_gamble_rule_user where id=$userRuleId";
        $GambleConfigRow = $this->db->query($sql)->row_array();

        // donationCfg , kickConfig


        $RunTimeConfigRow['sub8421_config_string'] = $GambleConfigRow['sub8421_config_string'];
        $RunTimeConfigRow['max8421_sub_value'] = $GambleConfigRow['max8421_sub_value'];
        $RunTimeConfigRow['draw8421_config'] = $GambleConfigRow['draw8421_config'];
        $RunTimeConfigRow['eating_range'] = $GambleConfigRow['eating_range'];
        $RunTimeConfigRow['meat_value_config_string'] = $GambleConfigRow['meat_value_config_string'];
        $RunTimeConfigRow['meat_max_value'] = $GambleConfigRow['meat_max_value'];
        $RunTimeConfigRow['duty_config'] = $GambleConfigRow['duty_config'];

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
