<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

/**
 * 🔴🟢🔵  

 * 
 *            {
 *                value: 'STscore.reverse_STscore',
 *                label: '1受让成绩相同按出身受让成绩排序',
 *            },
 *            {
 *                value: 'STscore.win_loss.reverse_STscore',
 *                label: '2受让成绩相同按输赢排序，输赢相同按出身受让成绩排序',
 *            },
 *            {
 *                value: 'STscore.win_loss.reverse_win',
 *                label: '3受让成绩相同按输赢排序，输赢相同按出身受让成绩排序',
 *            },
 *            {
 *                value: 'score.reverse_score',
 *                label: '4成绩相同按出身成绩排序',
 *            },
 *            {
 *                value: 'score.win_loss.reverse_score',
 *                label: '5成绩相同按输赢排序，输赢相同按出身成绩排序',
 *            },
 *            {
 *                value: 'score.win_loss.reverse_win',
 *                label: '6成绩相同按输赢排序，输赢相同按出身输赢排序',
 *            } 
 *                
 *  排名的返回格式:
 * [ranking] => Array
 * (
 *     [1] => 93hello.
 *     [2] => 160
 *     [3] => 185
 *     [4] => 67
 * )
 */

class MRankingP4_lasi extends CI_Model {

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

        // 打印初始排名顺序
        $initialOrderInfo = [];
        foreach ($bootStrapOrder as $index => $userid) {
            $nickname = $this->getNicknameByUserid($userid, $context);
            $initialOrderInfo[] = "#{" . ($index + 1) . "} {$nickname}(ID:{$userid})";
        }
        $this->addDebug($hole, "🔴🟢🔵  :初始排名: " . implode(', ', $initialOrderInfo));

        $ranking = [];
        switch ($tieResolveConfig) {

            case 'score.reverse_score':
                $this->addDebug($hole, "🔴🟢🔵  :规则4:成绩相同按出身成绩排序");
                $ranking = $this->rankByScoreReverseScore($holeIndex, $hole, $context, $bootStrapOrder);
                break;

            case 'score.win_loss.reverse_win':
                $this->addDebug($hole, "🔴🟢🔵  :规则5:成绩相同按输赢排序，输赢相同按出身输赢排序");
                $ranking = $this->rankByScoreWinLossReverseWin($holeIndex, $hole, $context, $bootStrapOrder);
                break;

            case 'score.win_loss.reverse_score':
                $this->addDebug($hole, "🔴🟢🔵  :规则6:成绩相同按输赢排序，输赢相同按出身成绩排序");
                $ranking = $this->rankByScoreWinLossReverseScore($holeIndex, $hole, $context, $bootStrapOrder);
                break;
            default:
                debug("未知的排序规则: " . $tieResolveConfig);
                return [];
        }

        // 打印最终排名结果
        if (!empty($ranking)) {
            $finalRankingInfo = [];
            foreach ($ranking as $rank => $userid) {
                $nickname = $this->getNicknameByUserid($userid, $context);
                $finalRankingInfo[] = "#{$rank} {$nickname}(ID:{$userid})";
            }
            $this->addDebug($hole, "🎯 最终排名结果: " . implode(', ', $finalRankingInfo));
        }

