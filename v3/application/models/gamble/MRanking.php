<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MRanking extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    /**
     * 对参赛者进行排名，不允许并列 (使用上下文对象)
     * @param array $hole 当前洞的数据（包含indicators）
     * @param int $holeIndex 当前洞的索引
     * @param GambleContext $context 赌球上下文对象
     * @return array 排名结果 [userid => rank]
     */
    public function rankAttendersWithContext(&$hole, $holeIndex, $context) {
        if ($context->gambleSysName == '8421') {
            $participants = array_keys($hole['indicators']);
            $ranking = $this->calculateRanking($participants, $holeIndex, $hole, $context->usefulHoles, $context->bootStrapOrder);
            $hole['ranking'] = $ranking;

            // 添加调试信息
            $this->addDebugLog($hole, "排名结果: " . json_encode($ranking, JSON_UNESCAPED_UNICODE));

            return $ranking;
        }

        return [];
    }

    /**
     * 计算参赛者排名
     * @param array $participants 参赛者用户ID数组
     * @param int $currentHoleIndex 当前洞的索引
     * @param array $currentHole 当前洞的数据
     * @param array $usefulHoles 历史洞数据
     * @param array $bootStrapOrder 出发顺序
     * @return array 排名结果 [userid => rank]
     */
    private function calculateRanking($participants, $currentHoleIndex, $currentHole, $usefulHoles, $bootStrapOrder) {
        // 按当前洞indicators降序排列（分数越高排名越靠前）
        $sorted = $participants;
        usort($sorted, function ($aKey, $bKey) use ($currentHole) {
            return $currentHole['indicators'][$bKey] <=> $currentHole['indicators'][$aKey];
        });

        // 检查并列情况并处理
        $finalRanking = $this->resolveTies($sorted, $currentHoleIndex, $currentHole, $usefulHoles, $bootStrapOrder);

        // 转换为 userid => rank 格式
        $ranking = [];
        foreach ($finalRanking as $rank => $userid) {
            $ranking[$userid] = $rank + 1; // 排名从1开始
        }

        return $ranking;
    }

    /**
     * 解决并列问题
     * @param array $sortedParticipants 按当前洞indicators排序的参赛者
     * @param int $currentHoleIndex 当前洞索引
     * @param array $currentHole 当前洞数据
     * @param array $usefulHoles 历史洞数据
     * @param array $bootStrapOrder 出发顺序
     * @return array 最终排序的参赛者数组
     */
    private function resolveTies($sortedParticipants, $currentHoleIndex, $currentHole, $usefulHoles, $bootStrapOrder) {
        $groups = $this->groupByIndicators($sortedParticipants, $currentHole['indicators']);

        $finalOrder = [];

        foreach ($groups as $group) {
            if (count($group) == 1) {
                // 没有并列，直接添加
                $finalOrder = array_merge($finalOrder, $group);
            } else {
                // 有并列，需要回溯历史洞
                $resolvedGroup = $this->resolveGroupTies($group, $currentHoleIndex, $usefulHoles, $bootStrapOrder);
                $finalOrder = array_merge($finalOrder, $resolvedGroup);
            }
        }

        return $finalOrder;
    }

    /**
     * 按indicators分组
     * @param array $participants 参赛者数组
     * @param array $indicators indicators数据
     * @return array 分组结果
     */
    private function groupByIndicators($participants, $indicators) {
        $groups = [];
        $indicatorToGroup = [];

        foreach ($participants as $participant) {
            $indicator = $indicators[$participant];

            if (!isset($indicatorToGroup[$indicator])) {
                $indicatorToGroup[$indicator] = count($groups);
                $groups[] = [];
            }

            $groups[$indicatorToGroup[$indicator]][] = $participant;
        }

        return $groups;
    }

    /**
     * 解决单个并列组的排名
     * @param array $tiedGroup 并列的参赛者组
     * @param int $currentHoleIndex 当前洞索引
     * @param array $usefulHoles 历史洞数据
     * @param array $bootStrapOrder 出发顺序
     * @return array 解决并列后的排序
     */
    private function resolveGroupTies($tiedGroup, $currentHoleIndex, $usefulHoles, $bootStrapOrder) {
        // 从前一洞开始往前回溯
        for ($holeIndex = $currentHoleIndex - 1; $holeIndex >= 0; $holeIndex--) {
            // 检查该历史洞是否存在且已计算indicators
            if (!isset($usefulHoles[$holeIndex]) || !isset($usefulHoles[$holeIndex]['indicators'])) {
                continue; // 该洞不存在或未计算indicators，跳过
            }

            $historicalIndicators = $usefulHoles[$holeIndex]['indicators'];

            // 按历史洞的indicators排序当前并列组
            // 注意：所有参与用户都保证有数据，无需检查isset()
            usort($tiedGroup, function ($aKey, $bKey) use ($historicalIndicators) {
                return $historicalIndicators[$bKey] <=> $historicalIndicators[$aKey]; // 降序，分数高的排前面
            });

            // 检查是否成功打破并列
            if ($this->isGroupFullyResolved($tiedGroup, $historicalIndicators)) {
                return $tiedGroup;
            }

            // 如果还有部分并列，递归处理剩余的并列组
            $newGroups = $this->groupByIndicators($tiedGroup, $historicalIndicators);
            if (count($newGroups) > 1) {
                $result = [];
                foreach ($newGroups as $subGroup) {
                    if (count($subGroup) == 1) {
                        $result = array_merge($result, $subGroup);
                    } else {
                        $resolvedSubGroup = $this->resolveGroupTies($subGroup, $holeIndex, $usefulHoles, $bootStrapOrder);
                        $result = array_merge($result, $resolvedSubGroup);
                    }
                }
                return $result;
            }
        }

        // 如果回溯完所有历史洞还是并列，使用出发顺序
        return $this->resolveByStartOrder($tiedGroup, $bootStrapOrder);
    }

    /**
     * 检查组是否完全解决并列
     * @param array $group 参赛者组
     * @param array $indicators indicators数据
     * @return bool 是否完全解决并列
     */
    private function isGroupFullyResolved($group, $indicators) {
        if (count($group) <= 1) {
            return true;
        }

        $firstIndicator = $indicators[$group[0]];
        $groupCount = count($group);
        for ($i = 1; $i < $groupCount; $i++) {
            $currentIndicator = $indicators[$group[$i]];
            if ($currentIndicator == $firstIndicator) {
                return false; // 还有并列
            }
        }

        return true;
    }

    /**
     * 使用出发顺序解决最终并列
     * @param array $tiedGroup 仍然并列的参赛者组
     * @param array $bootStrapOrder 出发顺序
     * @return array 按出发顺序排序的结果
     */
    private function resolveByStartOrder($tiedGroup, $bootStrapOrder) {
        // 按照在 bootStrapOrder  中的位置排序
        // 注意：所有参与用户都保证在出发顺序中
        usort($tiedGroup, function ($aKey, $bKey) use ($bootStrapOrder) {
            $posA = array_search($aKey, $bootStrapOrder);
            $posB = array_search($bKey, $bootStrapOrder);

            // 业务逻辑验证：确保所有用户都在出发顺序中
            if ($posA === false) {
                throw new Exception("用户 $aKey 不在出发顺序 bootStrapOrder 中，业务逻辑错误！");
            }
            if ($posB === false) {
                throw new Exception("用户 $bKey 不在出发顺序 bootStrapOrder 中，业务逻辑错误！");
            }

            return $posA <=> $posB;
        });

        return $tiedGroup;
    }

    /**
     * 添加调试日志
     * @param array $hole 洞数据
     * @param string $msg 调试信息
     */
    private function addDebugLog(&$hole, $msg) {
        $hole['debug'][] = $msg;
    }
}
