<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MIndicatorLasi extends CI_Model {



    /**
     * 计算8421指标
     * @param int $index 洞索引
     * @param array $hole 洞数据（引用传递）
     * @param array $configs 8421配置
     */
    public function calculate8421Indicators(&$hole, $context) {
        $playerIndicatorConfig = $context->playerIndicatorConfig;
        $sub8421ConfigString =  $context->badScoreBaseLine;
        $max8421SubValue = $context->badScoreMaxLost;

        $indicatorBlue = 0;
        $indicatorRed = 0;


        // 处理红队
        foreach ($hole['red'] as $userid) {
            $userAddConfigPair = $playerIndicatorConfig[$userid];
            $_8421_add_sub_max_config = [
                'add' => $userAddConfigPair,
                'sub' => $sub8421ConfigString,
                'max' => $max8421SubValue,
            ];

            $indicator = $this->OnePlayer8421Indicator($hole['par'], $hole['computedScores'][$userid], $_8421_add_sub_max_config);

            $logMsg = sprintf(
                "第 %s 洞,红队,队员:%4d,%s, PAR:%d,分值:%2d,指标:%2d",
                $hole['hindex'],
                $userid,
                $this->MUser->getNicknameById($userid),
                $hole['par'],
                $hole['computedScores'][$userid],
                $indicator
            );

            $hole['indicators'][$userid] = $indicator;
            $hole['debug'][] = $logMsg; // 直接添加调试信息
            $indicatorRed += $indicator;
        }

        // 处理蓝队
        foreach ($hole['blue'] as $userid) {
            $userAddConfigPair = $playerIndicatorConfig[$userid];
            $_8421_add_sub_max_config = [
                'add' => $userAddConfigPair,
                'sub' => $sub8421ConfigString,
                'max' => $max8421SubValue,
            ];

            $indicator = $this->OnePlayer8421Indicator($hole['par'], $hole['computedScores'][$userid], $_8421_add_sub_max_config);

            $logMsg = sprintf(
                "第 %s 洞,蓝队,队员:%4d,%s,PAR:%d,分值:%2d,指标:%2d",
                $hole['hindex'],
                $userid,
                $this->MUser->getNicknameById($userid),
                $hole['par'],
                $hole['computedScores'][$userid],
                $indicator
            );

            $hole['indicators'][$userid] = $indicator;
            $hole['debug'][] = $logMsg; // 直接添加调试信息
            $indicatorBlue += $indicator;
        }

        $hole['indicatorBlue'] = $indicatorBlue;
        $hole['indicatorRed'] = $indicatorRed;
    }






    /**
     * 计算拉丝KPI配对结果
     * 根据拉丝算法计算两组在不同指标上的比较结果
     * 
     * @param array $hole 洞数据
     * @param array $kpis KPI配置
     * @param array $rewardConfig 奖励配置（暂时不使用）
     * @return array 拉丝结果
     */
    public function getLasiKPIPais($hole, $kpis, $rewardConfig) {

        $kpis = $this->fixKpis($kpis['kpiValues'], $kpis['totalCalculationType']);

        $redScore = 0;
        $blueScore = 0;

        // 循环计算每个指标是哪组赢了
        foreach ($kpis as $indicatorType => $points) {
            $comparisonResult = $this->compareIndicator($hole, $indicatorType);

            if ($comparisonResult['winner'] === 'red') {
                $redScore += $points;
            } elseif ($comparisonResult['winner'] === 'blue') {
                $blueScore += $points;
            }
            // 如果平局，双方都不加分
        }

        return [
            'red' => $redScore,
            'blue' => $blueScore
        ];
    }

    /**
     * 比较指定指标的双方成绩
     * @param array $hole 洞数据
     * @param string $indicatorType 指标类型 (best, worst, plus_total, multiply_total等)
     * @return array 比较结果 ['winner' => 'red'|'blue'|'draw', 'redValue' => int, 'blueValue' => int]
     */
    private function compareIndicator($hole, $indicatorType) {
        $redScores = [];
        $blueScores = [];

        // 收集红队成绩
        foreach ($hole['red'] as $userid) {
            $redScores[] = $hole['computedScores'][$userid];
        }

        // 收集蓝队成绩
        foreach ($hole['blue'] as $userid) {
            $blueScores[] = $hole['computedScores'][$userid];
        }

        // 计算红队指标值
        $redValue = $this->calculateTeamIndicator($redScores, $indicatorType);

        // 计算蓝队指标值
        $blueValue = $this->calculateTeamIndicator($blueScores, $indicatorType);

        // 比较结果（高尔夫中杆数越少越好）
        if ($redValue < $blueValue) {
            $winner = 'red';
        } elseif ($redValue > $blueValue) {
            $winner = 'blue';
        } else {
            $winner = 'draw';
        }

        return [
            'winner' => $winner,
            'redValue' => $redValue,
            'blueValue' => $blueValue
        ];
    }

    /**
     * 计算队伍的指标值
     * @param array $scores 队伍成员的杆数数组
     * @param string $indicatorType 指标类型
     * @return int 指标值
     */
    private function calculateTeamIndicator($scores, $indicatorType) {
        switch ($indicatorType) {
            case 'best':
                // 最好成绩（杆数最少）
                return min($scores);

            case 'worst':
                // 最差成绩（杆数最多）
                return max($scores);

            case 'plus_total':
                // 杆数相加
                return array_sum($scores);

            case 'multiply_total':
                // 杆数相乘
                return array_product($scores);

            case 'average':
                // 平均杆数
                return round(array_sum($scores) / count($scores), 2);

            default:
                // 默认返回最好成绩
                return min($scores);
        }
    }


    private function fixKpis($kpiValues, $totalCalculationType) {

        $fixedKpis = [];

        foreach ($kpiValues as $key => $value) {
            if ($key === 'total') {
                // 将 'total' 替换为 totalCalculationType 的值
                $fixedKpis[$totalCalculationType] = $value;
            } else {
                // 其他键保持不变
                $fixedKpis[$key] = $value;
            }
        }

        return $fixedKpis;
    }
}
