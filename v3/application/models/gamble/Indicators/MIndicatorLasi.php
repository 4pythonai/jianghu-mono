<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MIndicatorLasi extends CI_Model {



    // 拉丝 头,最好成绩
    public function calculateBestIndicators(&$hole, $context, $attenders, $kpiname) {
        $bestWeight = $this->getBestKpWeight($context);
        $redScores = [];
        $blueScores = [];

        foreach ($hole['red'] as $userid) {
            $redScores[] = $hole['computedScores'][$userid];
        }

        // 收集蓝队成绩
        foreach ($hole['blue'] as $userid) {
            $blueScores[] = $hole['computedScores'][$userid];
        }

        $redBestScore   = min($redScores);
        $blueBestScore = min($blueScores);

        if ($redBestScore == $blueBestScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => 0, 'blue' => 0];
        }

        if ($redBestScore  < $blueBestScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => $bestWeight, 'blue' => -$bestWeight];
        }

        if ($redBestScore > $blueBestScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => -$bestWeight, 'blue' => $bestWeight];
        }
    }


    // 尾巴,最差成绩
    public function calculateWorstIndicators(&$hole, $context, $attenders, $kpiname) {
        $worstWeight = $this->getWorstKpWeight($context);
        $redScores = [];
        $blueScores = [];

        foreach ($hole['red'] as $userid) {
            $redScores[] = $hole['computedScores'][$userid];
        }

        // 收集蓝队成绩
        foreach ($hole['blue'] as $userid) {
            $blueScores[] = $hole['computedScores'][$userid];
        }

        $redWorstScore   = max($redScores);
        $blueWorstScore = max($blueScores);

        if ($redWorstScore == $blueWorstScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => 0, 'blue' => 0];
        }

        if ($redWorstScore  < $blueWorstScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => $worstWeight, 'blue' => -$worstWeight];
        }

        if ($redWorstScore > $blueWorstScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => -$worstWeight, 'blue' => $worstWeight];
        }
    }

    // 乘法总`
    public function calculateMultiplyTotalIndicators(&$hole, $context, $attenders, $kpiname) {

        $totalWeight = $this->getTotalKpWeight($context);
        $redScores = [];
        $blueScores = [];

        foreach ($hole['red'] as $userid) {
            $redScores[] = $hole['computedScores'][$userid];
        }

        // 收集蓝队成绩
        foreach ($hole['blue'] as $userid) {
            $blueScores[] = $hole['computedScores'][$userid];
        }

        $redTotalScore   = array_product($redScores);
        $blueTotalScore = array_product($blueScores);

        if ($redTotalScore == $blueTotalScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => 0, 'blue' => 0];
        }

        if ($redTotalScore  < $blueTotalScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => $totalWeight, 'blue' => -$totalWeight];
        }

        if ($redTotalScore > $blueTotalScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => -$totalWeight, 'blue' => $totalWeight];
        }
    }

    // 加法总
    public function calculateAddTotalIndicators(&$hole, $context, $attenders, $kpiname) {

        $totalWeight = $this->getTotalKpWeight($context);
        $redScores = [];
        $blueScores = [];

        foreach ($hole['red'] as $userid) {
            $redScores[] = $hole['computedScores'][$userid];
        }

        // 收集蓝队成绩
        foreach ($hole['blue'] as $userid) {
            $blueScores[] = $hole['computedScores'][$userid];
        }


        $redTotalScore   = array_sum($redScores);
        $blueTotalScore = array_sum($blueScores);

        if ($redTotalScore == $blueTotalScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => 0, 'blue' => 0];
        }

        if ($redTotalScore  < $blueTotalScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => $totalWeight, 'blue' => -$totalWeight];
        }

        if ($redTotalScore > $blueTotalScore) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => -$totalWeight, 'blue' => $totalWeight];
        }
    }

    /// 加法奖励也作为 KPI名称进行计算
    // 奖励前置条件：'total_win' | 'total_not_fail' | 'total_ignore'

    public function calculateAddRewardIndicators(&$hole, $context, $attenders, $kpiname) {


        $rewardPair = $context->RewardConfig['rewardPair'];
        $rewardPreCondition = $context->RewardConfig['rewardPreCondition'];

        $redScores = [];
        $blueScores = [];


        foreach ($hole['red'] as $userid) {
            $redScores[] = $hole['computedScores'][$userid];
        }

        // 收集蓝队成绩
        foreach ($hole['blue'] as $userid) {
            $blueScores[] = $hole['computedScores'][$userid];
        }


        $red_addRewardValue = $this->MReward->getAddTypeRewardValue($hole['par'], $redScores[0], $redScores[1], $rewardPair);
        $blue_addRewardValue = $this->MReward->getAddTypeRewardValue($hole['par'], $blueScores[0], $blueScores[1], $rewardPair);


        // 是否有"总成绩"
        $hasTotalKPI = array_key_exists('add_total', $hole['KPI_INDICATORS']) || array_key_exists('multiply_total', $hole['KPI_INDICATORS']);

        // 没有总成绩,不用考虑条件
        if (!$hasTotalKPI) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => $red_addRewardValue['finalRewardValue'], 'blue' => $blue_addRewardValue['finalRewardValue']];
        }

        if ($hasTotalKPI) {

            $canRedHaveAddReward = $this->MReward->canRedHaveAddReward($hole, $rewardPreCondition);
            $canBluedHaveAddReward = $this->MReward->canBlueHaveAddReward($hole, $rewardPreCondition);
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => $canRedHaveAddReward ? $red_addRewardValue['finalRewardValue'] : 0, 'blue' => $canBluedHaveAddReward ? $blue_addRewardValue['finalRewardValue'] : 0];
        }
    }





    public function getBestKpWeight($context) {
        $weight = $context->kpis['kpiValues']['best'];
        return $weight;
    }

    public function getWorstKpWeight($context) {
        $weight = $context->kpis['kpiValues']['worst'];
        return $weight;
    }

    public function getTotalKpWeight($context) {
        $weight = $context->kpis['kpiValues']['total'];
        return $weight;
    }



    /**
     * 计算拉丝指标
     * @param array $hole 洞数据（引用传递）
     * @param object $context 上下文配置
     */
    public function calculateLasiIndicators(&$hole, $context) {
        $fixedKpis = $this->fixKpis($context);
        $indicatorBlue = 0;
        $indicatorRed = 0;

        foreach ($fixedKpis as $kpi => $value) {
            $_tmp_indicators = $this->compareIndicator($hole, $kpi, $value);
            $hole['tmp_indicators'][$kpi] = $_tmp_indicators;
        }

        $_sumed = $this->sumkPIs($hole['tmp_indicators']);

        debug("各个指标");
        debug($hole['tmp_indicators']);
        // die;
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
    private function compareIndicator($hole, $kpiName, $value) {
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
        $redValue = $this->calculateTeamIndicator($redScores, $kpiName);

        // 计算蓝队指标值
        $blueValue = $this->calculateTeamIndicator($blueScores, $kpiName);

        // 比较结果（高尔夫中杆数越少越好）
        if ($redValue < $blueValue) {
            $winner = 'red';
        } elseif ($redValue > $blueValue) {
            $winner = 'blue';
        } else {
            $winner = 'draw';
        }

        return [
            'kpi' => $kpiName,
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
     * 
     */

    public function fixKpis($context) {


        $kpiValues = $context->kpis['kpiValues'];
        $indicators = $context->kpis['indicators'];
        $totalCalculationType = $context->kpis['totalCalculationType'];

        $tmp = [];

        foreach ($kpiValues as $kpiName => $kpiValue) {
            if (in_array($kpiName, $indicators)) {
                $tmp[$kpiName] = $kpiValue;
            }
        }

        // 加法总/乘法总
        foreach ($tmp as $key => $value) {
            if ($key === 'total') {
                $tmp[$totalCalculationType] = $value;
            }
        }

        unset($tmp['total']); // total 已经修正为  multiply_total or add_total

        // 加法奖励意思是, 红蓝都分别加分,而乘法奖励是实际的奖励
        // 加法奖励必须先算,因为加法奖励会影响输赢,不是拉丝X点某方盈了,
        // 加上奖励后一定还是某方赢
        if ($context->RewardConfig['rewardType'] == 'add') {
            $tmp['add_reward'] = ['rewardPair' => $context->RewardConfig['rewardPair'], 'rewardPreCondition' => $context->RewardConfig['rewardPreCondition']];
        }

        return $tmp;
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

        debug($context);
        die;

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

            // debug($rewardFactor);
            // 最后得分
            $hole['points'] =  $points * $currentHoleMultiplier * $rewardFactor['finalRewardValue'];
            // 因为乘法奖励得到的点数
            $hole['bonus_points'] =  $points * $currentHoleMultiplier * ($rewardFactor['finalRewardValue'] - 1);
        }

        if ($context->RewardConfig['rewardType'] == 'add' && $hole['draw'] == 'n') {
            // debug("加法类型");
            $this->addDebug($hole, "加法奖励: 奖励点数: $rewardFactor");
            $hole['points'] =  $points * $currentHoleMultiplier;
            // $hole['points'] =  $points * $currentHoleMultiplier + $rewardFactor;
            $hole['bonus_points'] =  0;
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
