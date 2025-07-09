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
    public function setRedBlueWithContext($index, &$hole, $context, $liveUsefulHoles = null) {
        $attenderCount = count($context->attenders);

        if ($attenderCount == 2) {
            $this->set2RedBlue($index, $hole, $context);
        }
        if ($attenderCount == 3) {
            $this->set3RedBlue($index, $hole, $context);
        }
        if ($attenderCount == 4) {
            $this->set4RedBlue($index, $hole, $context, $liveUsefulHoles);
        }
    }

    /**
     * 2人红蓝分组,一人一边
     */
    public function set2RedBlue($index, &$hole, $context) {
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

    public function set4RedBlue($index, &$hole, $context, $liveUsefulHoles = null) {
        if ($index == 0) {
            if ($context->redBlueConfig == "4_乱拉") {
                $hole['blue'] = [$context->bootStrapOrder[0], $context->bootStrapOrder[3]];
                $hole['red'] = [$context->bootStrapOrder[1], $context->bootStrapOrder[2]];
                $hole['debug'][] = "分组:{$context->redBlueConfig},第一洞分组,采用出发设置";
            }

            if ($context->redBlueConfig == "4_固拉") {
                $hole['blue'] = [$context->bootStrapOrder[0], $context->bootStrapOrder[1]];
                $hole['red'] = [$context->bootStrapOrder[2], $context->bootStrapOrder[3]];
                $hole['debug'][] = "分组:{$context->redBlueConfig},第一洞分组,采用出发设置";
            }

            if ($context->redBlueConfig == "4_高手不见面") {
                $hole['blue'] = [$context->bootStrapOrder[0], $context->bootStrapOrder[2]];
                $hole['red'] = [$context->bootStrapOrder[1], $context->bootStrapOrder[3]];
                $hole['debug'][] = "分组:{$context->redBlueConfig},第一洞分组,采用出发设置";
            }
        }
        if ($index >= 1) {
            $humanIndex   = $index + 1;
            debug("第{$humanIndex}个洞,红蓝分组:{$context->redBlueConfig}");


            if ($context->redBlueConfig == "4_乱拉") {
                $preHoleIndex = $index - 1;
                // 使用实时的 usefulHoles 数据，如果没有则回退到 context 中的数据
                $usefulHoles = $liveUsefulHoles !== null ? $liveUsefulHoles : $context->usefulHoles;
                $preHole = $usefulHoles[$preHoleIndex];

                debug("上一个洞");
                debug($preHole);
                debug("上一个洞是否有ranking：" . (isset($preHole['ranking']) ? "有" : "没有"));

                $preRank = $preHole['ranking'];
                // 由于排名格式是 [rank => userid]，可以直接通过排名获取用户ID
                $hole['blue'] = [$preRank[1], $preRank[4]];  // 第1名和第4名
                $hole['red'] = [$preRank[2], $preRank[3]];   // 第2名和第3名
                $hole['debug'][] = "分组:{$context->redBlueConfig},第{$humanIndex}洞分组, 采用上一洞{$preHoleIndex}分组";
            }
        }
    }
}
