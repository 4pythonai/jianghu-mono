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
     */
    public function setRedBlueWithContext($index, &$hole, $context) {
        $attenderCount = count($context->attenders);

        if ($attenderCount == 2) {
            $this->set2RedBlue($index, $hole, $context->attenders);
        } elseif ($attenderCount == 3) {
            $this->set3RedBlue($index, $hole, $context->attenders);
        } elseif ($attenderCount == 4) {
            $this->set4RedBlue($index, $hole, $context->attenders, $context->bootStrapOrder, $context->redBlueConfig);
        }
    }

    /**
     * 设置红蓝分组 (保持向后兼容)
     * @param int $index 洞索引
     * @param array $hole 洞数据（引用传递）
     * @param array $attenders 参与赌球的人员
     * @param array $bootStrapOrder 出发顺序
     * @param string $redBlueConfig 分组配置
     * @deprecated 建议使用 setRedBlueWithContext 方法
     */
    public function setRedBlue($index, &$hole, $attenders, $bootStrapOrder, $redBlueConfig) {
        // 创建临时上下文对象
        $context = new GambleContext([
            'attenders' => $attenders,
            'bootStrapOrder' => $bootStrapOrder,
            'redBlueConfig' => $redBlueConfig,
        ]);

        return $this->setRedBlueWithContext($index, $hole, $context);
    }

    /**
     * 2人红蓝分组,一人一边
     */
    public function set2RedBlue($index, &$hole, $attenders) {
        $hole['blue'] = $attenders[0];
        $hole['red'] = $attenders[1];
    }

    /**
     * 3人红蓝分组
     */
    public function set3RedBlue($index, &$hole, $attenders) {
        // 待实现
    }

    /**
     * 4人红蓝分组
     */
    public function set4RedBlue($index, &$hole, $attenders, $bootStrapOrder, $redBlueConfig) {
        if (count($attenders) == 4) {
            if ($index == 0) {
                $hole['blue'] = [$bootStrapOrder[0], $bootStrapOrder[3]];
                $hole['red'] = [$bootStrapOrder[1], $bootStrapOrder[2]];
                $hole['debug'][] = "分组:$redBlueConfig,第一洞分组,采用出发设置";
            }
        }
    }
}
