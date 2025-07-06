<?php

declare(strict_types=1);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

// 处理让杆,得到 realScore
class MStroking extends CI_Model {



    public function processStroking($scores, $stroking_config) {
        $fixed = [];

        foreach ($scores as $one_hole) {
            $processed_hole = $this->processHoleStroking($one_hole, $stroking_config);
            $fixed[] = $processed_hole;
        }

        return $fixed;
    }

    /**
     * 处理单个洞的让杆
     * @param array $one_hole 单个洞的数据
     * @param array $stroking_config 让杆配置
     * @return array 处理后的洞数据
     */
    private function processHoleStroking($one_hole, $stroking_config) {
        $hole_id = $one_hole['id'];
        $par = $one_hole['par'];
        $hole_number = (int)str_replace('#', '', $hole_id);

        // 复制原始得分作为基础
        $one_hole['realScores'] = [];

        // 处理每个玩家的得分
        foreach ($one_hole['raw_scores'] as $player_id => $raw_score) {
            $real_score = $this->calculatePlayerStroking($player_id, $raw_score, $hole_id, $hole_number, $par, $stroking_config);
            $one_hole['realScores'][$player_id] = $real_score;
        }

        return $one_hole;
    }

    /**
     * 计算单个玩家的让杆得分
     * @param string $player_id 玩家ID
     * @param int $raw_score 原始得分
     * @param string $hole_id 洞ID
     * @param int $hole_number 洞号
     * @param int $par PAR值
     * @param array $stroking_config 让杆配置
     * @return int 实际得分
     */
    private function calculatePlayerStroking($player_id, $raw_score, $hole_id, $hole_number, $par, $stroking_config) {
        // 如果原始得分为0，说明还没有计费，不需要让杆
        if ($raw_score == 0) {
            return $raw_score;
        }

        // 检查该玩家是否有让杆配置
        if (!isset($stroking_config[$player_id])) {
            return $raw_score;
        }

        $player_stroking = $stroking_config[$player_id];
        $current_stroking_config = $this->findCurrentStrokingConfig($hole_number, $player_stroking);

        if (!$current_stroking_config) {
            return $raw_score;
        }

        $par_key = 'PAR' . $par;
        if (!isset($current_stroking_config[$par_key])) {
            return $raw_score;
        }

        $stroking_value = $current_stroking_config[$par_key];
        $real_score = $raw_score - $stroking_value;

        // 记录让杆日志
        debug("info: 让杆发生: userID {$player_id} 在洞 {$hole_id} 发生让分, PAR{$par}, 让杆数:{$stroking_value}, 原始得分:{$raw_score}, 实际得分:{$real_score}");

        // 确保得分不为负数
        return max(0, $real_score);
    }

    /**
     * 找到当前洞号应该使用的让杆配置
     * @param int $hole_number 洞号
     * @param array $player_stroking 玩家的让杆配置
     * @return array|null 当前应该使用的让杆配置
     */
    private function findCurrentStrokingConfig($hole_number, $player_stroking) {
        $applicable_configs = [];

        // 找到所有小于等于当前洞号的配置
        foreach ($player_stroking as $config_hole_key => $config) {
            $config_hole_number = (int)str_replace('#', '', $config_hole_key);
            if ($config_hole_number <= $hole_number) {
                $applicable_configs[$config_hole_number] = $config;
            }
        }

        // 如果没有找到配置，返回null
        if (empty($applicable_configs)) {
            return null;
        }

        // 找到最大的配置洞号（即最接近当前洞号的配置）
        $max_hole_number = max(array_keys($applicable_configs));
        return $applicable_configs[$max_hole_number];
    }
}
