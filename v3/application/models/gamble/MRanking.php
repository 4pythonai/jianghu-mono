<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

/**
 * 
 * 排名的返回格式:
 * [ranking] => Array
 * (
 *     [1] => 93
 *     [2] => 160
 *     [3] => 185
 *     [4] => 67
 * )
 */

class MRanking extends CI_Model {

    public function __construct() {
        parent::__construct();
        // 加载不同人数的排名模型
        $this->load->model('gamble/MRankingP2');
        $this->load->model('gamble/MRankingP3');
        $this->load->model('gamble/MRankingP4');
    }

    /**
     * 对参赛者进行排名，不允许并列 (使用上下文对象)
     * @param array $hole 当前洞的数据 (包含indicators)   
     * @param int $holeIndex 当前洞的索引
     * @param GambleContext $context 赌球上下文对象
     * @return array 排名结果 [rank => userid]
     */
    public function rankAttendersWithContext($holeIndex, &$hole, $context) {


        if (count($context->attenders) == 2) {
            $hole['ranking'] = $this->MRankingP2->rankAttenders($context);
        }

        if (count($context->attenders) == 3) {
            $hole['ranking'] = $this->MRankingP3->rankAttenders($context);
        }

        if (count($context->attenders) == 4) {
            $hole['ranking'] = $this->MRankingP4->rankAttenders($holeIndex, $hole, $context);
        }
    }
}
