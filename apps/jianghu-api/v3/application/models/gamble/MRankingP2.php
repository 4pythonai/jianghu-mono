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

class MRankingP2 extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    /**
     * 2人排名
     * @param int $holeIndex 当前洞的索引
     * @param array $hole 当前洞的数据
     * @param GambleContext $context 赌球上下文对象
     * @return array 排名结果 [rank => userid]
     */
    public function rankAttenders($context) {
        debug("开始2人排名计算");
        $attenders = $context->attenders;
        $ranking = [];
        $ranking[1] = $attenders[0];
        $ranking[2] = $attenders[1];
        return $ranking;
    }
}
