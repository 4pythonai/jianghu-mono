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


    public function setKpiBranches(&$context) {



        if ($context->gambleSysName == '4p-8421') {
            $branches = ['k8421'];
            $context->kpiBranches = $branches;
        }

        if ($context->gambleSysName == '4p-lasi') {
            $fixedKpis = $this->MIndicatorLasi->fixKpis($context);
            $context->kpiBranches = array_keys($fixedKpis);
        }
    }


    /**
     * 计算洞的指标 (使用上下文对象)
     * @param int $index 洞索引
     * @param array $hole 洞数据（引用传递）
     * @param array $configs 8421配置（可选，用于避免重复获取）
     * @param GambleContext $context 赌球上下文对象
     */
    public function computeIndicators(&$hole,  $context) {
        $this->calculateKPIs($hole, $context);
    }


    public function calculateKPIs(&$hole, $context) {

        $kpiBranches = $context->kpiBranches;
        $attenders = $context->attenders;
        $hole['KPI_INDICATORS'] = [];

        // [gambleSysName] => 4p-8421

        foreach ($kpiBranches as $kpiname) {

            // debug("AAAAAAAAA" . $kpiname);

            if ($context->gambleSysName == '4p-8421' && $kpiname == 'k8421') {
                $this->MIndicator8421->calculateTeam8421Indicators($hole, $context, $attenders, $kpiname);
            }

            if ($context->gambleSysName == '4p-lasi' && $kpiname == 'best') {
                $this->MIndicatorLasi->calculateBestIndicators($hole, $context, $attenders, $kpiname);
            }

            if ($context->gambleSysName == '4p-lasi' && $kpiname == 'worst') {
                $this->MIndicatorLasi->calculateWorstIndicators($hole, $context, $attenders, $kpiname);
            }

            // multiply_total
            if ($context->gambleSysName == '4p-lasi' && $kpiname == 'multiply_total') {
                $this->MIndicatorLasi->calculateMultiplyTotalIndicators($hole, $context, $attenders, $kpiname);
            }

            // add_total
            if ($context->gambleSysName == '4p-lasi' && $kpiname == 'add_total') {
                $this->MIndicatorLasi->calculateAddTotalIndicators($hole, $context, $attenders, $kpiname);
            }

            // add_reward,加法奖励,这是额外添加的kpi
            if ($context->gambleSysName == '4p-lasi' && $kpiname == 'add_reward') {
                $this->MIndicatorLasi->calculateAddRewardIndicators($hole, $context, $attenders, $kpiname);
            }
        }
    }
}
