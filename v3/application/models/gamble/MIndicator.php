<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MIndicator extends CI_Model {


    public function __construct() {
        parent::__construct();
        $this->load->model('gamble/Indicators/MIndicator8421');
    }

    /**
     * 计算洞的指标 (使用上下文对象)
     * @param int $index 洞索引
     * @param array $hole 洞数据（引用传递）
     * @param array $configs 8421配置（可选，用于避免重复获取）
     * @param GambleContext $context 赌球上下文对象
     */
    public function computeIndicators($index, &$hole, $configs = null, $context) {
        if ($context->gambleSysName == '8421') {
            $this->calculate8421Indicators($index, $hole, $configs);
        }
    }

    /**
     * 计算8421指标
     * @param int $index 洞索引
     * @param array $hole 洞数据（引用传递）
     * @param array $configs 8421配置
     */
    private function calculate8421Indicators($index, &$hole, $configs) {
        $val8421_config = $configs['val8421_config'];
        $sub8421ConfigString = $configs['sub8421ConfigString'];
        $max8421SubValue = $configs['max8421SubValue'];

        $indicatorBlue = 0;
        $indicatorRed = 0;

        // 处理红队
        foreach ($hole['red'] as $userid) {
            $userAddConfigPair = $val8421_config[$userid];
            $_8421_add_sub_max_config = [
                'add' => $userAddConfigPair,
                'sub' => $sub8421ConfigString,
                'max' => $max8421SubValue,
            ];

            $indicator = $this->OnePlayer8421Indicator($hole['par'], $hole['computedScores'][$userid], $_8421_add_sub_max_config);

            $logMsg = sprintf(
                "第 %s 洞,红队,队员:%4d,PAR:%d,分值:%2d,指标:%2d",
                $hole['id'],
                $userid,
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
            $userAddConfigPair = $val8421_config[$userid];
            $_8421_add_sub_max_config = [
                'add' => $userAddConfigPair,
                'sub' => $sub8421ConfigString,
                'max' => $max8421SubValue,
            ];

            $indicator = $this->OnePlayer8421Indicator($hole['par'], $hole['computedScores'][$userid], $_8421_add_sub_max_config);

            $logMsg = sprintf(
                "第 %s 洞,蓝队,队员:%4d,PAR:%d,分值:%2d,指标:%2d",
                $hole['id'],
                $userid,
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

    // 当规则配置里有"加三"的扣分设置时，以得分项优先,即:即如果根据配置,一个人的成绩在配置项有,冲突, 有正有负,以正分为准, 有0有负,以负分为准.

    public function OnePlayer8421Indicator($par, $userComputedScore, $_8421_add_sub_max_config) {

        $add_value = $this->MIndicator8421->get8421AddValue($par, $userComputedScore, $_8421_add_sub_max_config['add']);
        $sub_value = $this->MIndicator8421->get8421SubValue($par, $userComputedScore, $_8421_add_sub_max_config['sub'], $_8421_add_sub_max_config['max']);

        // 有正有0,以正份为准
        if ($add_value > 0 && abs($sub_value) == 0) {
            return  $add_value;
        }

        // 有正有负,以正份为准
        if ($add_value > 0 && abs($sub_value) > 0) {
            return  $add_value;
        }

        //  有0有负,以负分为准.
        if ($add_value == 0 && abs($sub_value) > 0) {
            return  $sub_value;
        }
    }

    public function judgeWinner(&$hole, $context) {


        $indicatorBlue = $hole['indicatorBlue'];
        $indicatorRed = $hole['indicatorRed'];

        if ($indicatorBlue == $indicatorRed) {
            $hole['draw'] = 'y';
            $hole['winner'] = null;
            $hole['failer'] = null;
        }

        if ($indicatorBlue > $indicatorRed) {
            $hole['draw'] = 'n';
            $hole['winner'] = 'blue';
            $hole['failer'] = 'red';
        } else if ($indicatorRed > $indicatorBlue) {
            $hole['draw'] = 'n';
            $hole['winner'] = 'red';
            $hole['failer'] = 'blue';
        }

        $points = abs($indicatorBlue - $indicatorRed);
        $hole['points'] = $points;
    }
}
