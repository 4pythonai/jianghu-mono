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

        $this->load->model('gamble/MReward');
        $rewardPair = [
            [
                'scoreName' => 'Par',
                'rewardValue' => 1
            ],
            [
                'scoreName' => 'Birdie',
                'rewardValue' => 2
            ],
            [
                'scoreName' => 'Eagle',
                'rewardValue' => 4
            ],
            [
                'scoreName' => 'Albatross/HIO',
                'rewardValue' => 10
            ],
            [
                'scoreName' => 'Birdie+Birdie',
                'rewardValue' => 4
            ],
            [
                'scoreName' => 'Birdie+Eagle',
                'rewardValue' => 8
            ],
            [
                'scoreName' => 'Eagle+Birdie',
                'rewardValue' => 8
            ],
            [
                'scoreName' => 'Eagle+Eagle',
                'rewardValue' => 16
            ]
        ];
        $par = 5;
        $score1 = 3;
        $score2 = 1;
        $rewardType = 'multiply';
        $reward = $this->MReward->getRewardFactor($par, $score1, $score2, $rewardPair, $rewardType);
        debug([
            'PAR' => $par,
            "成绩1" => $score1,
            "成绩2" => $score2,
            "奖励类型" => $rewardType,

        ]);
        debug($rewardPair);
        debug($reward);
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
