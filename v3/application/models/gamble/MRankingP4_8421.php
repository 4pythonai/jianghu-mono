<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

/**
 * 
 *          {
                value: 'indicator.reverse',
                label: '得分相同按出身得分排序',
            },
            {
                value: 'indicator.win_loss.reverse_win',
                label: '得分相同按输赢排序，输赢相同按出身得分排序',
            },
            {
                value: 'indicator.win_loss.reverse_indicator',
                label: '得分相同按输赢排序，输赢相同按出身输赢排序',
            },
            {
                value: 'score.reverse',
                label: '成绩相同按出身成绩排序',
            },
            {
                value: 'score.win_loss.reverse_win',
                label: '成绩相同按输赢排序，输赢相同按出身成绩排序',
            },
            {
                value: 'score.win_loss.reverse_score',
                label: '成绩相同按输赢排序，输赢相同按出身输赢排序',
            }


 * 排名的返回格式:
 * [ranking] => Array
 * (
 *     [1] => 93
 *     [2] => 160
 *     [3] => 185
 *     [4] => 67
 * )
 */

class MRankingP4_8421 extends CI_Model {

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
        $tieResolveConfig = $context->ranking4TieResolveConfig;
        $bootStrapOrder = $context->bootStrapOrder;

        // debug("使用排序规则: " . $tieResolveConfig);

        switch ($tieResolveConfig) {
            case 'indicator.reverse':
                return $this->rankByIndicatorReverse($holeIndex, $hole, $context, $bootStrapOrder);
            case 'indicator.win_loss.reverse_win':
                return $this->rankByIndicatorWinLossReverseWin($holeIndex, $hole, $context, $bootStrapOrder);
            case 'indicator.win_loss.reverse_indicator':
                return $this->rankByIndicatorWinLossReverseIndicator($holeIndex, $hole, $context, $bootStrapOrder);
            case 'score.reverse':
                return $this->rankByScoreReverse($holeIndex, $hole, $context, $bootStrapOrder);
            case 'score.win_loss.reverse_win':
                return $this->rankByScoreWinLossReverseWin($holeIndex, $hole, $context, $bootStrapOrder);
            case 'score.win_loss.reverse_score':
                return $this->rankByScoreWinLossReverseScore($holeIndex, $hole, $context, $bootStrapOrder);
            default:
                debug("未知的排序规则: " . $tieResolveConfig);
                return [];
        }


