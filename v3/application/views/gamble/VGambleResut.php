<!DOCTYPE html>
<html lang="zh-CN">



<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>赌球结果</title>
    <link rel="stylesheet" href="<?php echo config_item('web_url') . '/v3/css/gamble-result.css'; ?>">
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>高尔夫赌球结果</h1>
        </div>

        <?php if (isset($qrcode_url) && !empty($qrcode_url)): ?>
            <div class="qrcode-container">
                <div class="qrcode-title">扫码查看详情</div>
                <div class="qrcode-wrapper">
                    <img src="<?php echo $qrcode_url; ?>" alt="二维码" class="qrcode-image">
                </div>
            </div>
        <?php endif; ?>

        <div class="table-container">
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

                        // 调试：检查球员数据
                        echo "<!-- 调试：球员数据 -->";
                        echo "<!-- 球员数量: " . $player_count . " -->";
                        foreach ($players as $userid => $player) {
                            echo "<!-- 用户ID: " . $userid . ", 昵称: '" . $player['nickname'] . "' -->";
                        }

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
                    // 初始化每个球员的总金额
                    $total_money = [];
                    foreach ($players as $userid => $player) {
                        $total_money[$userid] = 0;
                    }

                    // 使用 useful_holes 而不是 holes 来获取实际的赌球结果
                    $holes_data = isset($useful_holes) ? $useful_holes : $holes;

                    // 遍历所有洞
                    if (isset($holes_data) && is_array($holes_data)):
                        foreach ($holes_data as $hole):
                            // 获取这个洞的所有球员金额
                            $hole_money = [];

                            // 初始化所有球员的金额为0
                            foreach ($players as $userid => $player) {
                                $hole_money[$userid] = 0;
                            }

                            // 处理获胜者详情
                            if (isset($hole['winner_detail']) && is_array($hole['winner_detail'])) {
                                foreach ($hole['winner_detail'] as $winner) {
                                    $userid = $winner['userid'];
                                    $money = ($winner['scoreMoney'] ?? 0) + ($winner['meatMoney'] ?? 0);
                                    $hole_money[$userid] = $money;
                                    $total_money[$userid] += $money;
                                }
                            }

                            // 处理失败者详情
                            if (isset($hole['failer_detail']) && is_array($hole['failer_detail'])) {
                                foreach ($hole['failer_detail'] as $failer) {
                                    $userid = $failer['userid'];
                                    $money = ($failer['scoreMoney'] ?? 0) + ($failer['meatMoney'] ?? 0);
                                    $hole_money[$userid] = $money;
                                    $total_money[$userid] += $money;
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
                                            <?php echo $money > 0 ? '+' : ''; ?><?php echo number_format($money, 0); ?>
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
                        <td class="hole-header">总计</td>
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
                                    <?php echo $money > 0 ? '+' : ''; ?><?php echo number_format($money, 0); ?>
                                </span>
                            </td>
                        <?php endforeach; ?>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // 动态设置表格列宽
        document.addEventListener('DOMContentLoaded', function() {
            const playerCount = <?php echo $player_count; ?>;

            // 根据屏幕宽度和球员数量动态调整列宽
            function adjustTableWidth() {
                const screenWidth = window.innerWidth;
                const tableContainer = document.querySelector('.table-container');
                const containerWidth = tableContainer.offsetWidth;

                // 根据屏幕宽度设置第一列的固定宽度
                let holeFixedWidth;
                if (screenWidth <= 375) {
                    holeFixedWidth = 50; // px - 为❓符号预留空间
                } else if (screenWidth <= 480) {
                    holeFixedWidth = 55; // px - 为❓符号预留空间
                } else if (screenWidth <= 768) {
                    holeFixedWidth = 60; // px - 为❓符号预留空间
                } else if (screenWidth >= 1200) {
                    holeFixedWidth = 90; // px - 为❓符号预留空间
                } else {
                    holeFixedWidth = 70; // px - 为❓符号预留空间
                }

                // 计算球员列的宽度（平分剩余宽度）
                const remainingWidth = containerWidth - holeFixedWidth;
                const playerWidth = remainingWidth / playerCount;

                // 设置所有洞号列的宽度（固定像素）
                const holeHeaders = document.querySelectorAll('.hole-header');
                holeHeaders.forEach(header => {
                    header.style.width = holeFixedWidth + 'px';
                });

                // 设置所有球员列的宽度（平分剩余宽度）
                const playerHeaders = document.querySelectorAll('.player-header');
                playerHeaders.forEach(header => {
                    header.style.width = playerWidth + 'px';
                });

                // 设置表格行中的单元格宽度
                const rows = document.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td, th');
                    if (cells.length > 0) {
                        cells[0].style.width = holeFixedWidth + 'px'; // 洞号列
                        for (let i = 1; i < cells.length; i++) {
                            cells[i].style.width = playerWidth + 'px'; // 球员列
                        }
                    }
                });
            }

            // 初始化表格宽度
            setTimeout(adjustTableWidth, 100); // 延迟确保DOM完全加载

            // 监听窗口大小变化
            window.addEventListener('resize', function() {
                setTimeout(adjustTableWidth, 100);
            });
        });
    </script>
</body>

</html>