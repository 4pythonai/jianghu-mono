<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MMeat extends CI_Model {

    /**
     * 处理吃肉逻辑 - 重构后的主函数
     * @param array $hole 当前洞数据（通过引用传递）
     * @param GambleContext $context 上下文数据（通过引用传递）
     */
    public function processEating(&$hole, &$context) {
        if (!$this->canEatMeat($hole)) {
            return;
        }

        $best_winner = $this->findBestWinner($hole['winner_detail'] ?? []);
        if (!$best_winner) {
            $this->addDebug($hole, "吃肉检查: 找不到最佳赢家");
            return;
        }

        $winner_performance = $this->calculatePerformance($best_winner['computedScore'], $hole);
        $this->addDebug($hole, "吃肉分析: 最佳赢家(userid: {$best_winner['userid']})杆数: {$best_winner['computedScore']}, Par: {$hole['par']}, 表现: {$winner_performance}");

        $available_meat_count = $this->getAvailableMeatCount($context);
        $this->addDebug($hole, "肉池状态: 总共 " . count($context->meat_pool) . " 块肉，可用 {$available_meat_count} 块肉");

        $eating_count = $this->determineEatingCount($winner_performance, $context, $available_meat_count, $hole);
        $meatPoints = $this->executeMeatEating($hole, $eating_count, $context);

        $this->distributeMeatPoints($hole, $meatPoints);
    }

    /**
     * 检查当前洞是否产生肉（顶洞）
     * @param array $hole 当前洞数据（通过引用传递）
     * @param GambleContext $context 上下文数据（通过引用传递）
     */
    public function addMeatIfDraw(&$hole, &$context) {
        // 如果当前洞是顶洞（draw == 'y'），则产生一块肉
        if (isset($hole['draw']) && $hole['draw'] == 'y') {
            $context->meat_pool[] = [
                'hole_index' => $hole['hindex'],
                'hole_name' => $hole['holename'],
                'is_eaten' => false
            ];

            $this->addDebug($hole, "产生一块肉，当前肉池数量：" . count($context->meat_pool));
        }
    }

    /**
     * 执行吃肉并计算获得的金额 - 合并了原有的eatMeat和calculateMeatMoney逻辑
     * @param array $hole 当前洞数据
     * @param int $eating_count 能吃几块肉
     * @param GambleContext $context 上下文数据
     * @return int 吃肉获得的金额
     */
    private function executeMeatEating($hole, $eating_count, $context) {
        if ($eating_count <= 0 || empty($context->meat_pool)) {
            $this->addDebug($hole, "吃肉结果: 没有可吃的肉");
            return 0;
        }

        // 找出可以吃的肉（按顺序，先产生的先吃）
        $eaten_meat_indices = $this->consumeMeat($context, $eating_count);
        $actual_eaten_count = count($eaten_meat_indices);

        if ($actual_eaten_count == 0) {
            $this->addDebug($hole, "吃肉结果: 实际吃到的肉数量为 0");
            return 0;
        }

        $points = abs($hole['points']); // 使用指标分数作为基础分数
        $meat_value_config = $context->meat_value_config_string ?? 'MEAT_AS_1';
        $meat_max_value = $context->meat_max_value;

        $meatPoints = $this->calculateMeatMoney($actual_eaten_count, $points, $meat_value_config, $meat_max_value);
        $this->addDebug($hole, "吃肉结果: 获得金额 {$meatPoints}");

        return $meatPoints;
    }

    /**
     * 消耗肉并返回被消耗的肉索引
     * @param GambleContext $context 上下文数据（通过引用传递）
     * @param int $eating_count 要吃几块肉
     * @return array 被消耗的肉索引数组
     */
    private function consumeMeat(&$context, $eating_count) {
        $eaten_indices = [];
        foreach ($context->meat_pool as $index => &$meat) {
            if (!$meat['is_eaten'] && count($eaten_indices) < $eating_count) {
                $eaten_indices[] = $index;
                $meat['is_eaten'] = true; // 标记为已吃
            }
        }
        return $eaten_indices;
    }

    /**
     * 根据配置计算吃肉金额 - 简化后的计算逻辑
     * @param int $eaten_count 实际吃到的肉数量
     * @param int $points 本洞基础得分
     * @param string $meat_value_config 肉价值配置
     * @param int $meat_max_value 每次吃肉的封顶值
     * @return int 吃肉金额
     */
    private function calculateMeatMoney($eaten_count, $points, $meat_value_config, $meat_max_value) {
        if ($eaten_count <= 0) {
            return 0;
        }

        // 根据配置模式计算肉值
        if (strpos($meat_value_config, 'MEAT_AS_') === 0) {
            // MEAT_AS_X 模式：每块肉固定价值
            $meat_value = $this->parseMeatAsX($meat_value_config);
            return $eaten_count * $meat_value;
        }

        if ($meat_value_config === 'SINGLE_DOUBLE') {
            // 分值翻倍模式: 1个肉2倍 ,2个肉3倍, 3个肉4倍
            $multiplier = $eaten_count;
            $meat_money = $points * $multiplier;
            return min($meat_money, $meat_max_value);
        }

        if ($meat_value_config === 'CONTINUE_DOUBLE') {
            // 连续翻倍模式: 1个肉乘以2,2个肉乘以4,3个肉乘以8
            $multiplier = pow(2, $eaten_count);
            $meat_money = $points * ($multiplier - 1);
            return min($meat_money, $meat_max_value);
        }

        return 0;
    }

    /**
     * 解析 MEAT_AS_X 配置字符串
     * @param string $config_string 配置字符串，如 "MEAT_AS_3"
     * @return int X值 默认为1
     */
    private function parseMeatAsX($config_string) {
        if (preg_match('/MEAT_AS_(\d+)/', $config_string, $matches)) {
            return intval($matches[1]);
        }
        return 1; // 默认值
    }

    /**
     * 验证是否可以吃肉
     * @param array $hole 当前洞数据
     * @return bool 是否可以吃肉
     */
    private function canEatMeat($hole) {
        // 只有有输赢的洞才能吃肉
        if (!isset($hole['draw']) || $hole['draw'] == 'y') {
            $this->addDebug($hole, "吃肉检查: 顶洞或无输赢，不能吃肉");
            return false;
        }

        // 获取赢家信息
        $winner_detail = $hole['winner_detail'] ?? [];
        if (empty($winner_detail)) {
            $this->addDebug($hole, "吃肉检查: 没有赢家信息");
            return false;
        }

        return true;
    }

    /**
     * 确定能吃几块肉 - 合并了原有的getEatingCount逻辑
     * @param string $winner_performance 赢家表现
     * @param GambleContext $context 上下文数据
     * @param int $available_meat_count 可用肉数量
     * @param array $hole 当前洞数据（通过引用传递）
     * @return int 能吃几块肉
     */
    private function determineEatingCount($winner_performance, $context, $available_meat_count, &$hole) {
        $meat_value_config = $context->meat_value_config_string ?? 'MEAT_AS_1';

        if ($meat_value_config === 'CONTINUE_DOUBLE') {
            // CONTINUE_DOUBLE模式：直接吃掉所有可用的肉
            $eating_count = $available_meat_count;
            $this->addDebug($hole, "吃肉分析: CONTINUE_DOUBLE模式，直接吃掉所有 {$eating_count} 块可用肉");
        } else {
            // 其他模式：根据表现决定能吃几块肉
            $eating_count = $this->calculateEatingCountByPerformance($winner_performance, $context->eating_range);
            $this->addDebug($hole, "吃肉分析: 根据表现 {$winner_performance} 可以吃 {$eating_count} 块肉");
        }

        return $eating_count;
    }

    /**
     * 根据杆数和洞的Par值计算表现
     * @param int $computed_score 实际杆数
     * @param array $hole 洞信息
     * @return string 表现描述
     */
    private function calculatePerformance($computed_score, $hole) {
        $par = $hole['par'];
        $diff = $computed_score - $par;

        return $this->getPerformanceByDiff($diff);
    }

    /**
     * 根据杆数差值获取表现描述
     * @param int $diff 杆数与Par的差值
     * @return string 表现描述
     */
    private function getPerformanceByDiff($diff) {
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

    /**
     * 根据赢家表现计算能吃几块肉
     * @param string $winner_performance 赢家表现 (如 'Birdie', 'Par', 'Par+1' 等)
     * @param array $eating_range 配置信息
     * @return int 能吃的肉数量
     */
    private function calculateEatingCountByPerformance($winner_performance, $eating_range) {
        // 解析表现字符串，获取杆数差值
        $diff = $this->getDiffFromPerformance($winner_performance);

        // 根据差值确定表现等级
        $performance_level = $this->getPerformanceByDiff($diff);

        // 根据表现等级返回吃肉数量
        return $this->getEatingCountByPerformanceLevel($performance_level, $eating_range);
    }

    /**
     * 从表现字符串解析杆数差值
     * @param string $performance 表现字符串
     * @return int 杆数差值
     */
    private function getDiffFromPerformance($performance) {
        if (strpos($performance, 'Par+') === 0) {
            return intval(str_replace('Par+', '', $performance));
        } elseif (strpos($performance, 'Par-') === 0) {
            return -intval(str_replace('Par-', '', $performance));
        } elseif ($performance === 'Par') {
            return 0;
        } elseif ($performance === 'Birdie') {
            return -1;
        } elseif (strpos($performance, 'Eagle') !== false) {
            return -2; // Eagle或更好
        }

        return 0; // 默认值
    }

    /**
     * 根据表现等级获取吃肉数量
     * @param string $performance_level 表现等级
     * @param array $eating_range 配置信息
     * @return int 能吃的肉数量
     */
    private function getEatingCountByPerformanceLevel($performance_level, $eating_range) {
        switch ($performance_level) {
            case 'Eagle':
                return $eating_range['BetterThanBirdie'] ?? 2;
            case 'Birdie':
                return $eating_range['Birdie'] ?? 2;
            case 'Par':
                return $eating_range['Par'] ?? 1;
            case 'Par+1':
                return $eating_range['Par'] ?? 1; // Bogey算作Par水平
            default:
                // Par+2及以上算作比Par更差的成绩
                return $eating_range['WorseThanPar'] ?? 0;
        }
    }

    /**
     * 获取可用肉数量
     * @param GambleContext $context 上下文数据
     * @return int 可用肉数量
     */
    private function getAvailableMeatCount($context) {
        $count = 0;
        foreach ($context->meat_pool as $meat) {
            if (!$meat['is_eaten']) {
                $count++;
            }
        }
        return $count;
    }

    /**
     * 分配吃肉金额
     * @param array $hole 当前洞数据（通过引用传递）
     * @param int $meatPoints 吃肉获得的金额
     */
    private function distributeMeatPoints(&$hole, $meatPoints) {
        // 确保数组存在
        if (!isset($hole['winner_detail'])) {
            $hole['winner_detail'] = [];
        }
        if (!isset($hole['failer_detail'])) {
            $hole['failer_detail'] = [];
        }

        if ($meatPoints > 0) {
            $this->setMeatPointsForPlayers($hole['winner_detail'], $meatPoints);
            $this->setMeatPointsForPlayers($hole['failer_detail'], -$meatPoints);
            $this->addDebug($hole, "所有赢家每人获得吃肉金额: {$meatPoints}");
        } else {
            // 如果没有吃到肉，也要设置 meatPoints 为 0
            $this->setMeatPointsForPlayers($hole['winner_detail'], 0);
            $this->addDebug($hole, "没有吃到肉，meatPoints 设为 0");
        }
    }

    /**
     * 为球员设置meatPoints
     * @param array $players 球员数组（通过引用传递）
     * @param int $meatPoints meatPoints值
     */
    private function setMeatPointsForPlayers(&$players, $meatPoints) {
        for ($i = 0; $i < count($players); $i++) {
            $players[$i]['meatPoints'] = $meatPoints;
            $players[$i]['pointsWithMeat'] = $players[$i]['scorePoints'] + $meatPoints;
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
     * 添加调试信息 - 统一调试信息处理
     * @param array $hole 洞数据（通过引用传递）
     * @param string $message 调试信息
     */
    private function addDebug(&$hole, $message) {
        if (!isset($hole['debug'])) {
            $hole['debug'] = [];
        }
        $hole['debug'][] = $message;
    }
}
