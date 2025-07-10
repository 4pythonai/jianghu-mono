<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MIndicator8421 extends CI_Model {



    /**
     * 计算8421加分值
     * 
     * 基础分值表：
     * Par+2(双柏忌) => 1分
     * Par+1(柏忌)   => 2分  
     * Par(标准杆)   => 4分
     * Birdie(小鸟) => 8分
     * 
     * 更好成绩规则：比Birdie少N杆，分值 = 8 * (2^N)
     * 更差成绩规则：比Par+2多1杆及以上，分值 = 0
     * 
     * @param int $par 标准杆数
     * @param int $score 实际成绩
     * @param array $userConfig 用户配置(暂未使用)
     * @return int 8421指标值(不会为负数)
     */
    public function get8421AddValue($par, $score, $userConfig) {
        // 计算相对于Par的差值 (负数表示低于标准杆，正数表示高于标准杆)
        $diffFromPar = $score - $par;

        // 基础分值映射表
        $baseScores = [
            2  => 1,    // Par+2 => 1分
            1  => 2,    // Par+1 => 2分  
            0  => 4,    // Par   => 4分
            -1 => 8,    // Birdie => 8分
        ];

        // 情况1: 基础分值表中有直接映射
        if (isset($baseScores[$diffFromPar])) {
            return $baseScores[$diffFromPar];
        }

        // 情况2: 比Birdie更好的成绩 (Eagle, Albatross等)
        if ($diffFromPar < -1) {
            $betterThanBirdie = abs($diffFromPar + 1); // 比Birdie好多少杆
            return 8 * pow(2, $betterThanBirdie);
        }

        // 情况3: 比Par+2更差的成绩
        if ($diffFromPar > 2) {
            return 0; // 太差了，没有分值
        }

        // 兜底情况，理论上不应该到达这里
        return 0;
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
