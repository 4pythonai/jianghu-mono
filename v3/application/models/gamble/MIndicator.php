<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MIndicator extends CI_Model {


    public function __construct() {
        parent::__construct();
        $this->load->model('gamble/Indicators/MIndicator8421');
    }



    // 当规则配置里有”加三“的扣分设置时，以得分项优先,即:即如果根据配置,一个人的成绩在配置项有,冲突, 有正有负,以正分为准, 有0有负,以负分为准.

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

    public function judgeWinner(&$hole) {


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
