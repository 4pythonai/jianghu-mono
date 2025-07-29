<html lang="zh-CN">

<head>
    <title>赌球结果</title>
</head>

<body>
    <div class="container">

        <table class="result-table" id="resultTable">
            <thead>
                <tr>
                    <th class="hole-header">洞</th>
                    <?php
                    // 获取所有球员信息
                    $players = [];
                    if (isset($group_info) && is_array($group_info)) {
                        foreach ($group_info as $player) {
                            $players[$player['userid']] = $player;
                        }
                    }

                    $player_count = count($players);

                    // 显示球员姓名作为表头
                    foreach ($players as $player): ?>
                        <th class="player-header">
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                                <?php if (isset($player['cover']) && !empty($player['cover'])): ?>
                                    <img src="<?php echo $player['cover']; ?>" alt="头像" class="player-avatar">
                                <?php endif; ?>
                                <div class="player-name">
                                    <?php echo $player['nickname']; ?>
                                </div>
                            </div>
                        </th>
                    <?php endforeach; ?>
                </tr>
            </thead>
            <tbody>
                <?php
                // 初始化每个球员的总金额和总锅
                $total_money = [];
                $total_donated = [];
                foreach ($players as $userid => $player) {
                    $total_money[$userid] = 0;
                    $total_donated[$userid] = 0;
                }

                // 使用 useful_holes 而不是 holes 来获取实际的赌球结果
                $holes_data = isset($useful_holes) ? $useful_holes : $holes;

                // 遍历所有洞
                if (isset($holes_data) && is_array($holes_data)):
                    foreach ($holes_data as $hole):
                        // 获取这个洞的所有球员金额和锅
                        $hole_money = [];
                        $hole_donated = [];

                        // 初始化所有球员的金额和锅为0
                        foreach ($players as $userid => $player) {
                            $hole_money[$userid] = 0;
                            $hole_donated[$userid] = 0;
                        }

                        // 处理获胜者详情
                        if (isset($hole['winner_detail']) && is_array($hole['winner_detail'])) {
                            foreach ($hole['winner_detail'] as $winner) {
                                $userid = $winner['userid'];
                                $money = $winner['final_points'] ?? 0;
                                $donated = $winner['pointsDonated'] ?? 0;
                                $hole_money[$userid] = $money;
                                $hole_donated[$userid] = $donated;
                                $total_money[$userid] += $money;
                                $total_donated[$userid] += $donated;
                            }
                        }

                        // 处理失败者详情
                        if (isset($hole['failer_detail']) && is_array($hole['failer_detail'])) {
                            foreach ($hole['failer_detail'] as $failer) {
                                $userid = $failer['userid'];
                                $money = $failer['final_points'] ?? 0;
                                $donated = $failer['pointsDonated'] ?? 0;
                                $hole_money[$userid] = $money;
                                $hole_donated[$userid] = $donated;
                                $total_money[$userid] += $money;
                                $total_donated[$userid] += $donated;
                            }
                        }
                ?>
                        <tr>
                            <td class="hole-header">
                                <?php
                                $holename = $hole['holename'] ?? $hole['id'] ?? '';
                                if (isset($hole['draw']) && $hole['draw'] === 'y') {
                                    echo '<div class="hole-header-inner"><span title="平局">' . $holename . '❓</span></div>';
                                } else {
                                    echo '<div class="hole-header-inner">' . $holename . '</div>';
                                }
                                ?>
                            </td>
                            <?php foreach ($players as $userid => $player): ?>
                                <td class="<?php
                                            // 确定球员所属的队伍
                                            $teamClass = '';
                                            if (isset($hole['red']) && is_array($hole['red']) && in_array($userid, $hole['red'])) {
                                                $teamClass = 'team-red';
                                            } elseif (isset($hole['blue']) && is_array($hole['blue']) && in_array($userid, $hole['blue'])) {
                                                $teamClass = 'team-blue';
                                            }
                                            echo $teamClass;
                                            ?>">
                                    <?php
                                    $money = $hole_money[$userid];
                                    $class = '';
                                    if ($money > 0) {
                                        $class = 'money-positive';
                                    } elseif ($money < 0) {
                                        $class = 'money-negative';
                                    } else {
                                        $class = 'money-zero';
                                    }
                                    ?>
                                    <span class="<?php echo $class; ?>">
                                        <?php echo $money > 0 ? '+' : ''; ?><?php echo $money; ?>
                                    </span>
                                </td>
                            <?php endforeach; ?>
                        </tr>
                <?php
                    endforeach;
                endif;
                ?>

                <!-- 总计行 -->
                <tr class="total-row">
                    <td class="hole-header">总成绩</td>
                    <?php foreach ($players as $userid => $player): ?>
                        <td>
                            <?php
                            $money = $total_money[$userid];
                            $class = '';
                            if ($money > 0) {
                                $class = 'money-positive';
                            } elseif ($money < 0) {
                                $class = 'money-negative';
                            } else {
                                $class = 'money-zero';
                            }
                            ?>
                            <span class="<?php echo $class; ?>">
                                <?php echo $money > 0 ? '+' : ''; ?><?php echo $money; ?>
                            </span>
                        </td>
                    <?php endforeach; ?>
                </tr>

                <!-- 锅汇总行 -->
                <tr class="total-row">
                    <td class="hole-header">总锅</td>
                    <?php foreach ($players as $userid => $player): ?>
                        <td>
                            <?php
                            $donated = $total_donated[$userid];
                            $class = '';
                            if ($donated > 0) {
                                $class = 'money-positive';
                            } elseif ($donated < 0) {
                                $class = 'money-negative';
                            } else {
                                $class = 'money-zero';
                            }
                            ?>
                            <span class="<?php echo $class; ?>">
                                <?php echo $donated > 0 ? '+' : ''; ?><?php echo $donated; ?>
                            </span>
                        </td>
                    <?php endforeach; ?>
                </tr>
            </tbody>
        </table>
    </div>
    </div>
</body>

</html>