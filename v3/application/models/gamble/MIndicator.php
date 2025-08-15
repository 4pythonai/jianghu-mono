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
            $this->MIndicator8421->set8421WinFailPoints($hole, $context);
        }
        if ($context->gambleSysName == '4p-lasi') {
            $this->MIndicatorLasi->setLasiWinFailPoints($hole, $context);
        }
    }




    // 得到当前洞的倍数
    public  function getCurrentHoleMultiplier($hole, $kickConfig) {
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
    public function checkDraw($indicatorBlue, $indicatorRed, $drawConfig) {
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
