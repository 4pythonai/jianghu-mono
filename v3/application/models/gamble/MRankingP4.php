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

class MRankingP4 extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    /**
     * 4人排名
     * @param int $holeIndex 当前洞的索引
     * @param array $hole 当前洞的数据
     * @param GambleContext $context 赌球上下文对象
     * @return array 排名结果 [rank => userid]
     */
    public function rankAttenders($holeIndex, &$hole, $context) {
        debug($context->gambleSysName . "/" . $context->redBlueConfig . " 开始4人排名计算");

        // 目前先返回固定顺序 (根据 bootStrapOrder )

        if ($context->redBlueConfig == "4_乱拉") {
            $ranking = [];
            return $ranking;
        }
    }
}
