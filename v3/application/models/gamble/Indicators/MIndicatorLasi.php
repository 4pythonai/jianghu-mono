<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MIndicatorLasi extends CI_Model {



    // 拉丝 头,最好成绩
    public function calculateBestIndicators(&$hole, $context, $attenders, $kpiname) {
        $bestWeight = $this->getBestKpiWeight($context);
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

    /*
     *
     * 
     * 加法奖励也作为 KPI名称进行计算
     * 奖励前置条件：'total_win' | 'total_not_fail' | 'total_ignore'
     * 
     * 
    */

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
            $red_reward = $red_addRewardValue['finalRewardValue'];
            $blue_reward = $blue_addRewardValue['finalRewardValue'];
        }

        if ($hasTotalKPI) {

            $canRedHaveAddReward = $this->MReward->canRedHaveAddReward($hole, $rewardPreCondition);
            $canBluedHaveAddReward = $this->MReward->canBlueHaveAddReward($hole, $rewardPreCondition);

            if ($canRedHaveAddReward) {
                $red_reward = $red_addRewardValue['finalRewardValue'];
            } else {
                $red_reward = 0;
            }

            if ($canBluedHaveAddReward) {
                $blue_reward = $blue_addRewardValue['finalRewardValue'];
            } else {
                $blue_reward = 0;
            }
        }

        $diff = abs($red_reward - $blue_reward);
        if ($red_reward > $blue_reward) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => $diff, 'blue' =>  -1 * $diff];
        }

        if ($red_reward < $blue_reward) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => -1 * $diff, 'blue' => $diff];
        }

        if ($red_reward == $blue_reward) {
            $hole['KPI_INDICATORS'][$kpiname] = ['red' => 0, 'blue' => 0];
        }
    }





    public function getBestKpiWeight($context) {
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
