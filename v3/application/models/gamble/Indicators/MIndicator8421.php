<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MIndicator8421 extends CI_Model {


    public function get8421AddSubMaxConfig($context, $playerId) {
        $sub8421ConfigString =  $context->badScoreBaseLine;
        $max8421SubValue = $context->badScoreMaxLost;
        $userAddConfigPair = $context->playerIndicatorConfig[$playerId];
        $_8421_add_sub_max_config = [
            'add' => $userAddConfigPair,
            'sub' => $sub8421ConfigString,
            'max' => $max8421SubValue,
        ];

        return $_8421_add_sub_max_config;
    }




    /**
     * 计算红蓝队的8421指标
     * 
     * @param array &$hole 球洞数据
     * @param object $context 上下文对象
     * @param array $attenders 参与者列表
     * @param string $kpiname KPI名称
     */
    public function calculateTeam8421Indicators(&$hole, $context, $attenders, $kpiname) {
        $ind_blue = 0;
        $ind_red = 0;

        foreach ($attenders as $attender) {
            $_8421_add_sub_max_config = $this->get8421AddSubMaxConfig($context, $attender);
            $indicator = $this->OnePlayer8421Indicator($hole['par'], $hole['computedScores'][$attender], $_8421_add_sub_max_config);

            if (in_array($attender, $hole['blue'])) {
                $ind_blue += $indicator;
            }

            if (in_array($attender, $hole['red'])) {
                $ind_red += $indicator;
            }
        }

        $hole['KPI_INDICATORS'][$kpiname]['red'] = $ind_red;
        $hole['KPI_INDICATORS'][$kpiname]['blue'] = $ind_blue;
    }




    // 当规则配置里有"加三"的扣分设置时，以得分项优先,即:即如果根据配置,一个人的成绩在配置项有,冲突, 有正有负,以正分为准, 有0有负,以负分为准.

    public function OnePlayer8421Indicator($par, $userComputedScore, $_8421_add_sub_max_config) {

        $add_value = $this->get8421AddValue($par, $userComputedScore, $_8421_add_sub_max_config['add']);
        $sub_value = $this->get8421SubValue($par, $userComputedScore, $_8421_add_sub_max_config['sub'], $_8421_add_sub_max_config['max']);

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



    /**
     * 计算8421加分值
     * 
     * 直接使用用户配置的分值表：
     * 根据 $userConfig 中的配置来计算分值，如：
     * Par+2(双柏忌) => 配置值
     * Par+1(柏忌)   => 配置值  
     * Par(标准杆)   => 配置值
     * Birdie(小鸟) => 配置值
     * 
     * 更好成绩规则：比Birdie少N杆，分值 = Birdie配置值 * (2^N)
     * 更差成绩规则：比Par+2多1杆及以上，分值 = 0
     * 
     * @param int $par 标准杆数
     * @param int $score 实际成绩
     * @param array $userConfig 用户配置分值表
     * @return int 8421指标值(不会为负数)
     */
    public function get8421AddValue($par, $score, $userConfig) {

        // 计算相对于Par的差值 (负数表示低于标准杆，正数表示高于标准杆)
        $diffFromPar = $score - $par;

        // 将差值转换为配置键名
        $configKey = $this->diffToConfigKey($diffFromPar);

        // 情况1: 配置中有直接映射
        if (isset($userConfig[$configKey])) {
            return $userConfig[$configKey];
        }

        // 情况2: 比Birdie更好的成绩 (Eagle, Albatross等)
        if ($diffFromPar < -1) {
            $betterThanBirdie = abs($diffFromPar + 1); // 比Birdie好多少杆
            $birdieScore = $userConfig['Birdie'] ?? 8; // 获取Birdie的配置分值，默认8
            $result = $birdieScore * pow(2, $betterThanBirdie);
            return $result;
        }

        // 情况3: 比配置中最差成绩更差的情况
        if ($diffFromPar > 2) {
            // debug("成绩太差(Par+{$diffFromPar})，返回0分");
            return 0; // 太差了，没有分值
        }

        // 兜底情况，理论上不应该到达这里
        // debug("未找到匹配的配置，返回0分");
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

        // 如果分数等于阈值, 扣1分
        if ($score == $threshold) {
            $subVal = -1;
            return $subVal;
        }

        // 如果分数大于阈值 , 除了基础扣1分 , 每超过1分再扣1分
        $overScore = $score - $threshold;
        $subVal = -1 - $overScore;
        if ($subVal < -1 * $maxSubValue) {
            $subVal = -1 * $maxSubValue;
        }
        return $subVal;
    }

    /**
     * 将杆数差值转换为配置键名
     * @param int $diffFromPar 相对于Par的差值
     * @return string 配置键名
     */
    private function diffToConfigKey($diffFromPar) {
        if ($diffFromPar == 0) {
            return 'Par';
        } elseif ($diffFromPar == -1) {
            return 'Birdie';
        } elseif ($diffFromPar > 0) {
            return 'Par+' . $diffFromPar;
        } else {
            // 对于Eagle等情况，虽然不会直接使用，但提供一个标准格式
            return 'Par' . $diffFromPar; // 如 "Par-2" 代表Eagle
        }
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
