<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Feed extends MY_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }




    public function myFeeds() {
        $userid = $this->getUser();
        $get_data_config = ['userid' => $userid];
        $result  =  $this->MGamePipeRunner->GameFeedHandler($get_data_config);
        $games = [];
        $whitelist_gameids = $this->MPrivateWhiteList->getUserWhiteListGameIds($userid);
        $allgames = $result['allgames'];

        foreach ($allgames as $game) {
            $gameid = $game['id'];
            $game_detail = $this->MDetailGame->getGameDetail($gameid);
            //处理隐私情况,球队比赛情况
            if (in_array((int)$gameid, $whitelist_gameids, true)) {
                $game_detail['private'] = 'n';
            }
            // 处理球队比赛情况

            if ($game_detail['is_team_game'] == 'y') {
                $sql = "select team_game_title ,team_avatar from t_game ,t_team where t_game.team_id = t_team.id and t_game.id = $gameid ";
                // debug($sql);
                $row = $this->db->query($sql)->row_array();
                $game_detail['extra_team_game_info'] = [
                    'team_game_title' => $row['team_game_title'],
                    'team_avatar' => $row['team_avatar']
                ];
            }
            $games[] = $game_detail;
        }



        $ret = [];
        $ret['debug'] = 42;
        $ret['code'] = 200;
        $ret['star_friends'] = $result['star_friends'];
        $allgames = $result['allgames'];
        $ret['games'] = $games;
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }
}
