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
        $rewardFactor = $this->getLassiRewardFactor($hole, $context);

        $hole['points'] =  $points * $currentHoleMultiplier;
    }

    public function getLassiRewardFactor($hole, $context) {
        debug("+++++++++++++++++++++++++++++++++++");
        if ($hole['draw'] == 'y') {
            return 1;
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

        debug($winner_side_scores);

        debug($context->RewardConfig);
        die;




        debug($hole);
        $rewardFactor = 1;
        debug($context);
        $rewardFactorConfig = $context->RewardConfig;
        debug($rewardFactorConfig);

        return $rewardFactor;
    }


    private function tmp001($par, $bestScores, $rewardPair) {

        // $par=4;
        //         $bestScores=      Array
        // (
        //     [0] => 1
        //     [1] => 4
        // )

        //     $rewardPair => Array
        //         (
        //             [0] => Array
        //                 (
        //                     [scoreName] => Par
        //                     [rewardValue] => 1
        //                 )

        //             [1] => Array
        //                 (
        //                     [scoreName] => Birdie
        //                     [rewardValue] => 2
        //                 )

        //             [2] => Array
        //                 (
        //                     [scoreName] => Eagle
        //                     [rewardValue] => 4
        //                 )

        //             [3] => Array
        //                 (
        //                     [scoreName] => Albatross/HIO
        //                     [rewardValue] => 10
        //                 )

        //             [4] => Array
        //                 (
        //                     [scoreName] => Birdie+Birdie
        //                     [rewardValue] => 4
        //                 )

        //             [5] => Array
        //                 (
        //                     [scoreName] => Birdie+Eagle
        //                     [rewardValue] => 8
        //                 )

        //             [6] => Array
        //                 (
        //                     [scoreName] => Eagle+Eagle
        //                     [rewardValue] => 16
        //                 )

        //         )

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
