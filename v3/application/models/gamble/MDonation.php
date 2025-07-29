<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

/**
 * 捐锅(捐赠)算法
 * 
 * 三种模式：
 * 1. normal: 每个赢家最多捐指定点数
 * 2. all: 每个赢家捐全部赢点
 * 3. bigpot: 先收集所有赢点，最后按负分比例分摊费用
 * 
 * 统一处理逻辑：
 * - 从0.5点开始，逐步增加捐赠点数
 * - 检查三个限制：赢家实际赢点、模式限制、剩余总额度
 */

class MDonation extends CI_Model {

    public function processDonation($context) {
        // debug(" ❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️❇️ ");
        // debug($context->usefulHoles);
        // debug($context->donationCfg);

        $donationCfg = $context->donationCfg;
        $donationType = $donationCfg['donationType'];

        if ($donationType == 'none') {
            return;
        }

        switch ($donationType) {
            case 'normal':
            case 'all':
                $this->processStandardDonation($context);
                break;
            case 'bigpot':
                $this->processBigpotDonation($context);
                break;
        }
    }

    /**
     * 处理标准捐赠模式（normal 和 all）
     */
    private function processStandardDonation($context) {
        $donationCfg = $context->donationCfg;
        $donationType = $donationCfg['donationType'];
        $maxDonationPoints = floatval($donationCfg['maxDonationPoints'] ?? 0);

        // 获取当前捐赠池总点数
        $_current_total = $this->getCurrentDonationTotal($context);

        // 如果已达到最大点数，直接返回
        if ($_current_total >= $maxDonationPoints) {
            debug("捐赠池已达到最大点数: {$maxDonationPoints}");
            return;
        }

        // 对于"全捐"和"normal"模式，都使用公平分配
        if ($donationType == 'all' || $donationType == 'normal') {
            $this->processAllDonationFairly($context, $maxDonationPoints, $_current_total);
        }
    }

    /**
     * 获取赢家的点数（优先使用 pointsWithMeat，否则使用 scorePoints）
     */
    private function getWinnerPoints($winner) {
        if (isset($winner['pointsWithMeat']) && $winner['pointsWithMeat'] > 0) {
            return floatval($winner['pointsWithMeat']);
        } else {
            return floatval($winner['scorePoints'] ?? 0);
        }
    }

    /**
     * 计算每个赢家能捐赠的最大点数
     */
    private function calculateMaxDonationPerWinner($winner, $donationCfg) {
        $donationType = $donationCfg['donationType'];
        $_winner_points = $this->getWinnerPoints($winner);

        switch ($donationType) {
            case 'normal':
                $_donation_limit = floatval($donationCfg['donationPoints'] ?? 0);
                return min($_winner_points, $_donation_limit);

            case 'all':
            case 'bigpot':
                return $_winner_points;

            default:
                debug("未知的捐赠类型: " . $donationType);
                return 0;
        }
    }

