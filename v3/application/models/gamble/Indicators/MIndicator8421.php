<?php

declare(strict_types=1);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MIndicator8421 extends CI_Model {



    // 计算加分值
    public function get8421AddValue($par, $score, $userConfig) {
        // 检查用户是否在配置中
        if (!isset($userConfig)) {
            return 0;
        }

        $difference = $score - $par;

        // 差值与成绩类型的映射表
        $scoreTypeMap = [
            -2 => 'Eagle',
            -1 => 'Birdie',
            0  => 'Par',
            1  => 'Par+1',
            2  => 'Par+2',
            3  => 'Par+3'
        ];

        // 处理老鹰球或更好的情况（差值小于等于-2）
        if ($difference <= -2) {
            $scoreType = 'Eagle';
        } else {
            $scoreType = $scoreTypeMap[$difference] ?? null;
        }

        // 返回对应的加分，如果没有配置则返回0
        return isset($userConfig[$scoreType]) ? $userConfig[$scoreType] : 0;
    }


    // 8421 减分配置,公共的,不特定针对某个用户,
    // 从XXX开始扣分意思是扣1分,成绩再差点,扣2分,再差,扣3分 

    public function get8421SubValue($par, $score, $configString, $maxSubValue) {

        // 不扣分,直接返回 0 
        if ($configString == "NoSub") {
            return 0;
        }

        $subVal = 0;

        // 解析配置字符串，计算阈值
        $threshold = $this->parseConfigString($par, $configString);

        // 如果分数小于阈值，不扣分
        if ($score < $threshold) {
            $subVal = 0;
            return $subVal;
        }

        // 如果分数等于阈值，扣1分
        if ($score == $threshold) {
            $subVal = -1;
            return $subVal;
        }

        // 如果分数大于阈值，除了基础扣1分，每超过1分再扣1分
        $overScore = $score - $threshold;
        $subVal = -1 - $overScore;
        if ($subVal < -1 * $maxSubValue) {
            $subVal = -1 * $maxSubValue;
        }
        return $subVal;
    }

    /**
     * 解析配置字符串，计算实际阈值
     * 
     * @param int $par 标准杆数
     * @param string $configString 配置字符串
     * @return int 计算出的阈值
     */
    private function parseConfigString($par, $configString) {
        if (strpos($configString, 'DoublePar') !== false) {
            // 处理 DoublePar 相关配置
            $basePar = 2 * $par;
            if (strpos($configString, '+') !== false) {
                $parts = explode('+', $configString);
                $addition = (int)$parts[1];
                return $basePar + $addition;
            } else {
                return $basePar;
            }
        } elseif (strpos($configString, 'Par') !== false) {
            // 处理 Par 相关配置
            $basePar = $par;
            if (strpos($configString, '+') !== false) {
                $parts = explode('+', $configString);
                $addition = (int)$parts[1];
                return $basePar + $addition;
            } else {
                return $basePar;
            }
        }

        // 默认返回标准杆
        return  0;
    }
}
