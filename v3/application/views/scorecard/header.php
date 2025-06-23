<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title><?= $title ?></title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Custom CSS -->
    <style>
        /* 全局样式 */
        * {
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            min-height: 100vh;
            line-height: 1.6;
            padding: 10px;
        }

        .scorecard-container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
            overflow-x: auto;
            overflow-y: hidden;
        }

        /* 标题样式 */
        .scorecard-header {
            background: white; 
            color: black;
            padding: 20px;
            text-align: center;
        }

        .scorecard-title {
            font-size: clamp(1.2rem, 4vw, 1.5rem);
            font-weight: bold;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .course-info {
            font-size: clamp(0.8rem, 2.5vw, 0.9rem);
            margin: 5px 0 0 0;
            opacity: 0.9;
        }

        /* 表格容器 */
        .table-container {
            overflow: visible;
            -webkit-overflow-scrolling: touch;
        }

        .game-date {
            margin-left: 0.7rem;
        }

        /* 记分卡表格 */
        .scorecard-table {
            width: auto;
            border-collapse: collapse;
            border-spacing: 0;
            font-size: clamp(0.6rem, 2vw, 0.7rem);
            min-width: 600px;
        }

        /* 18洞时增加最小宽度 */
        .eighteen-hole .scorecard-table {
            min-width: 1200px;
        }

        .scorecard-table th,
        .scorecard-table td {
            padding: 8px 4px;
            text-align: center;
            border: 1px solid #ddd;
            white-space: nowrap;
            vertical-align: middle;
            height: 45px;
        }

        /* 修复最后一行的双重边框问题 */
        .scorecard-table tbody tr:last-child td {
            border-bottom: none !important;
        }

        /* 确保表格本身没有额外边框 */
        .scorecard-table {
            border: none !important;
        }

        /* 表头样式 */
        .scorecard-table thead th {
            background: #4CAF50;
            color: white;
            font-weight: bold;
            font-size: clamp(0.55rem, 1.8vw, 0.6rem);
            padding: 8px 4px;
            vertical-align: middle;
        }

        /* 球洞信息样式 */
        .hole-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        }

        .hole-name {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #fff;
            color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: clamp(0.6rem, 1.8vw, 0.7rem);
            line-height: 1;
            margin: 0 auto;
        }

        .hole-par {
            font-size: clamp(0.45rem, 1.3vw, 0.5rem);
            opacity: 0.9;
            line-height: 1;
        }

        /* 标准杆行样式 */
        .par-row td {
            background: #e8f5e8;
            font-weight: bold;
            color: #2e7d32;
        }

        .par-total {
            background: #c8e6c9 !important;
            font-weight: bold;
            color: #1b5e20;
        }

        /* 球员信息样式 - 强制覆盖所有可能的冲突样式 */
        .player-info {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 8px !important;
            padding: 8px 4px !important; /* 与表格默认padding一致 */
            text-align: center !important; /* 与表格默认对齐一致 */
            background:rgb(79, 153, 79) !important; /* 淡绿色背景 */
        }

        /* 用户信息列 */
        .user-column {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            flex: 1;
        }

        .player-avatar {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
            border: 2px solid #4CAF50;
        }

        .player-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .player-name {
            font-weight: bold;
            color: #333;
            font-size: clamp(0.55rem, 1.8vw, 0.6rem);
            text-align: center;
            line-height: 1.1;
        }

        /* Tee信息列 */
        .tee-column {
            display: flex;
            align-items: center;
            justify-content: flex-end; /* 右对齐，紧贴右边框 */
            flex-shrink: 0;
        }

        .tee-indicator {
            width: 12px; /* 减少宽度 */
            height: 36px; /* 80% of 45px cell height */
            border-radius: 2px; /* 恢复正常圆角 */
            border: none; /* 完全无边框 */
        }

        /* Tee颜色 */
        .tee-indicator[data-tee="red"] {
            background: #ff4444;
        }

        .tee-indicator[data-tee="white"] {
            background: #ffffff;
            /* 暂时不设置边框，后面会加背景色来区分 */
        }

        .tee-indicator[data-tee="yellow"] {
            background: #ffeb3b;
        }

        .tee-indicator[data-tee="blue"] {
            background: #2196f3;
        }

        .tee-indicator[data-tee="black"] {
            background: #424242;
        }

        .tee-indicator[data-tee="gold"] {
            background: #ffd700;
        }

        .tee-indicator[data-tee="green"] {
            background: #4caf50;
        }

        /* 成绩单元格样式 */
        .score-cell {
            font-weight: bold;
            font-size: clamp(0.7rem, 2.2vw, 0.8rem);
            min-width: 30px;
        }

        .score-shape {
            display: inline-block;
            width: 28px;
            height: 28px;
            line-height: 28px;
            border-radius: 50%;
            text-align: center;
            margin: 0 auto 5px;
            vertical-align: middle;
        }

        /* 成绩颜色编码 - 保持简洁 */
        .score-eagle {
            color: #ffffff;
            background-color: #ff0000;
            font-weight: bold;
        }

        .score-birdie {
            background: #ffffff !important;
            color: #ff0000;
            font-weight: bold;
            border: 1px solid #ff0000;
        }

        .score-par {
            background: transparent;
            color: #0d6efd; /* blue */
            border: none;
            border-radius: 0;
            width: auto;
            height: auto;
            line-height: normal;
        }

        .score-bogey {
            background: white !important;
            color:  black;
            font-weight: bold;
            border: 1px solid #333;
            border-radius: 0;
        }

        .score-double-bogey {
            background:rgb(135, 132, 132) !important;
            color:  #ffffff;
            font-weight: bold;
        }

        .score-triple-bogey {
            background:rgb(56, 54, 54) !important;
            color: white;
            font-weight: bold;
        }

        
        /* 总分样式 */
        .total-cell {
            font-weight: bold;
            font-size: clamp(0.7rem, 2.2vw, 0.8rem);
            color: white;
        }

        .final-score {
            font-size: clamp(0.8rem, 2.5vw, 0.9rem);
        }

        .legend {
            width: 100%;
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #ddd;
            white-space: nowrap;
            overflow-x: auto;
        }

        .legend .row {
            display: flex;
            flex-wrap: nowrap;
            justify-content: center;
        }

        /* 球员行样式 */
        
 
         /* 响应式设计 */
        @media (max-width: 1024px) {
            .scorecard-table {
                font-size: 0.6rem;
            }

            .eighteen-hole .scorecard-table {
                min-width: 1000px;
            }

            .scorecard-table th,
            .scorecard-table td {
                padding: 6px 2px;
                height: 40px;
            }

            .player-avatar {
                width: 20px;
                height: 20px;
            }

            .player-name {
                font-size: 0.6rem;
            }

            /* .player-info 不设置特殊样式，使用表格默认 */

            .tee-indicator {
                width: 10px;
                height: 32px; /* 80% of 40px */
            }
            
            .hole-name {
                width: 25px;
                height: 25px;
                font-size: 0.6rem;
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 5px;
            }

            .scorecard-title {
                font-size: 1.2rem;
            }

            .scorecard-table {
                font-size: 0.55rem;
            }

            .eighteen-hole .scorecard-table {
                min-width: 900px;
            }

            .scorecard-table th,
            .scorecard-table td {
                padding: 5px 2px;
                height: 35px;
            }

            .player-avatar {
                width: 18px;
                height: 18px;
            }

            .player-name {
                font-size: 0.55rem;
            }

            /* .player-info 不设置特殊样式，使用表格默认 */

            .tee-indicator {
                width: 9px;
                height: 28px; /* 80% of 35px */
            }

            .hole-name {
                width: 22px;
                height: 22px;
                font-size: 0.55rem;
            }
        }

        @media (max-width: 480px) {
            .scorecard-table {
                font-size: 0.5rem;
            }

            .eighteen-hole .scorecard-table {
                min-width: 800px;
            }

            .scorecard-table th,
            .scorecard-table td {
                padding: 4px 1px;
                height: 30px;
            }

            .scorecard-title {
                font-size: 1rem;
            }

            .course-info {
                font-size: 0.8rem;
            }

            /* .player-info 不设置特殊样式，使用表格默认 */

            .player-avatar {
                width: 16px;
                height: 16px;
            }

            .tee-indicator {
                width: 8px;
                height: 24px; /* 80% of 30px */
            }

            .hole-name {
                width: 20px;
                height: 20px;
                font-size: 0.5rem;
            }
        }

        /* 横屏优化 */
        @media (orientation: landscape) and (max-height: 500px) {
            .scorecard-header {
                padding: 10px;
            }

            .scorecard-title {
                font-size: 1.1rem;
            }

            .course-info {
                font-size: 0.8rem;
            }

            .scorecard-table {
                font-size: 0.6rem;
            }
        }

        /* 滚动条样式 */
        .table-container::-webkit-scrollbar {
            height: 8px;
        }

        .table-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }

        .table-container::-webkit-scrollbar-thumb {
            background: #4CAF50;
            border-radius: 10px;
        }

        .table-container::-webkit-scrollbar-thumb:hover {
            background: #45a049;
        }
    </style>
</head>

<body>