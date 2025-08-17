<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MIndicatorLasi extends CI_Model {

    /**
     * 计算拉丝指标
     * @param array $hole 洞数据（引用传递）
     * @param object $context 上下文配置
     */
    public function calculateLasiIndicators(&$hole, $context) {
        $fixedKpis = $this->fixKpis($context->kpis['kpiValues'], $context->kpis['totalCalculationType']);
        $indicatorBlue = 0;
        $indicatorRed = 0;

        foreach ($fixedKpis as $kpi => $value) {
            $_tmp_indicators = $this->compareIndicator($hole, $kpi, $value);
            $hole['tmp_indicators'][$kpi] = $_tmp_indicators;
        }

        $_sumed = $this->sumkPIs($hole['tmp_indicators']);

        // debug("各个指标");
        // debug($hole['tmp_indicators']);
        // debug($_sumed);


        $hole['indicators'] = $_sumed;
        unset($hole['tmp_indicators']);

        $hole['indicatorBlue'] = $indicatorBlue;
        $hole['indicatorRed'] = $indicatorRed;
    }



    /**
     * 比较指定指标的双方成绩
     * @param array $hole 洞数据
     * @param string $indicatorType 指标类型 (best, worst, add_total, multiply_total等)
     * @return array 比较结果 ['winner' => 'red'|'blue'|'draw', 'redValue' => int, 'blueValue' => int]
     */
    private function compareIndicator($hole, $indicatorType, $value) {
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
            'kpi' => $indicatorType,
            'redValue' => $redValue,
            'blueValue' => $blueValue,
            'winner' => $winner,
            'subPoints' => $winner === 'draw' ? 0 : $value
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

            case 'add_total':
                // 杆数相加
                return array_sum($scores);

            case 'multiply_total':
                // 杆数相乘
                return array_product($scores);
        }
    }

    /**
     * 修复KPI配置，将'total'替换为具体的计算类型
     * @param array $kpiValues KPI值配置
     * @param string $totalCalculationType 总计算类型
     * @return array 修复后的KPI配置
     */
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


    /**
     * 汇总所有KPI指标，计算最终得分和输赢
     * @param array $tmp_indicators 临时指标数组
     * @return array 汇总结果 ['winner' => 'blue'|'red'|'draw', 'bluePoints' => int, 'redPoints' => int]
     */
    private function sumkPIs($tmp_indicators) {
        $bluePoints = 0;
        $redPoints = 0;

        foreach ($tmp_indicators as $indicator) {
            $winner = $indicator['winner'];
            $subPoints = $indicator['subPoints'];

            // 每个指标：赢方得X分，输方得0分
            switch ($winner) {
                case 'blue':
                    $bluePoints += $subPoints;  // 蓝队赢，得X分
                    $redPoints += 0;            // 红队输，得0分
                    break;
                case 'red':
                    $redPoints += $subPoints;   // 红队赢，得X分
                    $bluePoints += 0;           // 蓝队输，得0分
                    break;
                case 'draw':
                    // 平局双方都不得分
                    $bluePoints += 0;
                    $redPoints += 0;
                    break;
            }
        }

        // 判断最终输赢：得分高者获胜
        if ($bluePoints > $redPoints) {
            $winner = 'blue';
            $blueFinalPoints = $bluePoints;
            $redFinalPoints = $redPoints;
            $difference = $bluePoints - $redPoints;
        } elseif ($redPoints > $bluePoints) {
            $winner = 'red';
            $blueFinalPoints = $bluePoints;
            $redFinalPoints = $redPoints;
            $difference = $redPoints - $bluePoints;
        } else {
            $winner = 'draw';
            $blueFinalPoints = $bluePoints;
            $redFinalPoints = $redPoints;
            $difference = 0;
        }

        return [
            'winner' => $winner,
            'bluePoints' => $blueFinalPoints,
            'redPoints' => $redFinalPoints,
            'difference' => $difference
        ];
    }


    public function setLasiWinFailPoints(&$hole, $context) {

        if ($hole['indicators']['winner'] == 'draw') {
            $hole['draw'] = 'y';
        } else {
            $hole['draw'] = 'n';
        }

        $points = abs($hole['indicators']['difference']);

        if ($hole['indicators']['winner'] == 'blue') {
            $hole['winner'] = 'blue';
            $hole['failer'] = 'red';
        }


        if ($hole['indicators']['winner'] == 'red') {
            $hole['winner'] = 'red';
            $hole['failer'] = 'blue';
        }

        if ($hole['draw'] == 'y') {
            $hole['winner'] = null;
            $hole['failer'] = null;
            $hole['points'] = 0;
        }




        $hole['points_before_kick'] = $points;
        $currentHoleMultiplier = $this->MIndicator->getCurrentHoleMultiplier($hole, $context->kickConfig);

        // debug("奖励属性");
        // debug($context->RewardConfig);
        // die;

        // 乘法奖励,只考虑赢方的倍数

        $rewardFactor = 1;

        if ($context->RewardConfig['rewardType'] == 'multiply'  && $hole['draw'] == 'n') {

            if ($hole['winner'] == 'blue') {
                $score1 = $hole['computedScores'][$hole['blue'][0]];
                $score2 = $hole['computedScores'][$hole['blue'][1]];
            }
            if ($hole['winner'] == 'red') {
                $score1 = $hole['computedScores'][$hole['red'][0]];
                $score2 = $hole['computedScores'][$hole['red'][1]];
            }
            $this->load->model('gamble/MReward');
            $rewardFactor = $this->MReward->getRewardFactor($hole['par'], $score1, $score2, $context->RewardConfig['rewardPair'], $context->RewardConfig['rewardType']);
            debug($rewardFactor);
            die;



            $hole['points'] =  $points * $currentHoleMultiplier * $rewardFactor;
            $hole['bonus_points'] =  $points * $currentHoleMultiplier * ($rewardFactor - 1);
        }

        if ($context->RewardConfig['rewardType'] == 'add' && $hole['draw'] == 'n') {
            // debug("加法类型");
            $this->addDebug($hole, "加法奖励: 奖励点数: $rewardFactor");
            $hole['points'] =  $points * $currentHoleMultiplier + $rewardFactor;
            $hole['bonus_points'] =  $rewardFactor;
        }
    }




    /**
     * 添加调试信息 - 统一调试信息处理
     * @param array $hole 洞数据（通过引用传递）
     * @param string $message 调试信息
     */
    private function addDebug(&$hole, $message) {
        if (!isset($hole['debug'])) {
            $hole['debug'] = [];
        }
        $hole['debug'][] = $message;
    }
}
