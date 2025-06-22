<?php
if (!defined('BASEPATH'))
    exit('No direct script access allowed');

// 全局函数：计算成绩类型CSS类名
if (!function_exists('getScoreClass')) {
    function getScoreClass($score, $par) {
        if ($score <= 0) {
            return '';
        }

        $diff = $score - $par;
        if ($diff <= -2) {
            return 'score-eagle';
        } elseif ($diff == -1) {
            return 'score-birdie';
        } elseif ($diff == 0) {
            return 'score-par';
        } elseif ($diff == 1) {
            return 'score-bogey';
        } else {
            return 'score-double-bogey';
        }
    }
}

class ScoreCard extends CI_Controller {

    public function __construct() {
        parent::__construct();
    }

    public function index() {
        // 默认显示比赛ID 1338073 的记分卡
        $this->show(1338073);
    }

    public function show($game_id = null) {
        if (!$game_id) {
            show_404();
            return;
        }

        // 获取比赛详细信息
        $game_info = $this->MDetailGame->get_detail_game($game_id);
        // debug($game_info);
        // exit;
        if (empty($game_info)) {
            show_404();
            return;
        }

        // 准备视图数据
        $data = [
            'game_info' => $game_info,
            'title' => '高尔夫记分卡',
            'base_url' => $this->_get_base_url()
        ];

        // 加载视图
        $this->load->view('scorecard/header', $data);
        $this->load->view('scorecard/scorecard', $data);
        $this->load->view('scorecard/footer', $data);
    }

    /**
     * 获取记分卡数据的API接口
     */
    public function getData($game_id = null) {
        header('Content-Type: application/json; charset=utf-8');

        if (!$game_id) {
            echo json_encode(['code' => 400, 'message' => '缺少游戏ID'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // 获取比赛详细信息
        $game_info = $this->MDetailGame->get_detail_game($game_id);

        if (empty($game_info)) {
            echo json_encode(['code' => 404, 'message' => '比赛不存在'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $ret = [
            'code' => 200,
            'message' => '获取成功',
            'data' => $game_info
        ];

        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取基础URL
     */
    private function _get_base_url() {
        $base_url = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        $base_url = str_replace('/ScoreCard', '', $base_url);
        $base_url = str_replace('/v3/index.php', '', $base_url);
        return rtrim($base_url, '/');
    }

    /**
     * 计算总成绩（前九洞）
     */
    private function _calculateOutScore($scores, $start = 0, $count = 9) {
        $total = 0;
        for ($i = $start; $i < $start + $count && $i < count($scores); $i++) {
            if ($scores[$i] > 0) {
                $total += $scores[$i];
            }
        }
        return $total > 0 ? $total : 0;
    }

    /**
     * 计算总成绩（后九洞）
     */
    private function _calculateInScore($scores, $start = 9, $count = 9) {
        return $this->_calculateOutScore($scores, $start, $count);
    }

    /**
     * 计算总成绩
     */
    private function _calculateTotalScore($scores) {
        $total = 0;
        foreach ($scores as $score) {
            if ($score > 0) {
                $total += $score;
            }
        }
        return $total > 0 ? $total : 0;
    }
}
