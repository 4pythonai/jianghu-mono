<?php

declare(strict_types=1);
set_time_limit(0);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class Jianghu extends CI_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
        $this->load->model('GamblePipe');
        $this->load->model('GamblePipeRunner');
        $this->load->model('gamble/MGambleDataFactory');
        $this->load->model('gamble/MRuntimeConfig');
        $this->load->model('gamble/MStroking');
        $this->load->model('gamble/MIndicator');
        $this->load->model('gamble/MPoints');
        $this->load->model('gamble/MReward');
        $this->load->model('gamble/MRedBlue');
        $this->load->model('gamble/MMoney');
        $this->load->model('gamble/MRanking');
        $this->load->model('gamble/GambleContext');
        $this->load->model('gamble/MRanking');
        $this->load->model('gamble/GambleContext');
        $this->load->model('gamble/MMeat');
        $this->load->model('gamble/MDonation');
    }




    /**
     * 江湖页面 - 主入口函数
     */
    public function jianghu() {
        $userid = $this->input->get('userid') ? intval($this->input->get('userid')) : 837590;

        $profile = $this->user_footprint($userid);
        $china_legcy_time = $this->china_legcy_time($profile['joind_h'], $profile['joind_m']);
        $profile['sc_ke'] = $china_legcy_time['sc'] . $china_legcy_time['ke'];
        $profile['sid'] = '';

        $this->load->view('jianghu.html', $profile);
    }

    /**
     * 中国古时辰转换
     */
    public function china_legcy_time($h, $m) {

        $sc = '';
        $ke = '';
        if ($h > 1 and $h <= 3) {
            $sc = '丑时';
        }

        if ($h > 3 and $h <= 5) {
            $sc = '寅时';
        }

        if ($h > 5 and $h <= 7) {
            $sc = '卯时';
        }

        if ($h > 7 and $h <= 9) {
            $sc = '辰时';
        }

        if ($h > 9 and $h <= 11) {
            $sc = '巳时';
        }

        if ($h > 11 and $h <= 13) {
            $sc = '午时';
        }

        if ($h > 13 and $h <= 15) {
            $sc = '未时';
        }

        if ($h > 15 and $h <= 17) {
            $sc = '申时';
        }

        if ($h > 17 and $h <= 19) {
            $sc = '酉时';
        }

        if ($h > 19 and $h <= 21) {
            $sc = '戌时';
        }

        if ($h > 21 and $h <= 23) {
            $sc = '亥时';
        }

        if ($h > 23) {
            $sc = '子时';
        }

        if ($m > 0 and $m < 15) {
            $ke = '一刻';
        }

        if ($m >= 15 and $m < 30) {
            $ke = '两刻';
        }

        if ($m >= 30) {
            $ke = '三刻';
        }

        return array('sc' => $sc, 'ke' => $ke);
    }

    /**
     * 筛选有效比赛（18洞完整比赛）
     */
    public function qualified_game($user_all_end_games, $userid) {
        $games = array();
        $incomplete_game = array();
        $this->load->database();
        foreach ($user_all_end_games as $key => $one_game) {
            $gameid = intval($one_game['gameid']);
            $sql = "select sum(gross) as sum_gross,min(gross) as gross_min,count(hole_id) as hole_num from t_game_score where gameid=$gameid and userid=$userid";
            $one_game_info = $this->db->query($sql)->row_array();
            if ($one_game_info['gross_min'] > 0 && $one_game_info['hole_num'] == 18) {
                $games[] = $gameid;
            } else {
                if ($one_game_info['sum_gross'] != 0) {
                    $incomplete_game[] = $gameid;
                }
            }
        }
        $incomplete_game_num = 0;
        if (count($incomplete_game) > 0) {
            $incomplete_game_num = count($incomplete_game) * 0.5;
        }
        return array('games' => $games, 'incomplete_game_num' => $incomplete_game_num);
    }

    /**
     * 获取年度足迹数据
     */
    public function get_year_footprint_date($current_year, $register_year, $userid) {

        $year_data = array();

        for ($i = 0; $i <= ($current_year - $register_year); $i++) {
            $year = $register_year + $i;

            $year_data[$year] = $this->year_footprint($userid, $year);

            $year_data[$year]['text'] = 'AAA';

            $handicap = abs($year_data[$year]['year_handicap']);
            if ($handicap === 0) {
                $year_data[$year]['handicap_str'] = "暂无成绩";
            } else {
                $year_data[$year]['handicap_str'] = "本年度平均成绩为" . (72 + $year_data[$year]['year_handicap']) . '杆';
            }

            $year_data[$year]['handicap_change'] = '';

            if (isset($year_data[$year - 1])) {
                $pre_year_handicap = abs($year_data[$year - 1]['year_handicap']);
                $handicap_difference = $handicap -  $pre_year_handicap;

                $handicap_difference_array = explode('.', strval($handicap_difference));
                if (count($handicap_difference_array) > 1) {
                    $last_handicap_array = $handicap_difference_array[1];
                    $last_handicap_value = substr($last_handicap_array, 0, 1);
                    $handicap_difference = $handicap_difference_array[0] . '.' . $last_handicap_value;
                } else {
                    $handicap_difference = $handicap_difference_array[0] . '.0';
                }

                if ($handicap_difference < 0) {
                    $year_data[$year]['handicap_change'] = "较去年降低了" . abs($handicap_difference) . "杆";
                }

                if ($handicap_difference > 0) {
                    $year_data[$year]['handicap_change'] = "较去年增加了" . $handicap_difference . "杆";
                }

                if ($handicap_difference == 0) {
                    $year_data[$year]['handicap_change'] = "与去年持平";
                }
            }
        }
        return array_reverse($year_data);
    }

    /**
     * 单年足迹统计
     */
    public function year_footprint($userid, $year) {
        $game_status = 'finished';
        $this->load->database();
        $sql = "select id as gameid  from t_game where create_time between '" . $year . "-01-01 00:00:00' and '" . $year . "-12-31 23:59:59'  and id in (select gameid from t_game_group_user where userid=$userid) and game_status='$game_status'";
        $one_year_games = $this->db->query($sql)->result_array();

        if (count($one_year_games) < 1) {
            return array('year' => $year, 'game_num' => 0, 'year_handicap' => 0, 'course_num' => 0, 'player_num' => 0, 'pkerlist' => 0);
        }

        $result = $this->qualified_game($one_year_games, $userid);
        $incomplete_game_num = $result['incomplete_game_num'];
        $games = $result['games'];
        $one_year_game_num = count($games);
        $one_year_game_str = implode(',', $games);
        if (strlen($one_year_game_str) < 1) {
            $one_year_game_str = -1;
        }
        $year_game_data = $this->get_course_player_num($one_year_game_str, $userid);
        $year_game_data['year'] = $year;

        $year_game_data['game_num'] = $one_year_game_num + $incomplete_game_num;
        $year_game_data['year_handicap'] = $this->one_year_game_handicap($one_year_game_str, $userid);

        return $year_game_data;
    }

    /**
     * 获取球场和球友数量
     */
    public function get_course_player_num($games_str, $userid) {
        $this->load->database();
        $sql = "select distinct courseid from t_game where id in ($games_str)";
        $courses = $this->db->query($sql)->result_array();
        $course_num = count($courses);
        $sql = "select id,nickname from t_user where id in (select distinct userid from t_game_group_user where gameid in ($games_str))  and id<>$userid";
        $play_game_users = $this->db->query($sql)->result_array();
        $player_num = count($play_game_users);
        return array('course_num' => $course_num, 'player_num' => $player_num, 'pkerlist' => $play_game_users);
    }

    /**
     * 计算年度差点
     */
    public function one_year_game_handicap($game_str, $userid) {

        $sql = "select t_game_score.gameid,
                       sum(t_game_score.gross) as grossnum,
                       min(t_game_score.gross) as grossmin,
                       sum(t_game_score.par) as sumpar,
                       count(t_game_score.par) as holenum
                from t_game_score, t_game
                where t_game_score.gameid in ($game_str) 
                  and t_game_score.userid=$userid  
                  and t_game.id = t_game_score.gameid
                  and t_game.game_status='finished' 
                group by t_game_score.gameid";

        $user_game_info = $this->db->query($sql)->result_array();

        $sumgross       = 0;
        $sumpar         = 0;
        $gameidnum      = 0;
        foreach ($user_game_info as $k => $v) {
            if ($v['grossnum'] != 0) {
                if ($v['grossmin'] > 0) {
                    if ($v['holenum'] > 9) {
                        $sumgross = $sumgross + $v['grossnum'];
                        $sumpar   = $sumpar + $v['sumpar'];
                        $gameidnum++;
                    }
                }
            }
        }
        if ($sumgross == 0 && $sumpar == 0 && $gameidnum == 0) {
            $handicap = -6;
        } else {
            $handicap = ($sumgross - $sumpar) / $gameidnum;
            $handicap = round($handicap, 1);
        }

        return $handicap;
    }

    /**
     * 秒数转时间格式
     */
    public function secondsToTime($seconds) {
        $dtF = new DateTime("@0");
        $dtT = new DateTime("@$seconds");
        return array(
            $dtF->diff($dtT)->format('%a'),
            $dtF->diff($dtT)->format('%h小时%i分钟%s秒')
        );
    }

    /**
     * 用户足迹汇总
     */
    public function user_footprint($userid) {
        // header("Content-type: text/html; charset=utf-8");

        $game_status = 'finished';
        $this->load->database();
        $sql = "select addtime from t_user where id=$userid";
        $user_create_time = $this->db->query($sql)->row_array();
        // 将日期字符串转为时间戳
        $addtime_ts = strtotime($user_create_time['addtime']);

        $sql = "select id as  gameid from t_game where game_status='$game_status' and id in (select gameid from t_game_group_user where userid=$userid)";

        $user_all_end_games = $this->db->query($sql)->result_array();
        $result = $this->qualified_game($user_all_end_games, $userid);
        $incomplete_game_num = $result['incomplete_game_num'];
        $games = $result['games'];

        $all_end_game_num = count($games);
        $all_end_game_str = implode(',', $games);
        if (strlen($all_end_game_str) < 1) {
            $all_end_game_str = -1;
        }

        $all_game_data = $this->get_course_player_num($all_end_game_str, $userid);

        $xx = $this->secondsToTime(time() - $addtime_ts);

        $register_year = date('Y', $addtime_ts);

        $current_year = date('Y');

        $year_data = $this->get_year_footprint_date($current_year, $register_year, $userid);

        $today =  date('Y年m月d日', time());

        return [
            'today' => $today,
            'live_days' => $xx[0],
            'live_hms' => $xx[1],
            'games' => $all_end_game_num + $incomplete_game_num,
            'course_num' => $all_game_data['course_num'],
            'pknum' => $all_game_data['player_num'],
            'pkerlist' => $all_game_data['pkerlist'],
            'years' => $year_data,
            'joind_y' => date('Y年', $addtime_ts),
            'joind_md' => date('m月d日', $addtime_ts),
            'joind_h' => date('h', $addtime_ts),
            'joind_m' => date('m', $addtime_ts)
        ];
    }
}
