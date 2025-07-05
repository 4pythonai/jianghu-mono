<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>赌球结果 - <?php echo $meta['gamble_type']; ?></title>
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }

        .container {
            max-width: 1400px;
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

        .header .meta-info {
            margin-top: 10px;
            font-size: 14px;
            opacity: 0.9;
        }

        .result-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
        }

        .result-table th,
        .result-table td {
            border: 1px solid #ddd;
            padding: 8px;
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

        .result-table .hole-header {
            background-color: #e9ecef;
            font-weight: bold;
            width: 60px;
        }

        .result-table .player-header {
            background-color: #007bff;
            color: white;
            min-width: 120px;
        }

        .result-table .summary-row {
            background-color: #fff3cd;
            font-weight: bold;
        }

        .player-cell {
            min-width: 100px;
        }

        .score-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        }

        .score-main {
            font-weight: bold;
            font-size: 14px;
        }

        .score-detail {
            font-size: 10px;
            color: #666;
        }

        .point-positive {
            color: #28a745;
            font-weight: bold;
            text-decoration: underline;
        }

        .point-negative {
            color: #dc3545;
            font-weight: bold;
            text-decoration: underline;
        }

        .point-zero {
            color: #6c757d;
            text-decoration: underline;
        }

        .team-blue {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
        }

        .team-red {
            background-color: #ffebee;
            border-left: 4px solid #f44336;
        }

        .baodong {
            background-color: #fff3e0;
            border: 2px dashed #ff9800;
        }

        .draw-hole {
            background-color: #f0f0f0;
            font-style: italic;
        }

        .meat-indicator {
            background-color: #ffcdd2;
            font-weight: bold;
        }

        .summary-section {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .summary-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }

        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #007bff;
        }

        .summary-item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }

        .legend {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .legend h4 {
            margin: 0 0 10px 0;
        }

        .legend-item {
            display: inline-block;
            margin: 5px 10px;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
        }

        @media (max-width: 768px) {
            .result-table {
                font-size: 10px;
            }

            .summary-section {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>高尔夫赌球结果</h1>
            <div class="meta-info">
                游戏ID: <?php echo $meta['gameid']; ?> |
                赌球类型: <?php echo $meta['gamble_type']; ?> |
                计算洞数: <?php echo $meta['calculated_holes']; ?>/<?php echo $meta['total_holes']; ?> |
                生成时间: <?php echo $meta['created_at']; ?>
            </div>
        </div>

        <!-- 图例说明 -->
        <div class="legend">
            <h4>图例说明</h4>
            <span class="legend-item point-positive">+0.5 (赢)</span>
            <span class="legend-item point-negative">-0.5 (输)</span>
            <span class="legend-item point-zero">0 (平)</span>
            <span class="legend-item team-blue">蓝队</span>
            <span class="legend-item team-red">红队</span>
            <span class="legend-item baodong">包洞</span>
            <span class="legend-item draw-hole">顶洞</span>
            <span class="legend-item meat-indicator">肉</span>
        </div>

        <!-- 主结果表格 -->
        <table class="result-table">
            <thead>
                <tr>
                    <th class="hole-header">洞</th>
                    <th class="hole-header">PAR</th>
                    <th class="hole-header">状态</th>
                    <?php foreach ($players as $player): ?>
                        <th class="player-header player-cell">
                            <?php echo $player['nickname']; ?>
                            <br><small>(<?php echo $player['is_attender'] ? '参赛' : '未参赛'; ?>)</small>
                        </th>
                    <?php endforeach; ?>
                    <th class="hole-header">队伍情况</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($holes as $hole): ?>
                    <tr class="<?php echo $hole['hole_summary']['draw'] ? 'draw-hole' : ''; ?>">
                        <!-- 洞信息 -->
                        <td class="hole-header"><?php echo $hole['holename']; ?></td>
                        <td class="hole-header"><?php echo $hole['par']; ?></td>
                        <td class="hole-header">
                            <?php if ($hole['hole_summary']['draw']): ?>
                                <span class="meat-indicator">顶洞</span>
                                <?php if ($hole['hole_summary']['meat_count'] > 0): ?>
                                    <br><small>肉×<?php echo $hole['hole_summary']['meat_count']; ?></small>
                                <?php endif; ?>
                            <?php else: ?>
                                <span class="point-positive"><?php echo $hole['hole_summary']['winner_team']; ?>队胜</span>
                            <?php endif; ?>
                        </td>

                        <!-- 每个球员的详细信息 -->
                        <?php foreach ($players as $player): ?>
                            <?php
                            $detail = isset($hole['details'][$player['userid']]) ? $hole['details'][$player['userid']] : null;
                            $teamClass = '';
                            $baodongClass = '';
                            if ($detail) {
                                $teamClass = $detail['team'] == 'blue' ? 'team-blue' : 'team-red';
                                $baodongClass = $detail['is_baodong'] ? 'baodong' : '';
                            }
                            ?>
                            <td class="player-cell <?php echo $teamClass; ?> <?php echo $baodongClass; ?>">
                                <?php if ($detail): ?>
                                    <div class="score-info">
                                        <!-- 实际成绩 -->
                                        <div class="score-main"><?php echo $detail['score']; ?></div>

                                        <!-- 让杆信息 -->
                                        <?php if ($detail['stroking_value'] > 0): ?>
                                            <div class="score-detail">
                                                让<?php echo $detail['stroking_value']; ?>杆 → <?php echo $detail['stroking_score']; ?>
                                            </div>
                                        <?php endif; ?>

                                        <!-- 输赢点数 -->
                                        <div class="score-detail">
                                            <span class="<?php
                                                            if ($detail['point'] > 0) echo 'point-positive';
                                                            elseif ($detail['point'] < 0) echo 'point-negative';
                                                            else echo 'point-zero';
                                                            ?>">
                                                <?php echo $detail['point'] > 0 ? '+' : ''; ?><?php echo $detail['point']; ?>
                                            </span>
                                        </div>

                                        <!-- 队伍标识 -->
                                        <div class="score-detail">
                                            <?php echo strtoupper($detail['team']); ?>
                                        </div>

                                        <!-- 包洞说明 -->
                                        <?php if ($detail['is_baodong']): ?>
                                            <div class="score-detail" style="color: #ff9800;">
                                                包洞
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                <?php else: ?>
                                    <div class="score-info">
                                        <div class="score-main">-</div>
                                        <div class="score-detail">未参赛</div>
                                    </div>
                                <?php endif; ?>
                            </td>
                        <?php endforeach; ?>

                        <!-- 队伍情况 -->
                        <td>
                            <div style="font-size: 11px;">
                                <div style="color: #2196f3;">
                                    蓝队: <?php echo $hole['team_summary']['blue']['indicator']; ?>
                                    (<?php echo $hole['team_summary']['blue']['total_point'] > 0 ? '+' : ''; ?><?php echo $hole['team_summary']['blue']['total_point']; ?>)
                                </div>
                                <div style="color: #f44336;">
                                    红队: <?php echo $hole['team_summary']['red']['indicator']; ?>
                                    (<?php echo $hole['team_summary']['red']['total_point'] > 0 ? '+' : ''; ?><?php echo $hole['team_summary']['red']['total_point']; ?>)
                                </div>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; ?>

                <!-- 汇总行 -->
                <tr class="summary-row">
                    <td colspan="3"><strong>总计</strong></td>
                    <?php foreach ($players as $player): ?>
                        <td class="player-cell">
                            <div class="score-info">
                                <div class="score-main">
                                    <span class="<?php
                                                    $total = $summary['total_points'][$player['userid']] ?? 0;
                                                    if ($total > 0) echo 'point-positive';
                                                    elseif ($total < 0) echo 'point-negative';
                                                    else echo 'point-zero';
                                                    ?>">
                                        <?php echo $total > 0 ? '+' : ''; ?><?php echo $total; ?>
                                    </span>
                                </div>
                                <div class="score-detail">
                                    平均: <?php echo $summary['statistics']['average_score'][$player['userid']] ?? 0; ?>
                                </div>
                            </div>
                        </td>
                    <?php endforeach; ?>
                    <td>
                        <div style="font-size: 11px;">
                            <div style="color: #2196f3;">
                                蓝队: <?php echo $summary['team_points']['blue'] > 0 ? '+' : ''; ?><?php echo $summary['team_points']['blue']; ?>
                            </div>
                            <div style="color: #f44336;">
                                红队: <?php echo $summary['team_points']['red'] > 0 ? '+' : ''; ?><?php echo $summary['team_points']['red']; ?>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- 详细汇总信息 -->
        <div class="summary-section">
            <div class="summary-card">
                <h3>队伍汇总</h3>
                <div class="summary-item">
                    <span>蓝队总分:</span>
                    <span class="<?php echo $summary['team_points']['blue'] > 0 ? 'point-positive' : ($summary['team_points']['blue'] < 0 ? 'point-negative' : 'point-zero'); ?>">
                        <?php echo $summary['team_points']['blue'] > 0 ? '+' : ''; ?><?php echo $summary['team_points']['blue']; ?>
                    </span>
                </div>
                <div class="summary-item">
                    <span>红队总分:</span>
                    <span class="<?php echo $summary['team_points']['red'] > 0 ? 'point-positive' : ($summary['team_points']['red'] < 0 ? 'point-negative' : 'point-zero'); ?>">
                        <?php echo $summary['team_points']['red'] > 0 ? '+' : ''; ?><?php echo $summary['team_points']['red']; ?>
                    </span>
                </div>
                <div class="summary-item">
                    <span>总肉数:</span>
                    <span><?php echo $summary['meat_summary']['total_meat']; ?></span>
                </div>
            </div>

            <div class="summary-card">
                <h3>统计信息</h3>
                <div class="summary-item">
                    <span>已计算洞数:</span>
                    <span><?php echo $summary['statistics']['total_calculated_holes']; ?></span>
                </div>
                <div class="summary-item">
                    <span>顶洞数:</span>
                    <span><?php echo $summary['statistics']['draw_holes']; ?></span>
                </div>
                <div class="summary-item">
                    <span>已决洞数:</span>
                    <span><?php echo $summary['statistics']['decided_holes']; ?></span>
                </div>
                <div class="summary-item">
                    <span>包洞次数:</span>
                    <span><?php echo $summary['special_events']['baodong_count']; ?></span>
                </div>
            </div>
        </div>
    </div>
</body>

</html>