        return $ranking;
    }





    /**
     *
     * 4成绩相同按出身成绩排序
     */
    private function rankByScoreReverseScore($holeIndex, &$hole, $context, $bootStrapOrder) {
        $users = $bootStrapOrder;

        // 记录排序前的状态
        $beforeSortInfo = [];
        foreach ($users as $userid) {
            $nickname = $this->getNicknameByUserid($userid, $context);
            $score = $hole['strokedScores'][$userid] ?? 0;
            $beforeSortInfo[] = "🏌️ {$nickname}(ID:{$userid}) 成绩:{$score}";
        }
        $this->addDebug($hole, "📊 排序前状态: " . implode(', ', $beforeSortInfo));

        // 按成绩排序（成绩越小越好）
        usort($users, function ($auser, $bUser) use (&$hole, $holeIndex, $context) {
            $nicknameA = $this->getNicknameByUserid($auser, $context);
            $nicknameB = $this->getNicknameByUserid($bUser, $context);
            $scoreA = $hole['strokedScores'][$auser];
            $scoreB = $hole['strokedScores'][$bUser];

            $this->addDebug($hole, "🔄 比较: {$nicknameA}(成绩:{$scoreA}) vs {$nicknameB}(成绩:{$scoreB})");

            if ($scoreA !== $scoreB) {
                $result = $scoreA - $scoreB;
                $winner = $result < 0 ? $nicknameA : $nicknameB;
                $this->addDebug($hole, "✅ 成绩不同，{$winner} 排名更高(成绩越小越好)");
                return $result;
            }

            $this->addDebug($hole, "⚖️ 成绩相同({$scoreA})，回溯历史成绩比较");
            // 成绩相同，回溯历史成绩
            return $this->compareByHistoryScore($auser, $bUser, $holeIndex, $context);
        });

        // 记录排序后的状态
        $afterSortInfo = [];
        for ($i = 0; $i < count($users); $i++) {
            $userid = $users[$i];
            $nickname = $this->getNicknameByUserid($userid, $context);
            $score = $hole['strokedScores'][$userid] ?? 0;
            $rank = $i + 1;
            $afterSortInfo[] = "#{$rank} {$nickname}(ID:{$userid}) 成绩:{$score}";
        }
        $this->addDebug($hole, "🏆 最终排名: " . implode(', ', $afterSortInfo));

        return $this->arrayToRanking($users);
    }




    /**
     *  5成绩相同按输赢排序，输赢相同按出身输赢排序
     */
    private function rankByScoreWinLossReverseWin($holeIndex, &$hole, $context, $bootStrapOrder) {
        $users = $bootStrapOrder;

        // 记录排序前的状态
        $beforeSortInfo = [];
        foreach ($users as $userid) {
            $nickname = $this->getNicknameByUserid($userid, $context);
            $score = $hole['strokedScores'][$userid] ?? 0;
            $isWinner = $this->isUserWinner($userid, $hole);
            $winStatus = $isWinner ? "🥇胜" : "🥈负";
            $beforeSortInfo[] = "🏌️ {$nickname}(ID:{$userid}) 成绩:{$score} {$winStatus}";
        }
        $this->addDebug($hole, "📊 排序前状态: " . implode(', ', $beforeSortInfo));

        // 按成绩排序
        usort($users, function ($auser, $bUser) use (&$hole, $holeIndex, $context) {
            $nicknameA = $this->getNicknameByUserid($auser, $context);
            $nicknameB = $this->getNicknameByUserid($bUser, $context);
            $scoreA = $hole['strokedScores'][$auser];
            $scoreB = $hole['strokedScores'][$bUser];

            $this->addDebug($hole, "🔄 比较: {$nicknameA}(成绩:{$scoreA}) vs {$nicknameB}(成绩:{$scoreB})");

            if ($scoreA !== $scoreB) {
                $result = $scoreA - $scoreB;
                $winner = $result < 0 ? $nicknameA : $nicknameB;
                $this->addDebug($hole, "✅ 成绩不同，{$winner} 排名更高(成绩越小越好)");
                return $result;
            }

            $this->addDebug($hole, "⚖️ 成绩相同({$scoreA})，比较输赢状态");
            // 成绩相同，按输赢排序
            $winCompare = $this->compareByWinLoss($auser, $bUser, $hole);
            if ($winCompare !== 0) {
                $winnerA = $this->isUserWinner($auser, $hole);
                $winnerB = $this->isUserWinner($bUser, $hole);
                $statusA = $winnerA ? "胜者" : "负者";
                $statusB = $winnerB ? "胜者" : "负者";
                $finalWinner = $winCompare < 0 ? $nicknameA : $nicknameB;
                $this->addDebug($hole, "🥇 {$nicknameA}({$statusA}) vs {$nicknameB}({$statusB})，{$finalWinner} 排名更高");
                return $winCompare;
            }

            $this->addDebug($hole, "🔄 输赢相同，回溯历史输赢比较");
            // 输赢相同，回溯历史输赢
            return $this->compareByHistoryWinLoss($auser, $bUser, $holeIndex, $context);
        });

        // 记录排序后的状态
        $afterSortInfo = [];
        for ($i = 0; $i < count($users); $i++) {
            $userid = $users[$i];
            $nickname = $this->getNicknameByUserid($userid, $context);
            $score = $hole['strokedScores'][$userid] ?? 0;
            $isWinner = $this->isUserWinner($userid, $hole);
            $winStatus = $isWinner ? "🥇胜" : "🥈负";
            $rank = $i + 1;
            $afterSortInfo[] = "#{$rank} {$nickname}(ID:{$userid}) 成绩:{$score} {$winStatus}";
        }
        $this->addDebug($hole, "🏆 最终排名: " . implode(', ', $afterSortInfo));

        return $this->arrayToRanking($users);
    }


    /**
     * 6成绩相同按输赢排序，输赢相同按出身成绩排序
     */
    private function rankByScoreWinLossReverseScore($holeIndex, &$hole, $context, $bootStrapOrder) {
        $users = $bootStrapOrder;

        // 记录排序前的状态
        $beforeSortInfo = [];
        foreach ($users as $userid) {
            $nickname = $this->getNicknameByUserid($userid, $context);
            $score = $hole['strokedScores'][$userid] ?? 0;
            $isWinner = $this->isUserWinner($userid, $hole);
            $winStatus = $isWinner ? "🥇胜" : "🥈负";
            $beforeSortInfo[] = "🏌️ {$nickname}(ID:{$userid}) 成绩:{$score} {$winStatus}";
        }
        $this->addDebug($hole, "📊 排序前状态: " . implode(', ', $beforeSortInfo));

        // 按成绩排序
        usort($users, function ($auser, $bUser) use (&$hole, $holeIndex, $context) {
            $nicknameA = $this->getNicknameByUserid($auser, $context);
            $nicknameB = $this->getNicknameByUserid($bUser, $context);
            $scoreA = $hole['strokedScores'][$auser];
            $scoreB = $hole['strokedScores'][$bUser];

            $this->addDebug($hole, "🔄 比较: {$nicknameA}(成绩:{$scoreA}) vs {$nicknameB}(成绩:{$scoreB})");

            if ($scoreA !== $scoreB) {
                $result = $scoreA - $scoreB;
                $winner = $result < 0 ? $nicknameA : $nicknameB;
                $this->addDebug($hole, "✅ 成绩不同，{$winner} 排名更高(成绩越小越好)");
                return $result;
            }

            $this->addDebug($hole, "⚖️ 成绩相同({$scoreA})，比较输赢状态");
            // 成绩相同，按输赢排序
            $winCompare = $this->compareByWinLoss($auser, $bUser, $hole);
            if ($winCompare !== 0) {
                $winnerA = $this->isUserWinner($auser, $hole);
                $winnerB = $this->isUserWinner($bUser, $hole);
                $statusA = $winnerA ? "胜者" : "负者";
                $statusB = $winnerB ? "胜者" : "负者";
                $finalWinner = $winCompare < 0 ? $nicknameA : $nicknameB;
                $this->addDebug($hole, "🥇 {$nicknameA}({$statusA}) vs {$nicknameB}({$statusB})，{$finalWinner} 排名更高");
                return $winCompare;
            }

            $this->addDebug($hole, "🔄 输赢相同，回溯历史成绩比较");
            // 输赢相同，回溯历史成绩
            return $this->compareByHistoryScore($auser, $bUser, $holeIndex, $context);
        });

        // 记录排序后的状态
        $afterSortInfo = [];
        for ($i = 0; $i < count($users); $i++) {
            $userid = $users[$i];
            $nickname = $this->getNicknameByUserid($userid, $context);
            $score = $hole['strokedScores'][$userid] ?? 0;
            $isWinner = $this->isUserWinner($userid, $hole);
            $winStatus = $isWinner ? "🥇胜" : "🥈负";
            $rank = $i + 1;
            $afterSortInfo[] = "#{$rank} {$nickname}(ID:{$userid}) 成绩:{$score} {$winStatus}";
        }
        $this->addDebug($hole, "🏆 最终排名: " . implode(', ', $afterSortInfo));

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
        $nicknameA = $this->getNicknameByUserid($userA, $context);
        $nicknameB = $this->getNicknameByUserid($userB, $context);

        for ($i = $holeIndex - 1; $i >= 0; $i--) {
            if (!isset($context->usefulHoles[$i])) {
                continue;
            }

            $historyHole = $context->usefulHoles[$i];
            $scoreA = $historyHole['strokedScores'][$userA];
            $scoreB = $historyHole['strokedScores'][$userB];

            // 添加到当前洞的debug信息中
            if (isset($context->usefulHoles[$holeIndex])) {
                $historyHoleName = $historyHole['holename'] ?? "洞{$i}";
                $this->addDebug($context->usefulHoles[$holeIndex], "📜 历史洞{$historyHoleName}: {$nicknameA}(成绩:{$scoreA}) vs {$nicknameB}(成绩:{$scoreB})");
            }

            if ($scoreA !== $scoreB) {
                $result = $scoreA - $scoreB;
                $winner = $result < 0 ? $nicknameA : $nicknameB;
                if (isset($context->usefulHoles[$holeIndex])) {
                    $this->addDebug($context->usefulHoles[$holeIndex], "🎯 历史成绩决定: {$winner} 排名更高");
                }
                return $result;
            }
        }

        if (isset($context->usefulHoles[$holeIndex])) {
            $this->addDebug($context->usefulHoles[$holeIndex], "🔙 历史成绩相同，回溯到出身顺序");
        }
        // 回溯到初始顺序
        return $this->compareByBootStrapOrder($userA, $userB, $context);
    }

    /**
     * 通过历史得分比较用户
     */
    private function compareByHistoryIndicator($userA, $userB, $holeIndex, $context) {
        $nicknameA = $this->getNicknameByUserid($userA, $context);
        $nicknameB = $this->getNicknameByUserid($userB, $context);

        for ($i = $holeIndex - 1; $i >= 0; $i--) {
            if (!isset($context->usefulHoles[$i])) {
                debug(" 第" . $i . " 个洞,无历史得分 ");
                $this->addDebug($context->usefulHoles[$holeIndex], "第{$i}个洞,无历史得分");
                continue;
            }

            $historyHole = $context->usefulHoles[$i];
            $indicatorA = $historyHole['indicators_8421'][$userA];
            $indicatorB = $historyHole['indicators_8421'][$userB];

            // 添加到当前洞的debug信息中
            if (isset($context->usefulHoles[$holeIndex])) {
                $historyHoleName = $historyHole['holename'] ?? "洞{$i}";
                $this->addDebug($context->usefulHoles[$holeIndex], "📜 Compare_历史洞 {$historyHoleName}: {$nicknameA}(得分:{$indicatorA}) vs {$nicknameB}(得分:{$indicatorB})");
            }

            if ($indicatorA !== $indicatorB) {
                $result = $indicatorB - $indicatorA; // 降序
                $winner = $result < 0 ? $nicknameA : $nicknameB;
                if (isset($context->usefulHoles[$holeIndex])) {
                    $this->addDebug($context->usefulHoles[$holeIndex], "🎯 历史得分决定: {$winner} 排名更高");
                }
                return $result;
            }
        }

        if (isset($context->usefulHoles[$holeIndex])) {
            $this->addDebug($context->usefulHoles[$holeIndex], "🔙 历史得分相同，回溯到出身顺序");
        }
        // 回溯到初始顺序
        return $this->compareByBootStrapOrder($userA, $userB, $context);
    }

    /**
     * 通过历史输赢比较用户
     */
    private function compareByHistoryWinLoss($userA, $userB, $holeIndex, $context) {
        $nicknameA = $this->getNicknameByUserid($userA, $context);
        $nicknameB = $this->getNicknameByUserid($userB, $context);

        for ($i = $holeIndex - 1; $i >= 0; $i--) {
            if (!isset($context->usefulHoles[$i])) {
                continue;
            }

            $historyHole = $context->usefulHoles[$i];
            $winnerA = $this->isUserWinner($userA, $historyHole);
            $winnerB = $this->isUserWinner($userB, $historyHole);
            $statusA = $winnerA ? "胜" : "负";
            $statusB = $winnerB ? "胜" : "负";

            // 添加到当前洞的debug信息中
            if (isset($context->usefulHoles[$holeIndex])) {
                $historyHoleName = $historyHole['holename'] ?? "洞{$i}";
                $this->addDebug($context->usefulHoles[$holeIndex], "📜 历史洞{$historyHoleName}: {$nicknameA}({$statusA}) vs {$nicknameB}({$statusB})");
            }

            $winCompare = $this->compareByWinLoss($userA, $userB, $historyHole);
            if ($winCompare !== 0) {
                $winner = $winCompare < 0 ? $nicknameA : $nicknameB;
                if (isset($context->usefulHoles[$holeIndex])) {
                    $this->addDebug($context->usefulHoles[$holeIndex], "🎯 历史输赢决定: {$winner} 排名更高");
                }
                return $winCompare;
            }
        }

        if (isset($context->usefulHoles[$holeIndex])) {
            $this->addDebug($context->usefulHoles[$holeIndex], "🔙 历史输赢相同，回溯到出身顺序");
        }
        // 回溯到初始顺序
        return $this->compareByBootStrapOrder($userA, $userB, $context);
    }

    /**
     * 按初始顺序比较用户
     */
    private function compareByBootStrapOrder($userA, $userB, $context) {
        $nicknameA = $this->getNicknameByUserid($userA, $context);
        $nicknameB = $this->getNicknameByUserid($userB, $context);
        $bootStrapOrder = $context->bootStrapOrder;
        $indexA = array_search($userA, $bootStrapOrder);
        $indexB = array_search($userB, $bootStrapOrder);
        $result = $indexA - $indexB;
        $winner = $result < 0 ? $nicknameA : $nicknameB;

        // 尝试添加到最近的有效洞的debug信息中
        $latestHoleIndex = count($context->usefulHoles) - 1;
        if ($latestHoleIndex >= 0 && isset($context->usefulHoles[$latestHoleIndex])) {
            $this->addDebug($context->usefulHoles[$latestHoleIndex], "🏁 出身顺序决定: {$nicknameA}(位置:{$indexA}) vs {$nicknameB}(位置:{$indexB})，{$winner} 排名更高");
        }

        return $result;
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

    /**
     * 根据用户ID获取昵称
     * @param int $userid 用户ID
     * @param GambleContext $context 赌球上下文对象
     * @return string 用户昵称，如果未找到则返回用户ID
     */
    private function getNicknameByUserid($userid, $context) {
        if (isset($context->group_info) && is_array($context->group_info)) {
            foreach ($context->group_info as $user) {
                if (isset($user['userid']) && $user['userid'] == $userid) {
                    return $user['nickname'] ?? $user['username'] ?? $userid;
                }
            }
        }
        return $userid;
    }
}
