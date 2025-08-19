<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}




class MPoints extends CI_Model {


    public function __construct() {
        parent::__construct();
        $this->load->model('gamble/Indicators/MIndicator8421');
        $this->load->model('gamble/Indicators/MIndicatorLasi');
    }








    public function setWinnerFailerAndPoints(&$hole, $context) {

        $kpiIndicatorRedBlue = $this->summarizeKpiIndicatorsConcise($hole['KPI_INDICATORS']);


        $indicatorBlue = $kpiIndicatorRedBlue['indicatorBlue'];
        $indicatorRed = $kpiIndicatorRedBlue['indicatorRed'];

        // 获取顶洞配置
        $drawConfig = $context->drawConfig;

        // 判断是否为顶洞
        $isDraw = $this->checkHoleDraw($indicatorBlue, $indicatorRed, $drawConfig);

        if ($isDraw) {
            $hole['draw'] = 'y';
        } else {
            $hole['draw'] = 'n';
        }


        $points = abs($indicatorRed);



        if ($indicatorBlue > $indicatorRed) {
            $hole['winner'] = 'blue';
            $hole['failer'] = 'red';
            $hole['debug'][] = "顶洞配置: {$drawConfig}, 蓝队得分: {$indicatorBlue}, 红队得分: {$indicatorRed}, 结果:蓝队获胜";
        }

        if ($indicatorBlue < $indicatorRed) {
            $hole['winner'] = 'red';
            $hole['failer'] = 'blue';
            $hole['debug'][] = "顶洞配置: {$drawConfig}, 蓝队得分: {$indicatorBlue}, 红队得分: {$indicatorRed}, 结果:红队获胜";
        }

        if ($indicatorBlue == $indicatorRed) {
            $hole['winner'] = null;
            $hole['failer'] = null;
            $hole['debug'][] = "顶洞配置: {$drawConfig}, 蓝队得分: {$indicatorBlue}, 红队得分: {$indicatorRed}, 结果:指标一样,无输赢";
        }



        $hole['points_before_kick'] = $points;
        $currentHoleMultiplier = $this->getCurrentHoleMultiplier($hole, $context->kickConfig);


        // 拉丝乘法奖励
        $lasiMultiplyFactor = 1;
        if ($context->RewardConfig['rewardType'] == 'multiply') {

            if ($hole['winner'] == 'red') {
                $score1 = $hole['computedScores'][$hole['red'][0]];
                $score2 = $hole['computedScores'][$hole['red'][1]];
                $lasiMultiplyor = $this->MReward->getMultiplyTypeRewardValue($hole['par'], $score1, $score2, $context->RewardConfig['rewardPair']);
                $lasiMultiplyFactor = $lasiMultiplyor['finalRewardValue'];
            }
            if ($hole['winner'] == 'blue') {
                $score1 = $hole['computedScores'][$hole['blue'][0]];
                $score2 = $hole['computedScores'][$hole['blue'][1]];
                $lasiMultiplyor = $this->MReward->getMultiplyTypeRewardValue($hole['par'], $score1, $score2, $context->RewardConfig['rewardPair']);
                $lasiMultiplyFactor = $lasiMultiplyor['finalRewardValue'];
            }
        }


        $hole['points'] =  $points * $currentHoleMultiplier * $lasiMultiplyFactor;
    }


    public function summarizeKpiIndicatorsConcise(array $indicators): array {
        $totalRed = array_sum(array_column($indicators, 'red'));
        $totalBlue = array_sum(array_column($indicators, 'blue'));

        return [
            'indicatorBlue' => $totalBlue,
            'indicatorRed' => $totalRed,
        ];
    }

    /**
     * 根据顶洞配置判断是否为顶洞
     * @param int $indicatorBlue 蓝队输赢
     * @param int $indicatorRed 红队输赢 
     * @param string $drawConfig 顶洞配置
     * @return bool 是否为顶洞
     */
    private function checkHoleDraw($indicatorBlue, $indicatorRed, $drawConfig) {
        if ($drawConfig == "NoDraw") {
            // 不考虑顶洞,即不产生肉
            return false;
        }

        // 默认情况：完全相等才算顶洞
        if ($drawConfig == "DrawEqual") {
            return $indicatorBlue == 0 && $indicatorRed == 0;
        }

        // 检查是否为 "Diff_x" 格式
        if (preg_match('/^Diff_(\d+)$/', $drawConfig, $matches)) {
            $allowedDiff = (int)$matches[1];
            $actualDiff = abs($indicatorBlue);

            // 差值在允许范围内算顶洞
            return $actualDiff <= $allowedDiff;
        }
    }






    // 得到当前洞的倍数
    private  function getCurrentHoleMultiplier($hole, $kickConfig) {
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
}
