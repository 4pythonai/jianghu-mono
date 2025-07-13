<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>赌球结果</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            margin: 0;
            padding: 10px;
            background-color: #f5f5f5;
            font-size: 14px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
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

        .table-container {
            overflow-x: auto;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .result-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            table-layout: fixed;
        }

        .result-table th,
        .result-table td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: center;
            vertical-align: middle;
            word-wrap: break-word;
            overflow: hidden;
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
            width: 60px;
            min-width: 60px;
            position: sticky;
            left: 0;
            z-index: 11;
        }

        .player-header {
            background-color: #007bff;
            color: white;
            height: 80px;
            vertical-align: middle;
        }

        .player-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-bottom: 5px;
            object-fit: cover;
        }

        .player-name {
            color: #000000;
            font-weight: bold;
            font-size: 12px;
            line-height: 1.2;
            word-wrap: break-word;
            max-width: 100%;
            text-align: center;
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

        .team-red {
            background-color: #ffebee;
            border-left: 3px solid #f44336;
        }

        .team-blue {
            background-color: #e3f2fd;
            border-left: 3px solid #2196f3;
        }

        .total-row {
            background-color: #fff3cd;
            font-weight: bold;
            font-size: 16px;
        }

        .total-row .hole-header {
            background-color: #ffc107;
            color: #000;
        }

        /* 二维码样式 */
        .qrcode-container {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .qrcode-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
        }

        .qrcode-wrapper {
            display: inline-block;
            padding: 10px;
            background: white;
            border: 2px solid #ddd;
            border-radius: 8px;
        }

        .qrcode-image {
            display: block;
            width: 150px;
            height: 150px;
            object-fit: contain;
        }

        /* 平板设备优化 */
        @media (max-width: 1024px) {
            .container {
                padding: 10px;
            }

            .header h1 {
                font-size: 20px;
            }

            .qrcode-container {
                margin: 15px 0;
                padding: 15px;
            }

            .qrcode-title {
                font-size: 15px;
            }

            .qrcode-image {
                width: 130px;
                height: 130px;
            }

            .result-table {
                font-size: 13px;
            }

            .player-header {
                height: 70px;
            }

            .player-avatar {
                width: 35px;
                height: 35px;
            }

            .player-name {
                font-size: 11px;
            }
        }

        /* 移动端优化 */
        @media (max-width: 768px) {
            body {
                padding: 5px;
                font-size: 13px;
            }

            .container {
                padding: 8px;
                border-radius: 5px;
            }

            .header {
                padding: 15px;
                margin-bottom: 15px;
            }

            .header h1 {
                font-size: 18px;
            }

            .qrcode-container {
                margin: 10px 0;
                padding: 12px;
            }

            .qrcode-title {
                font-size: 14px;
                margin-bottom: 10px;
            }

            .qrcode-wrapper {
                padding: 8px;
            }

            .qrcode-image {
                width: 120px;
                height: 120px;
            }

            .table-container {
                margin: 15px 0;
                overflow-x: visible;
            }

            .result-table {
                font-size: 11px;
                width: 100%;
            }

            .result-table th,
            .result-table td {
                padding: 6px 2px;
                font-size: 11px;
            }

            .hole-header {
                width: 50px;
                min-width: 50px;
                font-size: 10px;
                padding: 6px 1px;
            }

            .player-header {
                padding: 6px 1px;
                height: 60px;
            }

            .player-avatar {
                width: 28px;
                height: 28px;
                margin-bottom: 3px;
            }

            .player-name {
                font-size: 9px;
                line-height: 1.1;
            }

            .total-row {
                font-size: 12px;
            }
        }

        /* 小屏幕手机优化 */
        @media (max-width: 480px) {
            body {
                padding: 2px;
                font-size: 12px;
            }

            .container {
                padding: 5px;
                margin: 2px;
            }

            .header {
                padding: 8px;
                margin-bottom: 10px;
            }

            .header h1 {
                font-size: 16px;
            }

            .qrcode-container {
                margin: 8px 0;
                padding: 10px;
            }

            .qrcode-title {
                font-size: 12px;
                margin-bottom: 8px;
            }

            .qrcode-wrapper {
                padding: 6px;
            }

            .qrcode-image {
                width: 100px;
                height: 100px;
            }

            .table-container {
                margin: 10px 0;
                overflow-x: visible;
            }

            .result-table {
                font-size: 10px;
                width: 100%;
            }

            .result-table th,
            .result-table td {
                padding: 4px 1px;
                font-size: 10px;
            }

            .hole-header {
                width: 45px;
                min-width: 45px;
                font-size: 9px;
                padding: 4px 1px;
            }

            .player-header {
                padding: 4px 1px;
                height: 50px;
            }

            .player-avatar {
                width: 24px;
                height: 24px;
                margin-bottom: 2px;
            }

            .player-name {
                font-size: 8px;
                line-height: 1.0;
            }

            .total-row {
                font-size: 11px;
            }
        }

        /* 超小屏幕优化 */
        @media (max-width: 375px) {
            .hole-header {
                width: 40px;
                min-width: 40px;
                font-size: 8px;
            }

            .player-header {
                height: 45px;
            }

            .qrcode-container {
                margin: 5px 0;
                padding: 8px;
            }

            .qrcode-title {
                font-size: 11px;
                margin-bottom: 6px;
            }

            .qrcode-wrapper {
                padding: 4px;
            }

            .qrcode-image {
                width: 90px;
                height: 90px;
            }

            .player-avatar {
                width: 22px;
                height: 22px;
            }

            .player-name {
                font-size: 7px;
            }

            .result-table th,
            .result-table td {
                padding: 3px 1px;
                font-size: 9px;
            }
        }

        /* 大屏幕优化 */
        @media (min-width: 1200px) {
            .container {
                padding: 30px;
            }

            .header h1 {
                font-size: 32px;
            }

            .qrcode-container {
                margin: 25px 0;
                padding: 25px;
            }

            .qrcode-title {
                font-size: 18px;
                margin-bottom: 20px;
            }

            .qrcode-wrapper {
                padding: 12px;
            }

            .qrcode-image {
                width: 180px;
                height: 180px;
            }

            .result-table {
                font-size: 16px;
            }

            .result-table th,
            .result-table td {
                padding: 15px 10px;
            }

            .hole-header {
                width: 80px;
                min-width: 80px;
            }

            .player-header {
                height: 90px;
            }

            .player-avatar {
                width: 45px;
                height: 45px;
            }

            .player-name {
                font-size: 14px;
            }

            .total-row {
                font-size: 18px;
            }
        }

        /* 横向滚动条美化 */
        .table-container::-webkit-scrollbar {
            height: 8px;
        }

        .table-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }

        .table-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }

        .table-container::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
    </style>
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
                                        $holename .= ' ❓';
                                    }
                                    echo $holename;
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
                    holeFixedWidth = 40; // px
                } else if (screenWidth <= 480) {
                    holeFixedWidth = 45; // px
                } else if (screenWidth <= 768) {
                    holeFixedWidth = 50; // px
                } else if (screenWidth >= 1200) {
                    holeFixedWidth = 80; // px
                } else {
                    holeFixedWidth = 60; // px
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