    /**
     * 公平处理"全捐"和"normal"模式
     */
    private function processAllDonationFairly($context, $maxDonationPoints, $_current_total) {
        // 收集所有赢家的信息
        $_winners = [];
        $_total_winner_points = 0;
        $donationCfg = $context->donationCfg;
        $donationType = $donationCfg['donationType'];

        foreach ($context->usefulHoles as $hole) {
            if (!isset($hole['winner_detail']) || empty($hole['winner_detail'])) {
                continue;
            }

            foreach ($hole['winner_detail'] as $winner) {
                $_points = $this->getWinnerPoints($winner);
                if ($_points > 0) {
                    if ($donationType == 'normal') {
                        // normal模式：每个赢家最多捐 donationPoints
                        $_donation_limit = floatval($donationCfg['donationPoints'] ?? 0);
                        $_max_per_winner = min($_points, $_donation_limit);
                    } else {
                        // all模式：每个赢家捐全部赢点
                        $_max_per_winner = $_points;
                    }

                    $_winners[] = [
                        'hole' => $hole,
                        'winner' => $winner,
                        'points' => $_points,
                        'max_donation' => $_max_per_winner
                    ];
                    $_total_winner_points += $_max_per_winner;
                }
            }
        }

        if (empty($_winners)) {
            return;
        }

        // 计算需要捐赠的总点数
        $_remaining_to_donate = $maxDonationPoints - $_current_total;

        if ($_remaining_to_donate <= 0) {
            return;
        }

        // 计算每个赢家应该捐赠的点数（按比例分配）
        $_donations = [];
        $_total_allocated = 0;

        foreach ($_winners as $_winner_info) {
            $_max_per_winner = $_winner_info['max_donation'];

            // 按比例计算该赢家应该捐赠的点数
            $_proportional_donation = ($_max_per_winner / $_total_winner_points) * $_remaining_to_donate;

            // 确保不超过该赢家的最大捐赠限制
            $_final_donation = min($_proportional_donation, $_max_per_winner);

            $_donations[] = [
                'winner_info' => $_winner_info,
                'donation' => $_final_donation
            ];

            $_total_allocated += $_final_donation;
        }

        // 如果分配的总数超过了需要捐赠的点数，按比例缩减
        if ($_total_allocated > $_remaining_to_donate) {
            $_scale_factor = $_remaining_to_donate / $_total_allocated;
            foreach ($_donations as &$_donation) {
                $_donation['donation'] *= $_scale_factor;
            }
        }

        // 应用捐赠
        foreach ($_donations as $_donation) {
            $_winner_info = $_donation['winner_info'];
            $_final_donation = $_donation['donation'];
            $_hole = $_winner_info['hole'];
            $_winner = $_winner_info['winner'];
            $_points = $_winner_info['points'];

            if ($_final_donation > 0) {
                // 更新赢家信息
                foreach ($context->usefulHoles as &$hole) {
                    if ($hole['holeid'] == $_hole['holeid']) {
                        foreach ($hole['winner_detail'] as &$winner) {
                            if ($winner['userid'] == $_winner['userid']) {
                                $winner['pointsDonated'] = $_final_donation;
                                $winner['pointsAfterDonation'] = $_points - $_final_donation;

                                // 添加到捐赠池
                                $this->addToDonationPool($context, [
                                    'holeid' => $hole['holeid'],
                                    'holename' => $hole['holename'],
                                    'userid' => $winner['userid'],
                                    'pointsDonated' => $_final_donation,
                                    'donationType' => 'all',
                                    'timestamp' => date('Y-m-d H:i:s')
                                ]);
                                break 2;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * 从0.5点开始，逐步计算最优捐赠点数（仅用于normal模式）
     */
    private function calculateOptimalDonation($winner, $donationCfg, $_current_total, $maxDonationPoints) {
        $_winner_points = $this->getWinnerPoints($winner);
        $_remaining_total = $maxDonationPoints - $_current_total;

        // 如果赢家没有赢点或已达到最大捐赠额度，返回0
        if ($_winner_points <= 0 || $_remaining_total <= 0) {
            return 0;
        }

        // 计算该赢家的最大捐赠限制
        $_max_per_winner = $this->calculateMaxDonationPerWinner($winner, $donationCfg);

        // 从0.5点开始，逐步增加
        $_donation_points = 0.5;
        $_optimal_donation = 0;

        while ($_donation_points <= $_max_per_winner && $_donation_points <= $_remaining_total) {
            $_optimal_donation = $_donation_points;
            $_donation_points += 0.5; // 每次增加0.5点
        }

        return $_optimal_donation;
    }

    /**
     * 处理大锅饭模式
     */
    private function processBigpotDonation($context) {
        $donationCfg = $context->donationCfg;
        $totalFee = floatval($donationCfg['totalFee']);

        if ($totalFee <= 0) {
            debug("大锅饭模式需要设置总费用");
            return;
        }

        // 第一阶段：收集所有赢点
        foreach ($context->usefulHoles as &$hole) {
            if (!isset($hole['winner_detail']) || empty($hole['winner_detail'])) {
                continue;
            }

            foreach ($hole['winner_detail'] as &$winner) {
                $_points_to_donate = $this->getWinnerPoints($winner);

                if ($_points_to_donate > 0) {
                    // 记录捐赠信息
                    $winner['pointsDonated'] = $_points_to_donate;
                    $winner['pointsAfterDonation'] = 0;

                    // 添加到捐赠池
                    $this->addToDonationPool($context, [
                        'holeid' => $hole['holeid'],
                        'holename' => $hole['holename'],
                        'userid' => $winner['userid'],
                        'pointsDonated' => $_points_to_donate,
                        'donationType' => 'bigpot_collect',
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                }
            }
        }

        // 第二阶段：计算费用分摊
        $this->calculateBigpotFeeDistribution($context, $totalFee);
    }

    /**
     * 计算大锅饭费用分摊
     */
    private function calculateBigpotFeeDistribution($context, $totalFee) {
        $_negative_scores = [];
        $_total_negative_points = 0;

        // 收集所有选手的负分
        foreach ($context->usefulHoles as $hole) {
            if (isset($hole['failer_detail'])) {
                foreach ($hole['failer_detail'] as $failer) {
                    $_userid = $failer['userid'];
                    $_score_points = floatval($failer['scorePoints']);

                    if ($_score_points < 0) {
                        if (!isset($_negative_scores[$_userid])) {
                            $_negative_scores[$_userid] = 0;
                        }
                        $_negative_scores[$_userid] += abs($_score_points);
                        $_total_negative_points += abs($_score_points);
                    }
                }
            }
        }

        // 计算每点负分的价格并分摊费用
        if ($_total_negative_points > 0) {
            $_price_per_point = $totalFee / $_total_negative_points;

            foreach ($_negative_scores as $_userid => $_negative_points) {
                $_user_fee = $_price_per_point * $_negative_points;

                // 添加到捐赠池
                $this->addToDonationPool($context, [
                    'userid' => $_userid,
                    'negativePoints' => $_negative_points,
                    'feeShare' => $_user_fee,
                    'donationType' => 'bigpot_distribute',
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }

            debug("大锅饭费用分摊完成，总费用: {$totalFee}, 每点价格: {$_price_per_point}");
        }
    }

    /**
     * 获取当前捐赠池总点数
     */
    private function getCurrentDonationTotal($context) {
        $_total = 0.0;
        foreach ($context->donation_pool as $record) {
            if (isset($record['pointsDonated'])) {
                $_total += floatval($record['pointsDonated']);
            }
        }
        return $_total;
    }

    /**
     * 添加到捐赠池
     */
    private function addToDonationPool($context, $record) {
        $context->donation_pool[] = $record;
    }


    /**
     * 
     *  设置 winner_detail, failer_detail 的 finnal_points
     *  winner_detail:
     * 
     *       如果有 pointsAfterDonation,使用 pointsAfterDonation,
     *       如果没有 pointsAfterDonation, 使用 pointsWithMeat,
     *       如果没有 pointsWithMeat, 使用 scorePoints,
     * 
     *   
     * failer_detail:
     *      直接使用 scorePoints
     * 
     * 
     * 
     * 
     * 
     */

    public function setFinalPoints($context) {
        foreach ($context->usefulHoles as &$hole) {
            // 处理 winner_detail
            if (isset($hole['winner_detail'])) {
                foreach ($hole['winner_detail'] as &$winner) {
                    if (isset($winner['pointsAfterDonation'])) {
                        $winner['final_points'] = floatval($winner['pointsAfterDonation']);
                    } elseif (isset($winner['pointsWithMeat'])) {
                        $winner['final_points'] = floatval($winner['pointsWithMeat']);
                    } else {
                        $winner['final_points'] = floatval($winner['scorePoints']);
                    }
                }
            }

            // 处理 failer_detail
            if (isset($hole['failer_detail'])) {
                foreach ($hole['failer_detail'] as &$failer) {
                    if (isset($failer['pointsWithMeat'])) {
                        $failer['final_points'] = floatval($failer['pointsWithMeat']);
                    } else {
                        $failer['final_points'] = floatval($failer['scorePoints']);
                    }
                }
            }
        }
    }
}
