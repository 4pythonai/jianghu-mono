<?php






ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Test extends CI_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }


    public function index() {


        $get_data_config = ['userid' => 837590];
        $result  =  $this->MGamePipeRunner->GameFeedHandler($get_data_config);
        $ret = [];
        $ret['code'] = 200;
        $ret['star_friends'] = $result['star_friends'];
        echo json_encode($ret);
    }



    public function test8421() {
        $par = 5;
        $score = 13;
        $userid = 185;

        $Cfg8421UserPair = [
            67 => [
                "Par+3" => 1,
                "Par+2" => 2,
                "Par+1" => 3,
                "Par" => 5,
                "Birdie" => 9,
            ],

            93 => [
                "Par+2" => 1,
                "Par+1" => 2,
                "Par" => 4,
                "Birdie" => 8,
            ],

            160 => [
                "Par+2" => 1,
                "Par+1" => 2,
                "Par" => 4,
                "Birdie" => 8,
            ],

            185 => [
                "Par+2" => 1,
                "Par+1" => 2,
                "Par" => 4,
                "Birdie" => 8,
            ],
        ];

        // 计算加分值
        $addValue = $this->get8421AddValue($userid, $par, $score, $Cfg8421UserPair);
        debug([
            "PAR" => $par,
            "SCORE" => $score,
            "ADDVALUE" => $addValue,
        ]);
    }


    // 计算加分值
    public function get8421AddValue($userid, $par, $score, $Cfg8421UserPair) {
        // 检查用户是否在配置中
        if (!isset($Cfg8421UserPair[$userid])) {
            return 0;
        }

        $userConfig = $Cfg8421UserPair[$userid];
        $difference = $score - $par;

        // 差值与成绩类型的映射表
        $scoreTypeMap = [
            -2 => 'Eagle',
            -1 => 'Birdie',
            0  => 'Par',
            1  => 'Par+1',
            2  => 'Par+2',
            3  => 'Par+3'
        ];

        // 处理老鹰球或更好的情况（差值小于等于-2）
        if ($difference <= -2) {
            $scoreType = 'Eagle';
        } else {
            $scoreType = $scoreTypeMap[$difference] ?? null;
        }

        // 返回对应的加分，如果没有配置则返回0
        return isset($userConfig[$scoreType]) ? $userConfig[$scoreType] : 0;
    }





    /**
     * 测试控制器index方法
     * 
     * 读取并输出当前目录下的game.json文件内容
     * 
     * @return void 无返回值，直接输出文件内容
     */
    public function gameDetail() {
        $jsonFile = __DIR__ . '/game.json';
        if (file_exists($jsonFile)) {
            $content = file_get_contents($jsonFile);
            $data = json_decode($content, true);
            $ret = [];
            $ret['code'] = 200;
            $ret['gameinfo'] = $data;
            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        } else {
            debug(['error' => 'game.json file not found']);
        }
    }



    public function getCourseDetail() {
        $courseid = 100021;
        $query = "SELECT id,courseid,name,avatar,courtnum FROM t_course WHERE courseid = $courseid";
        $course = $this->db->query($query)->row_array();

        // courts
        $query = "SELECT * FROM t_course_court WHERE courseid = $courseid";
        $courts = $this->db->query($query)->result_array();

        // holes
        foreach ($courts as &$court) {
            $courtid = $court['courtid'];
            $query = "SELECT  holeid,holename, par FROM t_court_hole WHERE courtid = $courtid  limit 3";
            $holes = $this->db->query($query)->result_array();
            $court['courtholes'] = $holes;
        }
        echo json_encode(['code' => 200, 'course' => $course, 'courts' => $courts], JSON_UNESCAPED_UNICODE);
    }
}
