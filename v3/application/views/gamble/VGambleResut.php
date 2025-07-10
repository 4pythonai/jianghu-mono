<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>赌球结果</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
        }

        .debug-info {
            background: #f8f9fa;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            border: 1px solid #ddd;
            font-size: 12px;
            max-height: 400px;
            overflow-y: auto;
        }

        .result-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
        }

        .result-table th,
        .result-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: center;
            vertical-align: middle;
        }

        .result-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .hole-header {
            background-color: #e9ecef;
            font-weight: bold;
            width: 100px;
        }

        .player-header {
            background-color: #007bff;
            color: white;
            min-width: 150px;
        }

        .player-avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            margin-bottom: 5px;
        }

        .money-positive {
            color: #28a745;
            font-weight: bold;
        }

        .money-negative {
            color: #dc3545;
            font-weight: bold;
        }

        .money-zero {
            color: #6c757d;
        }

        .total-row {
            background-color: #fff3cd;
            font-weight: bold;
            font-size: 16px;
        }

        @media (max-width: 768px) {
            .result-table {
                font-size: 12px;
            }

            .result-table th,
            .result-table td {
                padding: 8px;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>高尔夫赌球结果</h1>
        </div>

        <!-- 调试信息 -->
        <div class="debug-info">
            <h3>调试信息：</h3>

            <h4>useful_holes 数据（前2个）：</h4>
            <pre><?php
                    if (isset($useful_holes)) {
                        echo "useful_holes 数组长度: " . count($useful_holes) . "\n";
                        print_r(array_slice($useful_holes, 0, 2));
                    } else {
                        echo "useful_holes 变量不存在";
                    }
                    ?></pre>

            <h4>测试球员信息：</h4>
            <pre><?php
                    if (isset($group_info)) {
                        foreach ($group_info as $player) {
                            echo "用户ID: " . $player['userid'] . "\n";
                            echo "昵称: " . $player['nickname'] . "\n";
                            echo "头像: " . $player['cover'] . "\n";
                            echo "---\n";
                        }
                    }
                    ?></pre>
        </div>

        <table class="result-table">
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

                    // 调试：检查球员数据
                    echo "<!-- 调试：球员数据 -->";
                    echo "<!-- 球员数量: " . count($players) . " -->";
                    foreach ($players as $userid => $player) {
                        echo "<!-- 用户ID: " . $userid . ", 昵称: '" . $player['nickname'] . "' -->";
                    }

                    // 显示球员姓名作为表头
                    foreach ($players as $player): ?>
                        <th class="player-header">
                            <?php if (isset($player['cover']) && !empty($player['cover'])): ?>
                                <img src="<?php echo $player['cover']; ?>" alt="头像" class="player-avatar"><br>
                            <?php endif; ?>
                            <div style="color: black; font-weight: bold;">
                                <?php echo $player['nickname']; ?>
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
                            <td class="hole-header"><?php echo $hole['holename'] ?? $hole['id'] ?? ''; ?></td>
                            <?php foreach ($players as $userid => $player): ?>
                                <td>
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
                    <td>总计</td>
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
</body>

</html>