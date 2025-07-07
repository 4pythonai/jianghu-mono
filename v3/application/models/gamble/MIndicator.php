<?php

declare(strict_types=1);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MIndicator extends CI_Model {

    public function calOnePlayer8421Indicator($par, $userComputedScore, $val8421) {
        // 计算成绩与标准杆的差值
        $scoreDiff = $userComputedScore - $par;

        // 首先处理特殊情况：双倍标准杆及以上
        if ($userComputedScore >= $par * 2) {
            return ($userComputedScore == $par * 2) ? $val8421['DoublePar'] : $val8421['DoublePar+1'];
        }

        // 处理成绩太好的情况（比Eagle还好）
        if ($scoreDiff <= -2) {
            return $val8421['Eagle'];  // 使用Eagle的分值16
        }

        // 根据差值映射成绩类型
        // 于标准杆差值--名称
        $scoreTypeMap = [
            -1 => 'Birdie',     // 小鸟球
            0  => 'Par',        // 标准杆
            1  => 'Bogey',      // 柏忌
            2  => 'DoubleBogey', // 双柏忌
            3  => 'TripleBogey', // 三柏忌
        ];

        // 查找对应的成绩类型，如果找不到（成绩太差），使用TripleBogey
        $scoreType = $scoreTypeMap[$scoreDiff] ?? 'TripleBogey';
        return $val8421[$scoreType];
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
