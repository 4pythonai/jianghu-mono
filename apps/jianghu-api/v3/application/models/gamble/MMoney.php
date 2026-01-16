<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MMoney extends CI_Model {

    /**
     * 
     * 实际比赛情况:
     *    如果Draw==y,但是仍然产生"交割",比如:
     *    蓝方 6 分,
     *    红发 4分,
     *    顶洞配置为Diff_2,即两分以内算"顶洞",但仍然发生了2个点的输赢.
     * 
     * 
     */

    public function setHolePointsDetail(&$hole, $context) {

        $attendersNum = count($hole['red']) + count($hole['blue']);
        if ($attendersNum == 2) {
            $this->set2PlayerHolePointsDetail($hole);
        }
        if ($attendersNum == 3) {
            $this->set3PlayerHolePointsDetail($hole);
        }
        if ($attendersNum == 4) {
            if ($context->gambleSysName == '4p-8421') {
                $this->set4Player8421HolePointsDetail($hole);
            }

            if ($context->gambleSysName == '4p-lasi') {
                $this->set4PlayerLasiHolePointsDetail($hole);
            }
        }
    }


    // 8421 4人比赛输赢金额分配
    public function set4Player8421HolePointsDetail(&$hole) {
        if (count($hole['red']) == 2 && count($hole['blue']) == 2) {


            if ($hole['winner'] == 'blue') {
                $hole['winner_detail'] = [
                    ['user_id' => $hole['blue'][0], 'computedScore' => $hole['strokedScores'][$hole['blue'][0]],  'scorePoints' => $hole['points']],
                    ['user_id' => $hole['blue'][1], 'computedScore' => $hole['strokedScores'][$hole['blue'][1]],  'scorePoints' => $hole['points']],
                ];
                $hole['failer_detail'] = [
                    ['user_id' => $hole['red'][0], 'computedScore' => $hole['strokedScores'][$hole['red'][0]],   'scorePoints' => -$hole['points']],
                    ['user_id' => $hole['red'][1], 'computedScore' => $hole['strokedScores'][$hole['red'][1]],   'scorePoints' => -$hole['points']],
                ];
            }

            if ($hole['winner'] == 'red') {
                $hole['winner_detail'] = [
                    ['user_id' => $hole['red'][0], 'computedScore' => $hole['strokedScores'][$hole['red'][0]],  'scorePoints' => $hole['points']],
                    ['user_id' => $hole['red'][1], 'computedScore' => $hole['strokedScores'][$hole['red'][1]],  'scorePoints' => $hole['points']],
                ];
                $hole['failer_detail'] = [
                    ['user_id' => $hole['blue'][0], 'computedScore' => $hole['strokedScores'][$hole['blue'][0]],   'scorePoints' => -$hole['points']],
                    ['user_id' => $hole['blue'][1], 'computedScore' => $hole['strokedScores'][$hole['blue'][1]],   'scorePoints' => -$hole['points']],
                ];
            }
        }
    }

    public function set4PlayerLasiHolePointsDetail(&$hole) {


        if ($hole['winner'] == 'blue') {
            $hole['winner_detail'] = [
                ['user_id' => $hole['blue'][0], 'computedScore' => $hole['strokedScores'][$hole['blue'][0]],  'scorePoints' => $hole['points']],
                ['user_id' => $hole['blue'][1], 'computedScore' => $hole['strokedScores'][$hole['blue'][1]],  'scorePoints' => $hole['points']],
            ];


            $hole['failer_detail'] = [
                ['user_id' => $hole['red'][0], 'computedScore' => $hole['strokedScores'][$hole['red'][0]],   'scorePoints' => -$hole['points']],
                ['user_id' => $hole['red'][1], 'computedScore' => $hole['strokedScores'][$hole['red'][1]],   'scorePoints' => -$hole['points']],
            ];
        }

        if ($hole['winner'] == 'red') {
            $hole['winner_detail'] = [
                ['user_id' => $hole['red'][0], 'computedScore' => $hole['strokedScores'][$hole['red'][0]],   'scorePoints' => $hole['points']],
                ['user_id' => $hole['red'][1], 'computedScore' => $hole['strokedScores'][$hole['red'][1]],   'scorePoints' => $hole['points']],
            ];
            $hole['failer_detail'] = [
                ['user_id' => $hole['blue'][0], 'computedScore' => $hole['strokedScores'][$hole['blue'][0]],  'scorePoints' => -$hole['points']],
                ['user_id' => $hole['blue'][1], 'computedScore' => $hole['strokedScores'][$hole['blue'][1]],  'scorePoints' => -$hole['points']],
            ];
        }
    }

    public function dutyHandler(&$hole, $context) {
        if ($context->gambleSysName == '4p-8421') {
            if (count($hole['red']) == 2 && count($hole['blue']) == 2) {
                if (array_key_exists('failer_detail', $hole)) {

                    $failer1 = $hole['failer_detail'][0]['user_id'];
                    $_8421_add_sub_max_config = $this->MIndicator8421->get8421AddSubMaxConfig($context, $failer1);
                    $f1_indicator = $this->MIndicator8421->OnePlayer8421Indicator($hole['par'], $hole['strokedScores'][$failer1], $_8421_add_sub_max_config);

                    $failer2 = $hole['failer_detail'][1]['user_id'];
                    $_8421_add_sub_max_config = $this->MIndicator8421->get8421AddSubMaxConfig($context, $failer2);
                    $f2_indicator = $this->MIndicator8421->OnePlayer8421Indicator($hole['par'], $hole['strokedScores'][$failer2], $_8421_add_sub_max_config);


                    if ($f1_indicator < 0 || $f2_indicator < 0) {
                        $dutyConfig = $context->dutyConfig;
                        $duty = $this->checkIfDuty($dutyConfig, $hole['winner_detail'], $hole['failer_detail']);
                        if ($duty) {
                            debug("需要包负分,处理负分情况");
                            $this->processDuty($hole);
                        }
                    }
                }
            }
        }
    }

    private function checkIfDuty($dutyConfig, $winners, $failers) {
        if ($dutyConfig == "NODUTY") {
            return false;
        }

        if ($dutyConfig == "DUTY_NEGATIVE") {
            return true;
        }

        if ($dutyConfig == "DUTY_DINGTOU") {
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
            $hole['failer_detail'][0]['scorePoints'] =  $hole['failer_detail'][0]['scorePoints'] + abs($hole['failer_detail'][1]['indicator']);
            $hole['failer_detail'][1]['scorePoints'] =  $hole['failer_detail'][1]['scorePoints'] - abs($hole['failer_detail'][1]['indicator']);
        }

        if ($indicator1 < 0 && $indicator2 > 0) {
            $hole['failer_detail'][0]['scorePoints'] =  $hole['failer_detail'][0]['scorePoints'] - abs($hole['failer_detail'][0]['indicator']);
            $hole['failer_detail'][1]['scorePoints'] =  $hole['failer_detail'][1]['scorePoints'] + abs($hole['failer_detail'][0]['indicator']);
        }

        // 两个人都是负分,各自承担
        if ($indicator1 < 0 && $indicator2 < 0) {
            $totalWinnerIndicator = $hole['winner_detail'][0]['indicator'] + $hole['winner_detail'][1]['indicator'];
            $hole['failer_detail'][0]['scorePoints'] =  -1 * $totalWinnerIndicator - 2 * (abs($hole['failer_detail'][0]['indicator']));
            $hole['failer_detail'][1]['scorePoints'] =  -1 * $totalWinnerIndicator - 2 * (abs($hole['failer_detail'][1]['indicator']));
        }
    }
}
