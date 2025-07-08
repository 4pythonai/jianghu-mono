<?php

declare(strict_types=1);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MMoney extends CI_Model {

    public function setHoleMoneyDetail(&$hole, $dutyConfig) {

        // 参与人数
        $attendersNum = count($hole['red']) + count($hole['blue']);
        if ($hole['draw'] == 'n') {
            if ($attendersNum == 2) {
                $this->set2PlayerHoleMoneyDetail($hole);
            }
            if ($attendersNum == 3) {
                $this->set3PlayerHoleMoneyDetail($hole);
            }
            if ($attendersNum == 4) {
                $this->set4PlayerHoleMoneyDetail($hole, $dutyConfig);
            }
        }
    }


    // 4人比赛输赢金额分配
    public function set4PlayerHoleMoneyDetail(&$hole, $dutyConfig) {
        // 2:2 
        if (count($hole['red']) == 2 && count($hole['blue']) == 2) {
            if ($hole['winner'] == 'blue') {
                $hole['winner_detail'] = [
                    ['userid' => $hole['blue'][0], 'computedScore' => $hole['computedScores'][$hole['blue'][0]], 'indicator' => $hole['indicators'][$hole['blue'][0]], 'money' => $hole['points']],
                    ['userid' => $hole['blue'][1], 'computedScore' => $hole['computedScores'][$hole['blue'][1]], 'indicator' => $hole['indicators'][$hole['blue'][1]], 'money' => $hole['points']],
                ];
                $hole['failer_detail'] = [
                    ['userid' => $hole['red'][0], 'computedScore' => $hole['computedScores'][$hole['red'][0]], 'indicator' => $hole['indicators'][$hole['red'][0]], 'money' => -$hole['points']],
                    ['userid' => $hole['red'][1], 'computedScore' => $hole['computedScores'][$hole['red'][1]], 'indicator' => $hole['indicators'][$hole['red'][1]], 'money' => -$hole['points']],
                ];
            }

            if ($hole['winner'] == 'red') {
                $hole['winner_detail'] = [
                    ['userid' => $hole['red'][0], 'computedScore' => $hole['computedScores'][$hole['red'][0]], 'indicator' => $hole['indicators'][$hole['red'][0]], 'money' => $hole['points']],
                    ['userid' => $hole['red'][1], 'computedScore' => $hole['computedScores'][$hole['red'][1]], 'indicator' => $hole['indicators'][$hole['red'][1]], 'money' => $hole['points']],
                ];
                $hole['failer_detail'] = [
                    ['userid' => $hole['blue'][0], 'computedScore' => $hole['computedScores'][$hole['blue'][0]], 'indicator' => $hole['indicators'][$hole['blue'][0]], 'money' => -$hole['points']],
                    ['userid' => $hole['blue'][1], 'computedScore' => $hole['computedScores'][$hole['blue'][1]], 'indicator' => $hole['indicators'][$hole['blue'][1]], 'money' => -$hole['points']],
                ];
            }

            // 输家里面只要出现一个负分,就靠考虑下"包负分"的情况
            if ($hole['failer_detail'][0]['indicator'] < 0 || $hole['failer_detail'][1]['indicator'] < 0) {
                $duty = $this->checkIfDuty($dutyConfig, $hole['winner_detail'], $hole['failer_detail']);
                if ($duty) {
                    debug("需要包负分,处理负分情况");
                    $this->processDuty($hole);
                }
            }

            debug($hole);
        }
    }

    private function checkIfDuty($dutyConfig, $winners, $failers) {
        if ($dutyConfig == "NODUTY") {
            return false;
        }

        if ($dutyConfig == "DUTY_NEGATIVE") {
            return true;
        }

        if ($dutyConfig == "DUTY_CODITIONAL") {
            // 找到输家里面成绩最好的人（computedScore最小）
            $bestFailerScore = min($failers[0]['computedScore'], $failers[1]['computedScore']);
            // 找到赢家里面成绩最好的人（computedScore最小）
            $bestWinnerScore = min($winners[0]['computedScore'], $winners[1]['computedScore']);
            // 如果输家最好成绩 <= 赢家最好成绩，说明输家有人打得很好，需要包负分
            if ($bestFailerScore <= $bestWinnerScore) {
                return true;
            } else {
                return false;
            }
        }

        return false;
    }






    private function processDuty(&$hole) {

        // 判断输家 indicator 是否为 1正1负
        $indicator1 = $hole['failer_detail'][0]['indicator'];
        $indicator2 = $hole['failer_detail'][1]['indicator'];
        if ($indicator1 > 0 && $indicator2 < 0) {
            $hole['failer_detail'][0]['money'] =  $hole['failer_detail'][0]['money'] + abs($hole['failer_detail'][1]['indicator']);
            $hole['failer_detail'][1]['money'] =  $hole['failer_detail'][1]['money'] - abs($hole['failer_detail'][1]['indicator']);
        }

        if ($indicator1 < 0 && $indicator2 > 0) {
            $hole['failer_detail'][0]['money'] =  $hole['failer_detail'][0]['money'] - abs($hole['failer_detail'][0]['indicator']);
            $hole['failer_detail'][1]['money'] =  $hole['failer_detail'][1]['money'] + abs($hole['failer_detail'][0]['indicator']);
        }

        // 两个人都是负分,各自承担
        if ($indicator1 < 0 && $indicator2 < 0) {
            $totalWinnerIndicator = $hole['winner_detail'][0]['indicator'] + $hole['winner_detail'][1]['indicator'];
            $hole['failer_detail'][0]['money'] =  -1 * $totalWinnerIndicator - 2 * (abs($hole['failer_detail'][0]['indicator']));
            $hole['failer_detail'][1]['money'] =  -1 * $totalWinnerIndicator - 2 * (abs($hole['failer_detail'][1]['indicator']));
        }
    }
}
