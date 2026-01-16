<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MRedBlue extends CI_Model {

    /**
     * 设置红蓝分组 (使用上下文对象)
     * @param int $index 洞索引
     * @param array $hole 洞数据（引用传递）
     * @param GambleContext $context 赌球上下文对象
     * @param array $liveUsefulHoles 实时的 usefulHoles 数据（可选）
     */
    public function setRedBlueWithContext($index, &$hole, $context) {
        $attenderCount = count($context->attenders);

        if ($attenderCount == 2) {
            $this->set2RedBlue($hole, $context);
        }
        if ($attenderCount == 3) {
            $this->set3RedBlue($index, $hole, $context);
        }
        if ($attenderCount == 4) {
            $this->set4RedBlue($index, $hole, $context);
        }
    }

    /**
     * 2人红蓝分组,一人一边
     */
    public function set2RedBlue(&$hole, $context) {
        $hole['blue'] = $context->attenders[0];
        $hole['red'] = $context->attenders[1];
    }

    /**
     * 3人红蓝分组
     */
    public function set3RedBlue($index, &$hole, $context) {
        // 待实现
    }


    /*
     * 4人红蓝分组
     * 
     * 4_固拉: 确定后不改变
     * 4_乱拉: (1,4 名 ) vs (2,3名),第一洞为 1,4 名,第二洞为 2,3名
     * 4_高手不见面: (A组  高手1名+普手2名) vs ( 高手2名+ 普手第1),防止一方实力太强
     * 
     */

    public function set4RedBlue($index, &$hole, $context) {
        if ($index == 0) {
            //  乱拉 1,4名 vs 2,3名
            if ($context->redBlueConfig == "4_乱拉") {
                $hole['blue'] = [$context->bootStrapOrder[0], $context->bootStrapOrder[3]];
                $hole['red'] = [$context->bootStrapOrder[1], $context->bootStrapOrder[2]];
                $hole['debug'][] = $hole['holename'] . "分组:{$context->redBlueConfig},第一洞分组,采用出发设置";
                $hole['ranking'] = $context->bootStrapOrder;
            }

            if ($context->redBlueConfig == "4_固拉") {
                $hole['blue'] = [$context->bootStrapOrder[0], $context->bootStrapOrder[1]];
                $hole['red'] = [$context->bootStrapOrder[2], $context->bootStrapOrder[3]];
                $hole['debug'][] = "分组:{$context->redBlueConfig},第一洞分组,采用出发设置";
            }

            if ($context->redBlueConfig == "4_高手不见面") {
                $hole['blue'] = [$context->bootStrapOrder[0], $context->bootStrapOrder[3]];
                $hole['red'] = [$context->bootStrapOrder[1], $context->bootStrapOrder[2]];
                $hole['debug'][] = "分组:{$context->redBlueConfig},第一洞分组,采用出发设置";
            }
        }
        if ($index >= 1) {
            $humanReabableIndex   = $index + 1;
            $preHoleIndex = $index - 1;
            $preHole = $context->usefulHoles[$preHoleIndex];
            $preRanking = $preHole['ranking'];
            $preDraw = $preHole['draw'];
            $preBlue = $preHole['blue'];
            $preRed = $preHole['red'];



            if ($context->redBlueConfig == "4_固拉") {
                // 使用实时的 usefulHoles 数据，如果没有则回退到 context 中的数据
                $hole['blue'] = [$context->bootStrapOrder[0], $context->bootStrapOrder[1]];
                $hole['red'] = [$context->bootStrapOrder[2], $context->bootStrapOrder[3]];
            }

            if ($context->redBlueConfig == "4_乱拉") {
                $hole['blue'] = [$preRanking[1], $preRanking[4]];
                $hole['red'] = [$preRanking[2], $preRanking[3]];

                // 添加debug信息
                $blueDebug = [];
                foreach ($hole['blue'] as $user_id) {
                    $nickname = $this->getNicknameByUserid($user_id, $context);
                    $blueDebug[] = $user_id . '/' . $nickname;
                }
                $redDebug = [];
                foreach ($hole['red'] as $user_id) {
                    $nickname = $this->getNicknameByUserid($user_id, $context);
                    $redDebug[] = $user_id . '/' . $nickname;
                }
                $hole['debug'][] = $hole['holename'] . "分组:{$context->redBlueConfig},第{$humanReabableIndex}洞分组, 蓝组为 " . implode(', ', $blueDebug) . ", 红组为 " . implode(', ', $redDebug);
            }


            // (A组  高手1名+普手2名) vs ( 高手2名+ 普手第1)

            if ($context->redBlueConfig == "4_高手不见面") {
                $bootStrapOrder = $context->bootStrapOrder;
                $gaoshou_1 = $bootStrapOrder[0]; // 高手第一名
                $gaoshou_2 = $bootStrapOrder[1]; // 高手第二名

                $pushou_1 = $bootStrapOrder[2]; // 普手第一名
                $pushou_2 = $bootStrapOrder[3]; // 普手第二名


                $preRanking = $context->usefulHoles[$index - 1]['ranking']; // 假设是 [1=>126, 2=>837590, 3=>245, 4=>246]

                // 去掉所有高手,得到普手
                $pushou_players = [];
                foreach ($preRanking as $rank => $pid) {
                    if ($pid != $gaoshou_1 && $pid != $gaoshou_2) {
                        $pushou_players[] = $pid;
                    }
                }

                // 去掉所有普手,得到高手
                $gaoshou_players = [];
                foreach ($preRanking as $rank => $pid) {
                    if ($pid != $pushou_1 && $pid != $pushou_2) {
                        $gaoshou_players[] = $pid;
                    }
                }

                $hole['blue'] = [$gaoshou_players[0], $pushou_players[1]];
                $hole['red'] =  [$gaoshou_players[1], $pushou_players[0]];

                $gaoshou_1_nickname = $this->getNicknameByUserid($gaoshou_players[0], $context);
                $gaoshou_2_nickname = $this->getNicknameByUserid($gaoshou_players[1], $context);
                $pushou_1_nickname = $this->getNicknameByUserid($pushou_players[0], $context);
                $pushou_2_nickname = $this->getNicknameByUserid($pushou_players[1], $context);

                $hole['debug'][] = $hole['holename'] . " 高手第一名为 {$gaoshou_1_nickname}, 普手第二名为 {$pushou_2_nickname}, 分配为蓝组";
                $hole['debug'][] = $hole['holename'] . " 高手第二名为 {$gaoshou_2_nickname}, 普手第一名为 {$pushou_1_nickname}, 分配为红组";
            }

            // 上一洞打平,不换边
            if ($preDraw == 'y') {
                $hole['blue'] = $preBlue;
                $hole['red'] = $preRed;
                $hole['debug'][] = "分组:上一洞打平,不换边";
            }
        }
    }


    private function addDebug(&$hole, $message) {
        if (!isset($hole['debug'])) {
            $hole['debug'] = [];
        }
        $hole['debug'][] = $message;
    }


    private function getNicknameByUserid($user_id, $context) {
        if (isset($context->group_info) && is_array($context->group_info)) {
            foreach ($context->group_info as $user) {
                if (isset($user['user_id']) && $user['user_id'] == $user_id) {
                    return $user['nickname'] ?? $user['username'] ?? $user_id;
                }
            }
        }
        return $user_id;
    }
}
