<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Events extends MY_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }

    /**
     * 返回成功响应
     */
    private function success($data = [], $message = '操作成功') {
        echo json_encode(array_merge([
            'code' => 200,
            'message' => $message
        ], $data), JSON_UNESCAPED_UNICODE);
    }

    /**
     * 返回错误响应
     */
    private function error($message, $code = 400) {
        echo json_encode([
            'code' => $code,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 检查是否是球局创建者
     */
    private function isGameCreator($gameid, $userid) {
        $game = $this->db->select('creatorid')->from('t_game')->where('id', $gameid)->get()->row_array();
        return $game && (int)$game['creatorid'] === (int)$userid;
    }


    /**
     * 获取赛事轮播图
     * POST /Events/getEventBanners
     */
    public function getEventBanners() {
        $webUrl = rtrim(config_item('web_url'), '/');

        $banners = [
            [
                'id' => 1,
                'image' => $webUrl . '/events/event-1.png',
                'title' => '赛事banner1'
            ],
            [
                'id' => 2,
                'image' => $webUrl . '/events/event-2.png',
                'title' => '赛事banner2'
            ],
            [
                'id' => 3,
                'image' => $webUrl . '/events/event-3.png',
                'title' => '赛事banner3'
            ]
        ];

        $this->success(['banners' => $banners]);
    }
}
