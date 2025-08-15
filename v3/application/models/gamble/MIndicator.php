<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MIndicator extends CI_Model {


    public function __construct() {
        parent::__construct();
        $this->load->model('gamble/Indicators/MIndicator8421');
        $this->load->model('gamble/Indicators/MIndicatorLasi');
    }

    /**
     * 计算洞的指标 (使用上下文对象)
     * @param int $index 洞索引
     * @param array $hole 洞数据（引用传递）
     * @param array $configs 8421配置（可选，用于避免重复获取）
     * @param GambleContext $context 赌球上下文对象
     */
    public function computeIndicators($index, &$hole,  $context) {
        if ($context->gambleSysName == '4p-8421') {
            $this->MIndicator8421->calculate8421Indicators($hole, $context);
        }

        if ($context->gambleSysName == '4p-lasi') {
            $this->MIndicatorLasi->calculateLasiIndicators($hole, $context);
        }
    }


    public function setWinFailPoints(&$hole, $context) {
        if ($context->gambleSysName == '4p-8421') {
            $this->set8421WinFailPoints($hole, $context);
        }
        if ($context->gambleSysName == '4p-lasi') {
            $this->setLasiWinFailPoints($hole, $context);
        }
    }



    public function set8421WinFailPoints(&$hole, $context) {
        // debug("设置输赢:setWinFailPoints" . $context->gambleSysName);

        $indicatorBlue = $hole['indicatorBlue'];
        $indicatorRed = $hole['indicatorRed'];

        // 获取顶洞配置
        $drawConfig = $context->drawConfig;

        // 判断是否为顶洞
        $isDraw = $this->checkDraw($indicatorBlue, $indicatorRed, $drawConfig);

        if ($isDraw) {
            $hole['draw'] = 'y';
        } else {
            $hole['draw'] = 'n';
        }

        $points = abs($indicatorBlue - $indicatorRed);

        if ($indicatorBlue > $indicatorRed) {
            $hole['winner'] = 'blue';
            $hole['failer'] = 'red';
            $hole['debug'][] = "顶洞配置: {$drawConfig}, 蓝队指标: {$indicatorBlue}, 红队指标: {$indicatorRed}, 结果:蓝队获胜";
        }

        if ($indicatorBlue < $indicatorRed) {
            $hole['winner'] = 'red';
            $hole['failer'] = 'blue';
            $hole['debug'][] = "顶洞配置: {$drawConfig}, 蓝队指标: {$indicatorBlue}, 红队指标: {$indicatorRed}, 结果:红队获胜";
        }

        if ($indicatorBlue == $indicatorRed) {
            $hole['winner'] = null;
            $hole['failer'] = null;
            $hole['debug'][] = "顶洞配置: {$drawConfig}, 蓝队指标: {$indicatorBlue}, 红队指标: {$indicatorRed}, 结果:指标一样,无输赢";
        }



        $hole['points_before_kick'] = $points;
        $currentHoleMultiplier = $this->getCurrentHoleMultiplier($hole, $context->kickConfig);

        $hole['points'] =  $points * $currentHoleMultiplier;
        // debug($hole);
        // die;
    }

    public function setLasiWinFailPoints(&$hole, $context) {
        // debug("设置输赢:setWinFailPoints" . $context->gambleSysName);


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


        $hole['points_before_kick'] = $points;
        $currentHoleMultiplier = $this->getCurrentHoleMultiplier($hole, $context->kickConfig);
        $rewardFactor = $this->getLassiRewardFactor($hole, $context->RewardConfig);

        if ($context->RewardConfig['rewardType'] == 'multiply') {
            $hole['points'] =  $points * $currentHoleMultiplier * $rewardFactor;
        }

        if ($context->RewardConfig['rewardType'] == 'add') {
            $hole['points'] =  $points * $currentHoleMultiplier + $rewardFactor;
        }
    }

    public function getLassiRewardFactor(&$hole, $RewardConfig) {


        return 1;

        if ($hole['draw'] == 'y') {
            if ($RewardConfig['rewardType'] == 'multiply') {
                return 1;
            }
            if ($RewardConfig['rewardType'] == 'add') {
                return 0;
            }
        }

        $winner_side_scores = [];

        //赢家的两个杆数
        if ($hole['winner'] == 'blue') {
            $winner_side_scores[] = $hole['computedScores'][$hole['blue'][0]];
            $winner_side_scores[] = $hole['computedScores'][$hole['blue'][1]];
        }

        if ($hole['winner'] == 'red') {
            $winner_side_scores[] = $hole['computedScores'][$hole['red'][0]];
            $winner_side_scores[] = $hole['computedScores'][$hole['red'][1]];
        }


        $tmp = $this->findRewardValue($hole['par'], $winner_side_scores, $RewardConfig['rewardPair']);
        $hole['debug'][] = "奖励倍数: $tmp";

        return $tmp;
    }




    private function getScoreName($par, $score) {
        // HIO (一杆进洞) 是最特殊的情况，优先判断
        if ($score === 1) {
            return 'Albatross/HIO';
        }

        $diff = $score - $par;

        switch ($diff) {
            case -3:
                return 'Albatross/HIO'; // 例如 Par 5 打 2 杆
            case -2:
                return 'Eagle';
            case -1:
                return 'Birdie';
            case 0:
                return 'Par';
            default:
                return null; // 对于 Bogey 或更高杆数，没有特殊奖励名称
        }
    }

    private function findRewardValue($par, $bestScores, $rewardPair) {
        // 1. 为了方便快速查找，将奖励配置转换为一个以 scoreName 为键的映射数组
        $rewardMap = [];
        foreach ($rewardPair as $reward) {
            $rewardMap[$reward['scoreName']] = $reward['rewardValue'];
        }

        // 2. 算法第一步：根据最好成绩（最小杆数）来寻找 rewardValue
        if (!empty($bestScores)) {
            $minScore = min($bestScores);
            $bestScoreName = $this->getScoreName($par, $minScore);

            // 如果找到了对应的得分名称，并且该名称存在于奖励配置中
            if ($bestScoreName !== null && isset($rewardMap[$bestScoreName])) {
                return $rewardMap[$bestScoreName]; // 找到，立即返回
            }
        }

        // 3. 算法第二步：如果最好成绩没找到，则在组合配置里面寻找
        //    (假设组合总是由两个分数构成)
        if (count($bestScores) >= 2) {
            $scoreName1 = $this->getScoreName($par, $bestScores[0]);
            $scoreName2 = $this->getScoreName($par, $bestScores[1]);

            // 确保两个分数都能转换为有效的得分名称
            if ($scoreName1 && $scoreName2) {
                // 将名称排序以确保组合键的一致性 (例如 "Birdie+Eagle" 和 "Eagle+Birdie" 是同一种)
                $comboNames = [$scoreName1, $scoreName2];
                sort($comboNames);
                $comboKey = implode('+', $comboNames);

                if (isset($rewardMap[$comboKey])) {
                    return $rewardMap[$comboKey]; // 找到组合奖励，返回
                }
            }
        }

        // 4. 如果以上都没有找到，返回默认值 1
        return 1;
    }


    // 得到当前洞的倍数
    private function getCurrentHoleMultiplier($hole, $kickConfig) {
        // return 3;

        // 如果 kickConfig 为 null，直接返回1
        if ($kickConfig === null) {
            return 1;
        }

        $currentHoleMultiplier = 1; // 默认值为1
        foreach ($kickConfig as $kickConfig) {
            if ($kickConfig['hindex'] == $hole['hindex']) {
                $currentHoleMultiplier = $kickConfig['multiplier'];
                break;
            }
        }
        return $currentHoleMultiplier;
    }



    /**
     * 根据顶洞配置判断是否为顶洞
     * @param int $indicatorBlue 蓝队指标
     * @param int $indicatorRed 红队指标  
     * @param string $drawConfig 顶洞配置
     * @return bool 是否为顶洞
     */
    private function checkDraw($indicatorBlue, $indicatorRed, $drawConfig) {
        if ($drawConfig == "NoDraw") {
            // 不考虑顶洞，只有完全相等才算顶洞
            return false;
        }

        // 默认情况：完全相等才算顶洞
        if ($drawConfig == "DrawEqual") {
            return $indicatorBlue == $indicatorRed;
        }

        // 检查是否为 "Diff_x" 格式
        if (preg_match('/^Diff_(\d+)$/', $drawConfig, $matches)) {
            $allowedDiff = (int)$matches[1];
            $actualDiff = abs($indicatorBlue - $indicatorRed);

            // 差值在允许范围内算顶洞
            return $actualDiff <= $allowedDiff;
        }
    }
}
