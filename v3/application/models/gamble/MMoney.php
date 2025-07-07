<?php

declare(strict_types=1);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MMoney extends CI_Model {

    public function setHoleMoneyDetail(&$hole) {

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
                $this->set4PlayerHoleMoneyDetail($hole);
            }
        }
    }


    // 4人比赛输赢金额分配
    public function set4PlayerHoleMoneyDetail(&$hole) {

        // 2:2 
        if (count($hole['red']) == 2 && count($hole['blue']) == 2) {
            if ($hole['winner'] == 'blue') {
                $hole['winner_detail'] = [
                    ['userid' => $hole['blue'][0], 'money' => $hole['points']],
                    ['userid' => $hole['blue'][1], 'money' => $hole['points']],
                ];
                $hole['failer_detail'] = [
                    ['userid' => $hole['red'][0], 'money' => -$hole['points']],
                    ['userid' => $hole['red'][1], 'money' => -$hole['points']],
                ];
            }

            if ($hole['winner'] == 'red') {
                $hole['winner_detail'] = [
                    ['userid' => $hole['red'][0], 'money' => $hole['points']],
                    ['userid' => $hole['red'][1], 'money' => $hole['points']],
                ];
                $hole['failer_detail'] = [
                    ['userid' => $hole['blue'][0], 'money' => -$hole['points']],
                    ['userid' => $hole['blue'][1], 'money' => -$hole['points']],
                ];
            }
        }
    }
}
