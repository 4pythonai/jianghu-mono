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
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            min-height: 100vh;
            line-height: 1.6;
            padding: 10px;
        }

        .container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        /* 标题样式 */
        .scorecard-header {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
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
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }

        /* 记分卡表格 */
        .scorecard-table {
            width: 100%;
            border-collapse: collapse;
            font-size: clamp(0.6rem, 2vw, 0.7rem);
            min-width: 600px;
            /* 9洞基础宽度 */
            background: white;
        }

        /* 18洞时增加最小宽度 */
        .eighteen-hole .scorecard-table {
            min-width: 1200px;
        }

        .scorecard-table th,
        .scorecard-table td {
            padding: 6px 3px;
            text-align: center;
            border: 1px solid #ddd;
            white-space: nowrap;
            vertical-align: middle;
        }

        /* 表头样式 */
        .scorecard-table thead th {
            background: #4CAF50;
            color: white;
            font-weight: bold;
            font-size: clamp(0.55rem, 1.8vw, 0.6rem);
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

        /* 粘性列样式 */
        .sticky-left {
            position: sticky;
            left: 0;
            z-index: 10;
            background: #f8f9fa;
            min-width: 80px;
        }

        .sticky-total {
            position: sticky;
            right: 120px;
            /* 为最终总分留出空间 */
            z-index: 5;
            background: #4CAF50 !important;
            color: white;
            font-weight: bold;
            min-width: 50px;
        }

        .sticky-final {
            position: sticky;
            right: 0;
            z-index: 6;
            background: #2E7D32 !important;
            color: white;
            font-weight: bold;
            min-width: 60px;
        }

        /* 9洞比赛时调整粘性列位置 */
        .nine-hole .sticky-total {
            right: 0;
            background: #2E7D32 !important;
            z-index: 6;
        }

        /* 球员信息样式 */
        .player-info {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding-left: 8px !important;
            gap: 6px;
            min-width: 80px;
        }

        .player-avatar {
            width: 25px;
            height: 25px;
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
            font-size: clamp(0.6rem, 2vw, 0.65rem);
            text-align: left;
        }

        /* 成绩单元格样式 */
        .score-cell {
            font-weight: bold;
            font-size: clamp(0.7rem, 2.2vw, 0.8rem);
            min-width: 30px;
        }

        /* 成绩颜色编码 - 保持简洁 */
        .score-eagle {
            background: #ff4444 !important;
            color: white;
            font-weight: bold;
        }

        .score-birdie {
            background: #4285f4 !important;
            color: white;
            font-weight: bold;
        }

        .score-par {
            background: white;
            color: #333;
        }

        .score-bogey {
            background: #9e9e9e !important;
            color: white;
            font-weight: bold;
        }

        .score-double-bogey {
            background: #424242 !important;
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

        /* 球员行样式 */
        .player-row {
            height: 45px;
        }

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
                padding: 5px 2px;
            }

            .player-avatar {
                width: 22px;
                height: 22px;
            }

            .player-name {
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
                padding: 4px 2px;
            }

            .player-avatar {
                width: 20px;
                height: 20px;
            }

            .player-name {
                font-size: 0.55rem;
            }

            .player-info {
                min-width: 70px;
                padding-left: 5px !important;
            }

            .sticky-total {
                right: 80px;
            }

            .sticky-final {
                min-width: 50px;
            }

            .nine-hole .sticky-total {
                right: 0;
                min-width: 50px;
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
                padding: 3px 1px;
            }

            .scorecard-title {
                font-size: 1rem;
            }

            .course-info {
                font-size: 0.8rem;
            }

            .player-info {
                min-width: 60px;
            }

            .sticky-total {
                right: 60px;
                min-width: 40px;
            }

            .sticky-final {
                min-width: 45px;
            }

            .nine-hole .sticky-total {
                right: 0;
                min-width: 45px;
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