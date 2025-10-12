<?php

/**
 * 奖励规则
 */

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MReward extends CI_Model {


    public function getAddTypeRewardValue($par, $score1, $score2, $RewardPair) {
        // 获取两个杆数对应的得分名称
        $scoreName1 = $this->getScoreName($par, $score1);
        $scoreName2 = $this->getScoreName($par, $score2);

        // 获取单个奖励值
        $getValue1 = $this->getAddRewardValue($RewardPair, $scoreName1)['rewardValue'];
        $getValue2 = $this->getAddRewardValue($RewardPair, $scoreName2)['rewardValue'];


        // 初始化返回数组
        $result = [
            'Score1' => $score1,
            'ScoreName1' => $scoreName1,
            'rewardValue1' => $getValue1,
            'Score2' => $score2,
            'ScoreName2' => $scoreName2,
            'rewardValue2' => $getValue2,
            'findCombination' => 'n',
            'finalRewardValue' => 0,
        ];


        $result['findCombination'] = 'n';
        $result['finalRewardValue'] = $getValue1 + $getValue2;

        return $result;
    }






    // 拉丝加法奖励,无组合,
    public function getLasiAddTypeRewardValue($kpiname, $color, $hole, $par, $score1, $score2, $RewardPair) {
        // 获取两个杆数对应的得分名称


        $KPI_INDICATORS = $hole['KPI_INDICATORS'];


        if (array_key_exists('best', $KPI_INDICATORS) && array_key_exists('worst', $KPI_INDICATORS)) {

            $scoreName1 = $this->getScoreName($par, $score1);
            $scoreName2 = $this->getScoreName($par, $score2);

            $kpi_best_factor = abs(intval($KPI_INDICATORS['best']['red']));
            $kpi_worst_factor = abs(intval($KPI_INDICATORS['worst']['red']));


            if ($score1 == $score2) {
                $getValue1 =  $kpi_best_factor * $this->getAddRewardValue($RewardPair, $scoreName1)['rewardValue'];
                $getValue2 = $kpi_worst_factor * $this->getAddRewardValue($RewardPair, $scoreName2)['rewardValue'];


                // 初始化返回数组
                $result = [
                    'Score1' => $score1,
                    'ScoreName1' => $scoreName1,
                    'rewardValue1' => $getValue1,
                    'Score2' => $score2,
                    'ScoreName2' => $scoreName2,
                    'rewardValue2' => $getValue2,
                    'findCombination' => 'n',
                    'finalRewardValue' => 0,
                ];
            }

            if ($score1 < $score2) { // 获取单个奖励值
                $getValue1 =  $kpi_best_factor * $this->getAddRewardValue($RewardPair, $scoreName1)['rewardValue'];
                $getValue2 = $kpi_worst_factor * $this->getAddRewardValue($RewardPair, $scoreName2)['rewardValue'];


                // 初始化返回数组
                $result = [
                    'Score1' => $score1,
                    'ScoreName1' => $scoreName1,
                    'rewardValue1' => $getValue1,
                    'Score2' => $score2,
                    'ScoreName2' => $scoreName2,
                    'rewardValue2' => $getValue2,
                    'findCombination' => 'n',
                    'finalRewardValue' => 0,
                ];
            }

            if ($score1 > $score2) { // 获取单个奖励值
                $getValue1 =  $kpi_worst_factor * $this->getAddRewardValue($RewardPair, $scoreName1)['rewardValue'];
                $getValue2 = $kpi_best_factor * $this->getAddRewardValue($RewardPair, $scoreName2)['rewardValue'];


                // 初始化返回数组
                $result = [
                    'Score1' => $score1,
                    'ScoreName1' => $scoreName1,
                    'rewardValue1' => $getValue1,
                    'Score2' => $score2,
                    'ScoreName2' => $scoreName2,
                    'rewardValue2' => $getValue2,
                    'findCombination' => 'n',
                    'finalRewardValue' => 0,
                ];
            }




            $result['findCombination'] = 'n';
            $result['finalRewardValue'] = $getValue1 + $getValue2;

            return $result;
        }

        if (array_key_exists('best', $KPI_INDICATORS) && ! array_key_exists('worst', $KPI_INDICATORS)) {


            $scoreName1 = $this->getScoreName($par, $score1);
            $scoreName2 = $this->getScoreName($par, $score2);

            $kpi_best_factor = abs(intval($KPI_INDICATORS['best']['red']));

            // 获取单个奖励值
            $getValue1 =  $kpi_best_factor * $this->getAddRewardValue($RewardPair, $scoreName1)['rewardValue'];
            $getValue2 = $kpi_best_factor * $this->getAddRewardValue($RewardPair, $scoreName2)['rewardValue'];


            // 初始化返回数组
            $result = [
                'Score1' => $score1,
                'ScoreName1' => $scoreName1,
                'rewardValue1' => $getValue1,
                'Score2' => $score2,
                'ScoreName2' => $scoreName2,
                'rewardValue2' => $getValue2,
                'findCombination' => 'n',
                'finalRewardValue' => 0,
            ];


            $result['findCombination'] = 'n';
            $result['finalRewardValue'] = $getValue1 + $getValue2;

            return $result;
        }

        if (! array_key_exists('best', $KPI_INDICATORS) && array_key_exists('worst', $KPI_INDICATORS)) {


            $scoreName1 = $this->getScoreName($par, $score1);
            $scoreName2 = $this->getScoreName($par, $score2);

            $kpi_worst_factor = abs(intval($KPI_INDICATORS['worst']['red']));

            // 获取单个奖励值
            $getValue1 =  $kpi_worst_factor * $this->getAddRewardValue($RewardPair, $scoreName1)['rewardValue'];
            $getValue2 = $kpi_worst_factor * $this->getAddRewardValue($RewardPair, $scoreName2)['rewardValue'];


            // 初始化返回数组
            $result = [
                'Score1' => $score1,
                'ScoreName1' => $scoreName1,
                'rewardValue1' => $getValue1,
                'Score2' => $score2,
                'ScoreName2' => $scoreName2,
                'rewardValue2' => $getValue2,
                'findCombination' => 'n',
                'finalRewardValue' => 0,
            ];


            $result['findCombination'] = 'n';
            $result['finalRewardValue'] = $getValue1 + $getValue2;

            return $result;
        }

        if (! array_key_exists('best', $KPI_INDICATORS) && ! array_key_exists('worst', $KPI_INDICATORS)) {

            $scoreName1 = $this->getScoreName($par, $score1);
            $scoreName2 = $this->getScoreName($par, $score2);


            // 获取单个奖励值
            $getValue1 =  $this->getAddRewardValue($RewardPair, $scoreName1)['rewardValue'];
            $getValue2 =  $this->getAddRewardValue($RewardPair, $scoreName2)['rewardValue'];


            // 初始化返回数组
            $result = [
                'Score1' => $score1,
                'ScoreName1' => $scoreName1,
                'rewardValue1' => $getValue1,
                'Score2' => $score2,
                'ScoreName2' => $scoreName2,
                'rewardValue2' => $getValue2,
                'findCombination' => 'n',
                'finalRewardValue' => 0,
            ];


            $result['findCombination'] = 'n';
            $result['finalRewardValue'] = $getValue1 + $getValue2;

            return $result;
        }
    }


    private function  ifColorWinBestFactor($color, $KPI_INDICATORS) {

        if (! array_key_exists('best', $KPI_INDICATORS)) {
            return 1;
        }

        // 某方在"头"指标上赢了
        if (intval($KPI_INDICATORS['best'][$color]) > 0) {
            return  intval($KPI_INDICATORS['best'][$color]);
        }

        // 双方在"头"指标打平
        if (intval($KPI_INDICATORS['best'][$color]) == 0) {
            return  1;
        }
    }




    private function  ifColorWinWorstFactor($color, $KPI_INDICATORS) {

        if (!array_key_exists('worst', $KPI_INDICATORS)) {
            return 1;
        }

        // 某方在"头"指标上赢了
        if (intval($KPI_INDICATORS['worst'][$color]) > 0) {
            return  intval($KPI_INDICATORS['worst'][$color]);
        }

        // 双方在"头"指标打平
        if (intval($KPI_INDICATORS['worst'][$color]) == 0) {
            return  1;
        }
    }




    // 拉丝乘法奖励,组合优先覆盖,否则2个分开计算并相乘
    public function getMultiplyTypeRewardValue($par, $score1, $score2, $RewardPair) {
        // 获取两个杆数对应的得分名称
        $scoreName1 = $this->getScoreName($par, $score1);
        $scoreName2 = $this->getScoreName($par, $score2);

        // 获取单个奖励值
        $getValue1 = $this->getMultiplyRewardFactor($RewardPair, $scoreName1)['rewardValue'];
        $getValue2 = $this->getMultiplyRewardFactor($RewardPair, $scoreName2)['rewardValue'];

        // 构建组合名称和查找组合奖励值
        $combinationName = $this->buildCombinationName($scoreName1, $scoreName2);
        $combinationValue = $this->getMultiplyRewardFactor($RewardPair, $combinationName)['rewardValue'];

        // 初始化返回数组
        $result = [
            'Score1' => $score1,
            'ScoreName1' => $scoreName1,
            'rewardValue1' => $getValue1,
            'Score2' => $score2,
            'ScoreName2' => $scoreName2,
            'rewardValue2' => $getValue2,
            'findCombination' => 'n',
            'finalRewardValue' => 1,
        ];

        // 如果找到组合奖励，返回组合值，否则返回单个值之和
        if ($combinationValue['find'] == 'y') {
            $result['findCombination'] = 'y';
            $result['finalRewardValue'] = $combinationValue['rewardValue'];
        } else {
            $result['finalRewardValue'] = $getValue1 * $getValue2;
        }

        return $result;
    }

    // 加法奖励值,没有找到返回0
    private function getAddRewardValue($RewardPair, $scoreName) {
        if ($scoreName === null) {
            return ['find' => 'n', 'rewardValue' => 0];
        }

        foreach ($RewardPair as $reward) {
            if ($reward['scoreName'] === $scoreName) {
                return ['find' => 'y', 'rewardValue' => $reward['rewardValue']];
            }
        }
        return ['find' => 'n', 'rewardValue' => 0];
    }


    // 乘法法奖励值,没有找到返回 1
    private function getMultiplyRewardFactor($RewardPair, $scoreName) {
        if ($scoreName === null) {
            return ['find' => 'n', 'rewardValue' => 1];
        }

        foreach ($RewardPair as $reward) {
            if ($reward['scoreName'] === $scoreName) {
                return ['find' => 'y', 'rewardValue' => $reward['rewardValue']];
            }
        }
        return ['find' => 'n', 'rewardValue' => 1];
    }





    private function buildCombinationName($scoreName1, $scoreName2) {
        $comboNames = [];
        if ($scoreName1 !== null) $comboNames[] = $scoreName1;
        if ($scoreName2 !== null) $comboNames[] = $scoreName2;

        if (count($comboNames) >= 2) {
            sort($comboNames);
            return implode('+', $comboNames);
        }
        return null;
    }

    private function getScoreName($par, $score) {
        // 计算差值: PAR - 实际杆数
        $diff = floatval($par) - floatval($score);

        // 按照"取更差"的原则,从最好的成绩开始判断
        // 注意: HIO/Albatross 是最好的,对应 diff >= 3 或 score <= 1
        // 特殊情况: 让杆后的成绩 <= 1,都算 Albatross/HIO
        if (floatval($score) <= 1) {
            return 'Albatross/HIO';
        }

        // 或者 diff >= 3 (例如 Par 5 打 2 杆)
        if ($diff >= 3) {
            return 'Albatross/HIO';
        } elseif ($diff >= 2) {
            return 'Eagle'; // 比 PAR 少 2 杆或更多(但不到 3 杆)
        } elseif ($diff >= 1) {
            return 'Birdie'; // 比 PAR 少 1 杆或更多(但不到 2 杆)
        } elseif ($diff >= 0) {
            return 'Par'; // 等于或略好于 PAR(但不到 1 杆)
        } else {
            // 比 PAR 差的杆数没有奖励
            return null;
        }
    }

    // 红队是否可以获得加法奖励,一定有"总指标"了
    // 奖励前置条件：'total_win' | 'total_not_fail' | 'total_ignore'

    public function  canRedHaveAddReward($hole, $rewardPreCondition) {

        if ($rewardPreCondition == 'total_ignore') {
            return true;  // 可以有奖励
        }

        if (array_key_exists('add_total', $hole['KPI_INDICATORS'])) {
            $total_kpi_name = 'add_total';
        }

        if (array_key_exists('multiply_total', $hole['KPI_INDICATORS'])) {
            $total_kpi_name = 'multiply_total';
        }

        // 总成绩赢才有奖励
        if ($rewardPreCondition == 'total_win') {
            if ($hole['KPI_INDICATORS'][$total_kpi_name]['red'] > 0) {
                return true;
            }

            if ($hole['KPI_INDICATORS'][$total_kpi_name]['red'] <= 0) {
                return false;
            }
        }

        if ($rewardPreCondition == 'total_not_fail') {
            if ($hole['KPI_INDICATORS'][$total_kpi_name]['red'] < 0) {
                return false;
            }

            if ($hole['KPI_INDICATORS'][$total_kpi_name]['red'] >= 0) {
                return true;
            }
        }
    }


    public function  canBlueHaveAddReward($hole, $rewardPreCondition) {

        if ($rewardPreCondition == 'total_ignore') {
            return true;  // 可以有奖励
        }

        if (array_key_exists('add_total', $hole['KPI_INDICATORS'])) {
            $total_kpi_name = 'add_total';
        }

        if (array_key_exists('multiply_total', $hole['KPI_INDICATORS'])) {
            $total_kpi_name = 'multiply_total';
        }

        // 总成绩赢才有奖励
        if ($rewardPreCondition == 'total_win') {
            if ($hole['KPI_INDICATORS'][$total_kpi_name]['blue'] > 0) {
                return true;
            }

            if ($hole['KPI_INDICATORS'][$total_kpi_name]['blue'] <= 0) {
                return false;
            }
        }

        if ($rewardPreCondition == 'total_not_fail') {
            if ($hole['KPI_INDICATORS'][$total_kpi_name]['blue'] < 0) {
                return false;
            }

            if ($hole['KPI_INDICATORS'][$total_kpi_name]['blue'] >= 0) {
                return true;
            }
        }
    }
}