        return [];
    }

    /**
     *  得分(Indicator)相同按"出身"得分(Indicator)排序
     */
    private function rankByIndicatorReverse($holeIndex, $hole, $context, $bootStrapOrder) {
        $users = $bootStrapOrder;

        // 按得分排序（得分越高越好）
        usort($users, function ($auser, $bUser) use ($hole, $holeIndex, $context) {


            $indicatorA = $hole['indicators'][$auser] ?? 0;
            $indicatorB = $hole['indicators'][$bUser] ?? 0;

            if ($indicatorA !== $indicatorB) {
                return $indicatorB - $indicatorA; // 降序
            }

            // 得分相同，回溯历史得分
            return $this->compareByHistoryIndicator($auser, $bUser, $holeIndex, $context);
        });
        return $this->arrayToRanking($users);
    }


    /**
     * 得分相同按输赢排序，输赢相同按出身得分排序
     */

    private function rankByIndicatorWinLossReverseWin($holeIndex, $hole, $context, $bootStrapOrder) {
        $users = $bootStrapOrder;

        // 按得分排序
        usort($users, function ($auser, $bUser) use ($hole, $holeIndex, $context) {
            $indicatorA = $hole['indicators'][$auser] ?? 0;
            $indicatorB = $hole['indicators'][$bUser] ?? 0;

            if ($indicatorA !== $indicatorB) {
                return $indicatorB - $indicatorA; // 降序
            }

            // 得分相同，按输赢排序
            $winCompare = $this->compareByWinLoss($auser, $bUser, $hole);
            if ($winCompare !== 0) {
                return $winCompare;
            }

            // 输赢相同，回溯历史 indicator
            return $this->compareByHistoryIndicator($auser, $bUser, $holeIndex, $context);
        });

        return $this->arrayToRanking($users);
    }



    /**
     *  得分相同按输赢排序，输赢相同按"出身"(上一洞)输赢排序
     */
    private function rankByIndicatorWinLossReverseIndicator($holeIndex, $hole, $context, $bootStrapOrder) {
        $users = $bootStrapOrder;

        // 按得分排序
        usort($users, function ($auser, $bUser) use ($hole, $holeIndex, $context) {
            $indicatorA = $hole['indicators'][$auser] ?? 0;
            $indicatorB = $hole['indicators'][$bUser] ?? 0;

            if ($indicatorA !== $indicatorB) {
                return $indicatorB - $indicatorA; // 降序
            }

            // 得分相同，按输赢排序
            $winCompare = $this->compareByWinLoss($auser, $bUser, $hole);
            if ($winCompare !== 0) {
                return $winCompare;
            }


            // 输赢相同，回溯历史输赢
            return $this->compareByHistoryWinLoss($auser, $bUser, $holeIndex, $context);
        });

        return $this->arrayToRanking($users);
    }


    /**
     * 
     * 成绩(score)相同按"出身"成绩(score_排序
     */
    private function rankByScoreReverse($holeIndex, $hole, $context, $bootStrapOrder) {
        $users = $bootStrapOrder;

        // 按成绩排序（成绩越小越好）
        usort($users, function ($auser, $bUser) use ($hole, $holeIndex, $context) {
            $scoreA = $hole['computedScores'][$auser];
            $scoreB = $hole['computedScores'][$bUser];

            if ($scoreA !== $scoreB) {
                return $scoreA - $scoreB;
            }

            // 成绩相同，回溯历史成绩
            return $this->compareByHistoryScore($auser, $bUser, $holeIndex, $context);
        });
        return $this->arrayToRanking($users);
    }




    /**
       成绩(score)相同按输赢排序，输赢相同按"出身"成绩(score)排序
     */
    private function rankByScoreWinLossReverseWin($holeIndex, $hole, $context, $bootStrapOrder) {
        $users = $bootStrapOrder;

        // 按成绩排序
        usort($users, function ($auser, $bUser) use ($hole, $holeIndex, $context) {
            $scoreA = $hole['computedScores'][$auser];
            $scoreB = $hole['computedScores'][$bUser];

            if ($scoreA !== $scoreB) {
                return $scoreA - $scoreB;
            }

            // 成绩相同，按输赢排序
            $winCompare = $this->compareByWinLoss($auser, $bUser, $hole);
            if ($winCompare !== 0) {
                return $winCompare;
            }

            // 输赢相同，回溯历史输赢
            return $this->compareByHistoryScore($auser, $bUser, $holeIndex, $context);
        });
        return $this->arrayToRanking($users);
    }







    /**
     * 成绩(score)相同按输赢排序，输赢相同按"出身"输赢排序
     */
    private function rankByScoreWinLossReverseScore($holeIndex, $hole, $context, $bootStrapOrder) {

        // debug("A.2.2: 按成绩排序，按输赢，回溯成绩");
        $users = $bootStrapOrder;

        // 按成绩排序
        usort($users, function ($auser, $bUser) use ($hole, $holeIndex, $context) {
            $scoreA = $hole['computedScores'][$auser];
            $scoreB = $hole['computedScores'][$bUser];

            if ($scoreA !== $scoreB) {
                return $scoreA - $scoreB;
            }

            // 成绩相同，按输赢排序
            $winCompare = $this->compareByWinLoss($auser, $bUser, $hole);
            if ($winCompare !== 0) {
                return $winCompare;
            }

            // 输赢相同，回溯历史成绩
            return $this->compareByHistoryWinLoss($auser, $bUser, $holeIndex, $context);
        });

        return $this->arrayToRanking($users);
    }

    /**
     * 按当前洞输赢比较用户
     * @param int $userA 用户A
     * @param int $userB 用户B
     * @param array $hole 当前洞数据
     * @return int 比较结果 (-1: A胜, 1: B胜, 0: 平)
     */
    private function compareByWinLoss($userA, $userB, $hole) {
        $isAWinner = $this->isUserWinner($userA, $hole);
        $isBWinner = $this->isUserWinner($userB, $hole);

        if ($isAWinner && !$isBWinner) {
            return -1; // A胜
        } elseif (!$isAWinner && $isBWinner) {
            return 1; // B胜
        }

        return 0; // 平局
    }

    /**
     * 判断用户是否是胜者
     */
    private function isUserWinner($userId, $hole) {
        if (!isset($hole['winner']) || $hole['winner'] === null) {
            return false;
        }

        $winnerTeam = $hole['winner'];
        $redTeam = $hole['red'] ?? [];
        $blueTeam = $hole['blue'] ?? [];

        if ($winnerTeam === 'red' && in_array($userId, $redTeam)) {
            return true;
        } elseif ($winnerTeam === 'blue' && in_array($userId, $blueTeam)) {
            return true;
        }

        return false;
    }

    /**
     * 通过历史成绩比较用户
     */
    private function compareByHistoryScore($userA, $userB, $holeIndex, $context) {
        for ($i = $holeIndex - 1; $i >= 0; $i--) {
            if (!isset($context->usefulHoles[$i])) {
                continue;
            }

            $historyHole = $context->usefulHoles[$i];
            $scoreA = $historyHole['computedScores'][$userA] ?? 999;
            $scoreB = $historyHole['computedScores'][$userB] ?? 999;

            if ($scoreA !== $scoreB) {
                return $scoreA - $scoreB;
            }
        }

        // 回溯到初始顺序
        return $this->compareByBootStrapOrder($userA, $userB, $context);
    }

    /**
     * 通过历史得分比较用户
     */
    private function compareByHistoryIndicator($userA, $userB, $holeIndex, $context) {
        for ($i = $holeIndex - 1; $i >= 0; $i--) {
            if (!isset($context->usefulHoles[$i])) {
                continue;
            }

            $historyHole = $context->usefulHoles[$i];
            $indicatorA = $historyHole['indicators'][$userA] ?? 0;
            $indicatorB = $historyHole['indicators'][$userB] ?? 0;

            if ($indicatorA !== $indicatorB) {
                return $indicatorB - $indicatorA; // 降序
            }
        }

        // 回溯到初始顺序
        return $this->compareByBootStrapOrder($userA, $userB, $context);
    }

    /**
     * 通过历史输赢比较用户
     */
    private function compareByHistoryWinLoss($userA, $userB, $holeIndex, $context) {
        for ($i = $holeIndex - 1; $i >= 0; $i--) {
            if (!isset($context->usefulHoles[$i])) {
                continue;
            }

            $historyHole = $context->usefulHoles[$i];
            $winCompare = $this->compareByWinLoss($userA, $userB, $historyHole);
            if ($winCompare !== 0) {
                return $winCompare;
            }
        }

        // 回溯到初始顺序
        return $this->compareByBootStrapOrder($userA, $userB, $context);
    }

    /**
     * 按初始顺序比较用户
     */
    private function compareByBootStrapOrder($userA, $userB, $context) {
        $bootStrapOrder = $context->bootStrapOrder;
        $indexA = array_search($userA, $bootStrapOrder);
        $indexB = array_search($userB, $bootStrapOrder);
        return $indexA - $indexB;
    }

    /**
     * 将用户数组转换为排名格式
     * @param array $users 用户数组
     * @return array 排名数组 [rank => userid]
     */
    private function arrayToRanking($users) {
        $ranking = [];
        for ($i = 0; $i < count($users); $i++) {
            $ranking[$i + 1] = $users[$i];
        }
        return $ranking;
    }
}
