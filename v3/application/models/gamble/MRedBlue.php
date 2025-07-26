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
     * 4_高手不见面: (A组 第1名+B组第2名) vs (B组第1+A组第2),防止一方实力太强
     * 
     */

    public function set4RedBlue($index, &$hole, $context) {
        if ($index == 0) {
            //  乱拉 1,4名 vs 2,3名
            if ($context->redBlueConfig == "4_乱拉") {
                $hole['blue'] = [$context->bootStrapOrder[0], $context->bootStrapOrder[3]];
                $hole['red'] = [$context->bootStrapOrder[1], $context->bootStrapOrder[2]];
                $hole['debug'][] = "分组:{$context->redBlueConfig},第一洞分组,采用出发设置";
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
                $hole['debug'][] = "分组:{$context->redBlueConfig},第{$humanReabableIndex}洞分组 ";
            }

            if ($context->redBlueConfig == "4_乱拉") {
                // 使用实时的 usefulHoles 数据，如果没有则回退到 context 中的数据
                $hole['blue'] = [$preRanking[1], $preRanking[4]];
                $hole['red'] = [$preRanking[2], $preRanking[3]];
                $hole['debug'][] = "分组:{$context->redBlueConfig},第{$humanReabableIndex}洞分组,排序后 ";
            }

            if ($context->redBlueConfig == "4_高手不见面") {
                $bootStrapOrder = $context->bootStrapOrder;
                $id0 = $bootStrapOrder[0];
                $id1 = $bootStrapOrder[1];

                $preRanking = $context->usefulHoles[$index - 1]['ranking']; // 假设是 [1=>126, 2=>837590, 3=>245, 4=>246]
                // 去掉出发顺序前两位
                $filtered = [];
                foreach ($preRanking as $rank => $pid) {
                    if ($pid != $id0 && $pid != $id1) {
                        $filtered[] = $pid;
                    }
                }
                // 取最后一个
                $pairId = end($filtered);

                // 蓝组
                $hole['blue'] = [$id0, $pairId];
                // 红组
                $hole['red'] = [];
                foreach ($bootStrapOrder as $pid) {
                    if (!in_array($pid, $hole['blue'])) {
                        $hole['red'][] = $pid;
                    }
                }
                $hole['debug'][] = "分组:{$context->redBlueConfig},第" . ($index + 1) . "洞分组, 0号和上一洞剩余名次最后一名一组";
            }

            // 上一洞打平,不换边
            if ($preDraw == 'y') {
                $hole['blue'] = $preBlue;
                $hole['red'] = $preRed;
                $hole['debug'][] = "分组:上一洞打平,不换边";
            }
        }
    }
}
