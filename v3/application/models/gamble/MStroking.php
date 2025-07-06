<?php

declare(strict_types=1);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

// 处理让杆,得到 realScore
class MStroking extends CI_Model {


    // scores] => Array
    //     (
    //         [0] => Array
    //             (
    //                 [id] => #1
    //                 [hindex] => 1
    //                 [holeid] => 19
    //                 [par] => 5
    //                 [selected] => y
    //                 [holename] => A1
    //                 [court_key] => 1
    //                 [raw_scores] => Array
    //                     (
    //                         [93] => 5
    //                         [160] => 5
    //                         [185] => 4
    //                         [2271] => 10
    //                     )

    //             )

    //         [1] => Array
    //             (
    //                 [id] => #2
    //                 [hindex] => 2
    //                 [holeid] => 20
    //                 [par] => 4
    //                 [selected] => y
    //                 [holename] => A2
    //                 [court_key] => 1
    //                 [raw_scores] => Array
    //                     (
    //                         [93] => 4
    //                         [160] => 8
    //                         [185] => 4
    //                         [2271] => 4
    //                     )

    //             )


    // stroking_config 格式：
    // [
    //     '185' => [
    //         '1#' => ['PAR3' => 1, 'PAR4' => 0.5, 'PAR5' => 0.5],
    //         '8#' => ['PAR3' => 0.5, 'PAR4' => 0.5, 'PAR5' => 0.5]
    //     ]
    // ];

    public function processStroking($scores, $stroking_config) {
        $fixed = [];

        foreach ($scores as $one_hole) {
            $hole_id = $one_hole['id'];
            $par = $one_hole['par'];
            $par_key = 'PAR' . $par;

            // 提取洞号数字 (从"#1"格式提取"1")
            $hole_number = (int)str_replace('#', '', $hole_id);

            // 复制原始得分作为基础
            $one_hole['realScores'] = [];

            // 处理每个玩家的得分
            foreach ($one_hole['raw_scores'] as $player_id => $raw_score) {
                $real_score = $raw_score;

                // 如果原始得分为0，说明还没有计费，不需要让杆
                if ($raw_score == 0) {
                    $one_hole['realScores'][$player_id] = $real_score;
                    continue;
                }

                // 检查该玩家是否有让杆配置
                if (isset($stroking_config[$player_id])) {
                    $player_stroking = $stroking_config[$player_id];

                    // 找到当前洞号应该使用的配置
                    $current_stroking_config = $this->findCurrentStrokingConfig($hole_number, $player_stroking);

                    if ($current_stroking_config && isset($current_stroking_config[$par_key])) {
                        $stroking_value = $current_stroking_config[$par_key];

                        // 计算实际得分：原始得分 - 让杆数
                        $real_score = $raw_score - $stroking_value;

                        // 记录让杆日志
                        debug("info: 让杆发生: userID {$player_id} 在洞 {$hole_id} 发生让分, PAR{$par}, 让杆数:{$stroking_value}, 原始得分:{$raw_score}, 实际得分:{$real_score}");

                        // 确保得分不为负数
                        $real_score = max(0, $real_score);
                    }
                }

                $one_hole['realScores'][$player_id] = $real_score;
            }

            $fixed[] = $one_hole;
        }

        return $fixed;
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
