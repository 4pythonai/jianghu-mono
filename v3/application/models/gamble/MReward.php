<?php

/**
 * 奖励规则
 */

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MReward extends CI_Model {

    public function getRewardFactor($par, $score1, $score2, $RewardPair, $rewardType) {
        // 获取两个杆数对应的得分名称
        $scoreName1 = $this->getScoreName($par, $score1);
        $scoreName2 = $this->getScoreName($par, $score2);

        // 初始化返回数组
        $result = [
            'Score1' => $score1,
            'ScoreName1' => $scoreName1,
            'rewardValue1' => 0,
            'Score2' => $score2,
            'ScoreName2' => $scoreName2,
            'rewardValue2' => 0,
            'findCombination' => 'n',
            'finalRewardValue' => 0,
            'rewardType' => $rewardType
        ];

        // 如果两个杆数都无法转换为有效得分名称，返回默认值
        if ($scoreName1 === null && $scoreName2 === null) {
            $result['finalRewardValue'] = ($rewardType == 'multiply') ? 1 : 0;
            return $result;
        }

        // 构建组合键（排序确保一致性）
        $comboNames = [];
        if ($scoreName1 !== null) $comboNames[] = $scoreName1;
        if ($scoreName2 !== null) $comboNames[] = $scoreName2;

        // 如果有两个有效名称，尝试查找组合奖励
        if (count($comboNames) >= 2) {
            sort($comboNames);
            $comboKey = implode('+', $comboNames);

            // 查找组合奖励
            foreach ($RewardPair as $reward) {
                if ($reward['scoreName'] === $comboKey) {
                    // 找到组合奖励，设置单个奖励值并返回
                    $this->setIndividualRewards($result, $RewardPair, $scoreName1, $scoreName2);
                    $result['findCombination'] = 'y';
                    $result['finalRewardValue'] = $reward['rewardValue'];
                    return $result;
                }
            }
        }

        // 没有找到组合奖励，设置单个奖励值并计算最终值
        $this->setIndividualRewards($result, $RewardPair, $scoreName1, $scoreName2);

        // 根据奖励类型计算最终奖励值
        if ($rewardType === 'add') {
            $result['finalRewardValue'] = $result['rewardValue1'] + $result['rewardValue2'];
        } else { // multiply
            $result['finalRewardValue'] = $result['rewardValue1'] * $result['rewardValue2'];
        }

        return $result;
    }

    private function setIndividualRewards(&$result, $RewardPair, $scoreName1, $scoreName2) {
        // 设置单个奖励值
        if ($scoreName1 !== null) {
            foreach ($RewardPair as $reward) {
                if ($reward['scoreName'] === $scoreName1) {
                    $result['rewardValue1'] = $reward['rewardValue'];
                    break;
                }
            }
        } else {
            // 对于比 PAR 差的成绩，根据奖励类型设置默认值
            $result['rewardValue1'] = ($result['rewardType'] === 'multiply') ? 1 : 0;
        }

        if ($scoreName2 !== null) {
            foreach ($RewardPair as $reward) {
                if ($reward['scoreName'] === $scoreName2) {
                    $result['rewardValue2'] = $reward['rewardValue'];
                    break;
                }
            }
        } else {
            // 对于比 PAR 差的成绩，根据奖励类型设置默认值
            $result['rewardValue2'] = ($result['rewardType'] === 'multiply') ? 1 : 0;
        }
    }

    private function getScoreName($par, $score) {
        // HIO (一杆进洞) 是最特殊的情况，优先判断
        if ($score === 1) {
            return 'Albatross/HIO';
        }

        $diff = $score - $par;

        switch ($diff) {
            case -3:
                return 'Albatross/HIO'; // 例如 Par 5 打 2 杆
            case -2:
                return 'Eagle';
            case -1:
                return 'Birdie';
            case 0:
                return 'Par';
            default:
                // 比 PAR 差的杆数没有奖励
                return null;
        }
    }
}
