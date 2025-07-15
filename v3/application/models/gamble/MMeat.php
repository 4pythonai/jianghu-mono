<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MMeat extends CI_Model {

    /**
     * 检查当前洞是否产生肉（顶洞）
     * @param array $hole 当前洞数据（通过引用传递）
     * @param GambleContext $context 上下文数据（通过引用传递）
     */
    public function addMeatIfDraw(&$hole, &$context) {
        // 如果当前洞是顶洞（draw == 'y'），则产生一块肉
        if (isset($hole['draw']) && $hole['draw'] == 'y') {
            $context->meat_pool[] = [
                'hole_index' => $hole['index'] ?? count($context->meat_pool),
                'is_eaten' => false
            ];

            $hole['debug'][] = "产生一块肉，当前肉池数量：" . count($context->meat_pool);
        }
    }

    /**
     * 根据赢家表现计算能吃几块肉
     * @param string $winner_performance 赢家表现 (如 'Birdie', 'Par', 'Par+1' 等)
     * @param array $configs 配置信息
     * @return int 能吃的肉数量
     * 
     * 配置示例:
     * 'BetterThanBirdie' => 2,     // Eagle等（比小鸟球更好的成绩）
     * 'Birdie' => 2,               // 小鸟球
     * 'Par' => 1,                  // 标准杆
     * 'WorseThanPar' => 0,         // Bogey及以上（比Par更差的成绩）
     */
    public function getEatingCount($winner_performance, $eating_range) {



        // 根据表现决定能吃几块肉
        if (strpos($winner_performance, 'Par+') === 0) {
            $par_plus = intval(str_replace('Par+', '', $winner_performance));
            if ($par_plus >= 2) {
                // Double Bogey及以上，比Birdie差很多
                return $eating_range['WorseThanPar'] ?? 0;
            } else {
                // Bogey (Par+1)，算作Par水平
                return $eating_range['Par'] ?? 1;
            }
        } elseif ($winner_performance === 'Par') {
            return $eating_range['Par'] ?? 1;
        } elseif ($winner_performance === 'Birdie') {
            return $eating_range['Birdie'] ?? 2;
        } elseif (strpos($winner_performance, 'Eagle') !== false || strpos($winner_performance, 'Par-') === 0) {
            // Eagle、Albatross等，比小鸟球更好的成绩
            return $eating_range['BetterThanBirdie'] ?? 2;
        }

        return 0; // 默认不能吃肉
    }

    /**
     * 执行吃肉并计算获得的金额
     * @param int $eating_count 能吃的肉数量
     * @param int $base_score 本洞基础得分
     * @param array $configs 配置信息
     * @param GambleContext $context 上下文数据（通过引用传递）
     * @return int 吃肉获得的金额
     */
    public function eatMeat($holename, $eating_count, $points, &$context) {
        if ($eating_count <= 0) {
            return 0;
        }

        if (empty($context->meat_pool)) {
            return 0;
        }


        // 找出可以吃的肉（按顺序，先产生的先吃）
        $available_meat = [];
        foreach ($context->meat_pool as $index => &$meat) {
            if (!$meat['is_eaten'] && count($available_meat) < $eating_count) {
                $available_meat[] = $index;
                $meat['is_eaten'] = true; // 标记为已吃
                // debug("eatMeat: 吃掉第 {$index} 块肉");
            }
        }

        $actual_eaten_count = count($available_meat);
        // debug("eatMeat: 实际吃到 {$actual_eaten_count} 块肉");

        if ($actual_eaten_count == 0) {
            // debug("eatMeat: 实际吃到的肉数量为 0，返回 0");
            return 0;
        }

        // 根据配置计算吃肉金额
        $meat_value_config = $context->meat_value_config_string ?? 'MEAT_AS_1';
        $meat_max_value = $context->meat_max_value;

        // debug("eatMeat: 肉价值配置: {$meat_value_config}, 封顶: {$meat_max_value}");

        $result = $this->calculateMeatMoney($holename, $actual_eaten_count, $points, $meat_value_config, $meat_max_value);
        // debug("eatMeat: 计算结果: {$result}");

        return $result;
    }

    /**
     * 根据配置计算吃肉金额
     * @param int $eaten_count 实际吃到的肉数量
     * @param int $base_score 本洞基础得分
     * @param string $meat_value_config 肉价值配置
     * @param int $meat_max_value 每次吃肉的封顶值
     * @return int 吃肉金额
     */
    private function calculateMeatMoney($holename, $eaten_count, $points, $meat_value_config, $meat_max_value) {
        if ($eaten_count <= 0) {
            debug("calculateMeatMoney: 吃肉数量 <= 0，返回 0");
            return 0;
        }

        // debug("calculateMeatMoney:  {$holename} 吃了 {$eaten_count} 块肉，配置: {$meat_value_config}");

        if (strpos($meat_value_config, 'MEAT_AS_') === 0) {
            // MEAT_AS_X 模式：每块肉固定价值
            $meat_value = $this->parseMeatAsX($meat_value_config);
            $total_meat_money = $eaten_count * $meat_value;
            // MEAT_AS_ 模式,不考虑封顶.
            $final_money = $total_meat_money;
            return $final_money;
        } elseif ($meat_value_config === 'SINGLE_DOUBLE') {
            // 分值翻倍模式：本洞赢 8 分, 吃 1 个洞2倍(16 分) ,2 个洞 X3(24 分),3 个洞 X4 倍(32 分)
            $multiplier = $eaten_count; // 1个肉2倍，2个肉3倍，3个肉4倍
            $meat_money = $points * $multiplier;
            $final_money = min($meat_money,  $meat_max_value);
            // debug("calculateMeatMoney:模式[SINGLE_DOUBLE] , 封顶为: {$meat_max_value} , 倍数 {$multiplier}，肉为 {$meat_money}，封顶后 {$final_money}");
            return $final_money;
        } elseif ($meat_value_config === 'CONTINUE_DOUBLE') {
            // 连续翻倍模式：1个肉乘以2,2个肉乘以4,3个肉乘以8
            $multiplier = pow(2, $eaten_count); // 2^eaten_count
            $meat_money = $points * ($multiplier - 1); // 减去原本的base_score，只返回额外部分
            $final_money = min($meat_money,  $meat_max_value);
            return $final_money;
        }

        return 0;
    }

    /**
     * 解析 MEAT_AS_X 配置字符串
     * @param string $config_string 配置字符串，如 "MEAT_AS_3"
     * @return int X值，默认为1
     */
    private function parseMeatAsX($config_string) {
        if (preg_match('/MEAT_AS_(\d+)/', $config_string, $matches)) {
            return intval($matches[1]);
        }
        return 1; // 默认值
    }

    /**
     * 处理整个吃肉流程
     * @param array $hole 当前洞数据（通过引用传递）
     * @param array $configs 配置信息
     * @param GambleContext $context 上下文数据（通过引用传递）
     * @return void
     */
    public function processEating(&$hole,  &$context) {

        $eating_range = $context->eating_range;
        // 只有有输赢的洞才能吃肉
        if (!isset($hole['draw']) || $hole['draw'] == 'y') {
            $hole['debug'][] = "吃肉检查: 顶洞或无输赢，不能吃肉";
            return;
        }

        // 获取赢家信息
        $winner_detail = $hole['winner_detail'] ?? [];
        if (empty($winner_detail)) {
            $hole['debug'][] = "吃肉检查: 没有赢家信息";
            return;
        }

        // winner_detail 是一个数组，找出表现最好的赢家（computedScore最小）
        $best_winner = $this->findBestWinner($winner_detail);
        if (!$best_winner) {
            $hole['debug'][] = "吃肉检查: 找不到最佳赢家";
            return;
        }

        // 根据最好赢家的杆数计算表现
        $winner_performance = $this->calculatePerformance($best_winner['computedScore'], $hole);
        $ponits = abs($hole['points']); // 使用指标分数作为基础分数

        $hole['debug'][] = "吃肉分析: 最佳赢家(userid: {$best_winner['userid']})杆数: {$best_winner['computedScore']}, Par: {$hole['par']}, 表现: {$winner_performance}";

        // 检查肉池状态
        $meat_pool_count = count($context->meat_pool);
        $available_meat_count = 0;
        foreach ($context->meat_pool as $meat) {
            if (!$meat['is_eaten']) {
                $available_meat_count++;
            }
        }
        $hole['debug'][] = "肉池状态: 总共 {$meat_pool_count} 块肉，可用 {$available_meat_count} 块肉";

        // 根据配置决定能吃几块肉
        $meat_value_config = $context->meat_value_config_string ?? 'MEAT_AS_1';
        if ($meat_value_config === 'CONTINUE_DOUBLE') {
            // CONTINUE_DOUBLE模式：直接吃掉所有可用的肉
            $eating_count = $available_meat_count;
            $hole['debug'][] = "吃肉分析: CONTINUE_DOUBLE模式，直接吃掉所有 {$eating_count} 块可用肉";
        } else {
            // 其他模式：根据表现决定能吃几块肉
            $eating_count = $this->getEatingCount($winner_performance, $eating_range);
            $hole['debug'][] = "吃肉分析: 根据表现 {$winner_performance} 可以吃 {$eating_count} 块肉";
        }

        // 执行吃肉，获得金额
        $meatMoney = $this->eatMeat($hole['holename'],  $eating_count, $ponits, $context);
        $hole['debug'][] = "吃肉结果: 获得金额 {$meatMoney}";

        // 将吃肉金额添加到每个赢家的详细信息中
        if ($meatMoney > 0) {


            for ($i = 0; $i < count($hole['winner_detail']); $i++) {
                $hole['winner_detail'][$i]['meatMoney'] = $meatMoney;
            }
            for ($i = 0; $i < count($hole['failer_detail']); $i++) {
                $hole['failer_detail'][$i]['meatMoney'] = -1 * $meatMoney;
            }

            $hole['debug'][] = "所有赢家每人获得吃肉金额: {$meatMoney}";
        } else {
            // 如果没有吃到肉，也要设置 meatMoney 为 0
            for ($i = 0; $i < count($hole['winner_detail']); $i++) {
                $hole['winner_detail'][$i]['meatMoney'] = 0;
            }
            $hole['debug'][] = "没有吃到肉，meatMoney 设为 0";
        }
    }

    /**
     * 找出表现最好的赢家（杆数最少）
     * @param array $winner_detail 赢家详细信息数组
     * @return array|null 最佳赢家信息
     */
    private function findBestWinner($winner_detail) {
        if (empty($winner_detail)) {
            return null;
        }

        $best_winner = null;
        $best_score = PHP_INT_MAX;

        foreach ($winner_detail as $winner) {
            if (isset($winner['computedScore']) && $winner['computedScore'] < $best_score) {
                $best_score = $winner['computedScore'];
                $best_winner = $winner;
            }
        }

        return $best_winner;
    }

    /**
     * 根据杆数和洞的Par值计算表现
     * @param int $computed_score 实际杆数
     * @param array $hole 洞信息
     * @return string 表现描述
     */
    private function calculatePerformance($computed_score, $hole) {
        $par = $hole['par'] ?? 4; // 默认Par 4
        $diff = $computed_score - $par;

        if ($diff <= -2) {
            return 'Eagle'; // 老鹰球或更好
        } elseif ($diff == -1) {
            return 'Birdie'; // 小鸟球
        } elseif ($diff == 0) {
            return 'Par'; // 标准杆
        } elseif ($diff == 1) {
            return 'Par+1'; // 柏忌
        } elseif ($diff == 2) {
            return 'Par+2'; // 双柏忌
        } else {
            return 'Par+' . $diff; // 更多杆
        }
    }
}
