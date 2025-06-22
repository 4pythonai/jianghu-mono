<?php

/**
 * 记分卡数据处理辅助文件
 * 用于从 $game_info 中提取和格式化数据
 */

// 提取比赛基本信息
$game_title = isset($game_info['game_name']) ? $game_info['game_name'] : '高尔夫比赛';
$course_name = isset($game_info['course']) ? $game_info['course'] : '高尔夫球场';
$game_date = isset($game_info['game_start']) ? date('Y/m/d H:i', strtotime($game_info['game_start'])) : date('Y/m/d H:i');

// 分析洞信息，确定比赛类型
$total_holes = 0;
$course_pars = [];
$hole_id_map = [];
$hole_names = [];
$courts = []; // 存储不同的场地

if (isset($game_info['holeList']) && is_array($game_info['holeList'])) {
    $total_holes = count($game_info['holeList']);

    // 按场地和洞号排序
    $sorted_holes = $game_info['holeList'];
    usort($sorted_holes, function ($a, $b) {
        if ($a['court_key'] == $b['court_key']) {
            return $a['holeno'] - $b['holeno'];
        }
        return $a['court_key'] - $b['court_key'];
    });

    // 统计有多少个不同的场地
    $court_keys = array_unique(array_column($sorted_holes, 'court_key'));
    $courts = array_values($court_keys);

    // 构建洞信息
    $hole_index = 1;
    foreach ($sorted_holes as $hole_info) {
        $course_pars[] = $hole_info['par'];
        $hole_id_map[$hole_index] = $hole_info['holeid'];
        $hole_names[] = $hole_info['holename'];
        $hole_index++;
    }
}

// 如果没有找到洞信息，使用默认值
if ($total_holes == 0) {
    $total_holes = 18;
    $course_pars = array_fill(0, 18, 4);
}

// 确定比赛类型
$is_nine_hole = $total_holes <= 9;
$front_nine_count = $is_nine_hole ? $total_holes : 9;
$back_nine_count = $is_nine_hole ? 0 : ($total_holes - 9);

// 整理球员成绩数据
$players_scores = [];
if (isset($game_info['scores']) && is_array($game_info['scores'])) {
    foreach ($game_info['scores'] as $score_record) {
        $user_id = $score_record['userid'];
        $hole_id = $score_record['holeid'];
        $score = $score_record['score'];

        if (!isset($players_scores[$user_id])) {
            $players_scores[$user_id] = [];
        }

        $players_scores[$user_id][$hole_id] = $score;
    }
}

// 构建球员数据
$players_data = [];
if (isset($game_info['players']) && is_array($game_info['players'])) {
    foreach ($game_info['players'] as $player) {
        $user_id = $player['user_id'];
        $player_name = !empty($player['wx_nickname']) ? $player['wx_nickname'] : $user_id;

        // 获取该球员的完整成绩
        $all_scores = [];
        $out_total = 0; // 前N洞总分
        $in_total = 0;  // 后N洞总分

        // 遍历所有洞
        for ($hole_index = 1; $hole_index <= $total_holes; $hole_index++) {
            $score = 0;
            if (isset($hole_id_map[$hole_index]) && isset($players_scores[$user_id][$hole_id_map[$hole_index]])) {
                $score = $players_scores[$user_id][$hole_id_map[$hole_index]];

                // 根据洞数分配到前半场或后半场
                if ($hole_index <= $front_nine_count) {
                    $out_total += $score;
                } else {
                    $in_total += $score;
                }
            }
            $all_scores[] = $score;
        }

        $players_data[] = [
            'id' => $user_id,
            'name' => $player_name,
            'avatar' => $player['avatar'],
            'scores' => $all_scores,
            'out' => $out_total > 0 ? $out_total : 0,
            'in' => $in_total > 0 ? $in_total : 0,
            'total' => ($out_total + $in_total) > 0 ? ($out_total + $in_total) : 0
        ];
    }
}

// 如果没有球员数据，使用示例数据
if (empty($players_data)) {
    $example_scores = $is_nine_hole
        ? [4, 4, 5, 4, 3, 4, 3, 4, 5]
        : [4, 4, 5, 4, 3, 4, 3, 4, 5, 3, 5, 4, 3, 4, 2, 5, 3, 4];

    $players_data = [
        [
            'id' => 1,
            'name' => 'Tigerhoods',
            'avatar' => $base_url . '/avatar/default.jpg',
            'scores' => array_slice($example_scores, 0, $total_holes),
            'out' => array_sum(array_slice($example_scores, 0, $front_nine_count)),
            'in' => $is_nine_hole ? 0 : array_sum(array_slice($example_scores, $front_nine_count, $back_nine_count)),
            'total' => array_sum(array_slice($example_scores, 0, $total_holes))
        ]
    ];
}

// 确保标准杆数组长度正确
$course_pars = array_pad(array_slice($course_pars, 0, $total_holes), $total_holes, 4);

// 计算前半场和后半场的标准杆总和
$out_par = array_sum(array_slice($course_pars, 0, $front_nine_count));
$in_par = $is_nine_hole ? 0 : array_sum(array_slice($course_pars, $front_nine_count, $back_nine_count));
$total_par = $out_par + $in_par;

// 导出变量供视图使用
$scorecard_config = [
    'total_holes' => $total_holes,
    'is_nine_hole' => $is_nine_hole,
    'front_nine_count' => $front_nine_count,
    'back_nine_count' => $back_nine_count,
    'out_par' => $out_par,
    'in_par' => $in_par,
    'total_par' => $total_par,
    'hole_names' => $hole_names
];
