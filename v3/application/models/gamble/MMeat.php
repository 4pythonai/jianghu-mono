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
        // debug("🧲吃肉: 888 吃了 ", $eating_count);

        // 如果是最后一个洞,且配置了大风吹,则在最后一个洞吃掉所有
        if ($this->ifLastHole($context, $hole)  && $context->bigWind == 'y') {
            $eating_count =  $available_meat_count;
            $this->addDebug($hole, "🧲吃肉: 大风吹, 吃掉所有肉, 吃掉剩余的{$available_meat_count} 块肉");
        }

        $eaten_meat_blocks = $this->consumeMeat($context, $eating_count);
        $meatPoints = $this->executeMeatEating($hole, $eaten_meat_blocks, $context);
        $this->distributeMeatPoints($hole, $meatPoints);
    }


    /**
     * @param array $hole 当前洞数据
     * @param int $eating_count 能吃几块肉
     * @param GambleContext $context 上下文数据
     * @return int 吃肉获得的金额
     */
    private function executeMeatEating(&$hole, $eaten_meat_blocks, $context) {
        if (empty($eaten_meat_blocks)) {
            return 0;
        }


        $points_before_kick = abs($hole['points_before_kick']); // 不要使用踢完以后的 points


        $meat_value_config = $context->meatValueConfig;
        $meatMaxValue = $context->meatMaxValue;

        // 与封顶无关  8421 and lasi
        if (strpos($meat_value_config, 'MEAT_AS_') === 0) {
            return $this->calculateMeatMoney_MEAT_AS($context, $hole, $eaten_meat_blocks, $meat_value_config);
        }

        // 8421
        if ($meat_value_config === 'SINGLE_DOUBLE') {
            return $this->calculateMeatMoney_SINGLE_DOUBLE($context, $hole, $eaten_meat_blocks, $points_before_kick, $meatMaxValue);
        }

        // 与封顶无关  8421
        if ($meat_value_config === 'CONTINUE_DOUBLE') {
            return $this->calculateMeatMoney_CONTINUE_DOUBLE($context, $hole, $eaten_meat_blocks, $points_before_kick);
        }


        if ($meat_value_config === 'DOUBLE_WITHOUT_REWARD') {
            $lasiPointsBeforeAddReward = $hole['lasiWinPointsBeforeAddReward'];
            return $this->calculateMeatMoney_SINGLE_DOUBLE($context, $hole, $eaten_meat_blocks, $lasiPointsBeforeAddReward, $meatMaxValue);
        }


        if ($meat_value_config === 'DOUBLE_WITH_REWARD') {
            return $this->calculateMeatMoney_SINGLE_DOUBLE($context, $hole, $eaten_meat_blocks, $points_before_kick, $meatMaxValue);
        }




        // { label: '分值翻倍(含奖励)', value: 'DOUBLE_WITH_REWARD' },
        // { label: '分值翻倍(不含奖励)', value: 'DOUBLE_WITHOUT_REWARD' }

    }


    public function ifLastHole($context, $hole) {

        $lastHoleOfUsefulHoles = $context->usefulHoles[count($context->usefulHoles) - 1];
        if ($lastHoleOfUsefulHoles['hindex'] == $hole['hindex']) {
            return true;
        }
        return false;
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



    private function calculateMeatMoney_MEAT_AS($context, &$currentHole, $eaten_meat_blocks, $meat_as_x) {
        $eaten_count = count($eaten_meat_blocks);
        if ($eaten_count === 0) {
            return 0;
        }
        // MEAT_AS_X 模式：每块肉固定价值,  MEAT_AS_ 没有封顶

        $multiplier = $this->findCurrentHoleMultiplier($context, $currentHole['hindex']);


        if ($multiplier > 1) {
            $this->addDebug($currentHole, "🧲吃肉:踢一脚导致 使用 multiplier: {$multiplier}");
        }

        $meat_value = $this->parseMeatAsX($meat_as_x);
        return $eaten_count * $meat_value * $multiplier;
    }




    /**
     *     Hole           倍数
     *    ❓[ 肉 hole ]    m1
     *    ❓[ 肉 hole ]    m2
     *    ❓[ 肉 hole ]    m3
     *    ❓[ 肉 hole ]    m4
     *    ✅[ 肉 hole ]    basepoints m5
     * 
     *    m1*basepoints +m2*basepoints +m3*basepoints +m4*basepoints 
     * 
     * points_before_kick
     */
    private function calculateMeatMoney_SINGLE_DOUBLE($context, &$currentHole, $eaten_meat_blocks, $points_before_kick, $meatMaxValue) {

        // debug(" 肉:🟥🟥🟥🟥 ", $eaten_meat_blocks);
        // debug(" 肉:🟥 points_before_kick  ", $points_before_kick);

        $eaten_count = count($eaten_meat_blocks);
        if ($eaten_count === 0) {
            return 0;
        }

        $metal_total = 0;
        foreach ($eaten_meat_blocks as $meat) {
            $meatHoleMultiplier = $this->findCurrentHoleMultiplier($context, $meat['hole_index']);
            $one_meat_money = $points_before_kick * $meatHoleMultiplier;

            $one_meat_money = min($one_meat_money, $meatMaxValue);
            $this->addDebug($currentHole, " points_before_kick= { $points_before_kick } 🧲吃了 1 块肉:肉洞的踢一脚导致,使用 multiplier: {$meatHoleMultiplier},得到: {$one_meat_money}");
            $metal_total += $one_meat_money;
        }
        return   $metal_total;
    }



    private function calculateMeatMoney_CONTINUE_DOUBLE($context, &$currentHole, $eaten_meat_blocks, $points_before_kick) {

        // eaten_meat_blocks
        $eaten_count = count($eaten_meat_blocks);

        if ($eaten_count === 0) {
            return 0;
        }
        // 连续翻倍模式: 1个肉乘以2,2个肉乘以4,3个肉乘以8

        $multiplier = $this->findCurrentHoleMultiplier($context, $currentHole['hindex']);
        if ($multiplier > 1) {
            $this->addDebug($currentHole, "🧲吃肉:踢一脚导致 使用 multiplier: {$multiplier}");
        }

        $factor = pow(2, $eaten_count);
        $meat_money = $multiplier * $points_before_kick * ($factor - 1);
        return min($meat_money);
    }

    /**
     * 消耗肉并返回被消耗的肉详情
     * @param GambleContext $context 上下文数据（通过引用传递）
     * @param int $eating_count 要吃几块肉
     * @return array 被消耗的肉详情数组
     */
    private function consumeMeat(&$context, $eating_count) {
        $eaten_indices = [];
        foreach ($context->meat_pool as $index => &$meat) {
            if (!$meat['is_eaten'] && count($eaten_indices) < $eating_count) {
                // 保存肉的详细信息，同时保留索引信息
                $meat_detail = $meat;
                unset($meat_detail['is_eaten']);
                $meat_detail['original_index'] = $index; // 保留原始索引
                $eaten_indices[] = $meat_detail;
                $meat['is_eaten'] = true; // 标记为已吃
            }
        }
        return $eaten_indices;
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

        // debug($context);
        // die;

        $meat_value_config = $context->meatValueConfig;

        if ($meat_value_config === 'CONTINUE_DOUBLE') {
            // CONTINUE_DOUBLE模式：直接吃掉所有可用的肉
            $eating_count = $available_meat_count;
            $this->addDebug($hole, "吃肉分析: CONTINUE_DOUBLE模式，直接吃掉所有 {$eating_count} 块可用肉");
        }

        if ($meat_value_config === 'SINGLE_DOUBLE') {
            // SINGLE_DOUBLE模式：根据表现决定能吃几块肉
            $eating_count = $this->calculateEatingCountByPerformance($winner_performance, $context->eatingRange);
            $this->addDebug($hole, "吃肉分析: SINGLE_DOUBLE模式，根据表现 {$winner_performance} 最多可以吃 {$eating_count} 块肉");
        }

        if (strpos($meat_value_config, 'MEAT_AS_') === 0) {
            // MEAT_AS_X模式：根据表现决定能吃几块肉
            $eating_count = $this->calculateEatingCountByPerformance($winner_performance, $context->eatingRange);
            $this->addDebug($hole, "吃肉分析: MEAT_AS_X模式，根据表现 {$winner_performance} 最多可以吃 {$eating_count} 块肉");
        }

        if ($meat_value_config === 'DOUBLE_WITHOUT_REWARD') {
            // SINGLE_DOUBLE模式：根据表现决定能吃几块肉
            $eating_count = $this->calculateEatingCountByPerformance($winner_performance, $context->eatingRange);
            $this->addDebug($hole, "拉丝吃肉分析: DOUBLE_WITHOUT_REWARD 模式，根据表现 {$winner_performance} 最多可以吃 {$eating_count} 块肉");
        }


        if ($meat_value_config === 'DOUBLE_WITH_REWARD') {
            // SINGLE_DOUBLE模式：根据表现决定能吃几块肉
            $eating_count = $this->calculateEatingCountByPerformance($winner_performance, $context->eatingRange);
            $this->addDebug($hole, "拉丝吃肉分析: DOUBLE_WITH_REWARD 模式，根据表现 {$winner_performance} 最多可以吃 {$eating_count} 块肉");
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
     * @param array $eatingRange 配置信息
     * @return int 能吃的肉数量
     */
    private function calculateEatingCountByPerformance($winner_performance, $eatingRange) {
        // 解析表现字符串，获取杆数差值
        $diff = $this->parsePerformanceToDiff($winner_performance);

        // 根据差值确定表现等级
        $performance_level = $this->getPerformanceByDiff($diff);

        // 根据表现等级返回吃肉数量
        return $this->getEatingCountByPerformance($performance_level, $eatingRange);
    }

    /**
     * 从表现字符串解析杆数差值
     * @param string $performance 表现字符串
     * @return int 杆数差值
     */
    private function parsePerformanceToDiff($performance) {
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
     * @param array $eatingRange 配置信息
     * @return int 能吃的肉数量
     */
    private function getEatingCountByPerformance($performance_level, $eatingRange) {
        switch ($performance_level) {
            case 'Eagle':
                return $eatingRange['BetterThanBirdie'] ?? 2;
            case 'Birdie':
                return $eatingRange['Birdie'] ?? 2;
            case 'Par':
                return $eatingRange['Par'] ?? 1;
            case 'Par+1':
                return $eatingRange['Par'] ?? 1; // Bogey算作Par水平
            default:
                // Par+2及以上算作比Par更差的成绩
                return $eatingRange['WorseThanPar'] ?? 0;
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
            $this->addDebug($hole, "没有吃到肉 ,meatPoints 设为 0");
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


    private function findCurrentHoleMultiplier($context, $hindex) {

        $kickConfig = $context->kickConfig;

        // 检查 kickConfig 是否为数组且不为空
        if (!is_array($kickConfig) || empty($kickConfig)) {
            // debug("❌❌ kickConfig 不是数组或为空，使用默认值 1");
            return 1;
        }

        foreach ($kickConfig as $config) {
            if ($config['hindex'] == $hindex) {
                return $config['multiplier'];
            }
        }
        // debug("❌❌ 当前洞没有找到 multiplier, 使用默认值 1");
        return 1;
    }
}
