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
        $config = "DoublePar+1";
        $config = "DoublePar+3";
        $config = "DoublePar";
        // $config = "Par+2";
        // $config = "Par+0";

        // 计算扣分项
        $subValue = $this->get8421SubValue($par, $score, $config);
        debug([
            "PAR" => $par,
            "SCORE" => $score,
            "CONFIG" => $config,
            "SUBVALUE" => $subValue,
        ]);
    }


    public function get8421SubValue($par, $score, $configString) {
        // 解析配置字符串，计算阈值
        $threshold = $this->parseConfigString($par, $configString);

        // 如果分数小于阈值，不扣分
        if ($score < $threshold) {
            return 0;
        }

        // 如果分数等于阈值，扣1分
        if ($score == $threshold) {
            return -1;
        }

        // 如果分数大于阈值，除了基础扣1分，每超过1分再扣1分
        $overScore = $score - $threshold;
        return -1 - $overScore;
    }

    /**
     * 解析配置字符串，计算实际阈值
     * 
     * @param int $par 标准杆数
     * @param string $configString 配置字符串
     * @return int 计算出的阈值
     */
    private function parseConfigString($par, $configString) {
        if (strpos($configString, 'DoublePar') !== false) {
            // 处理 DoublePar 相关配置
            $basePar = 2 * $par;
            if (strpos($configString, '+') !== false) {
                $parts = explode('+', $configString);
                $addition = (int)$parts[1];
                return $basePar + $addition;
            } else {
                return $basePar;
            }
        } elseif (strpos($configString, 'Par') !== false) {
            // 处理 Par 相关配置
            $basePar = $par;
            if (strpos($configString, '+') !== false) {
                $parts = explode('+', $configString);
                $addition = (int)$parts[1];
                return $basePar + $addition;
            } else {
                return $basePar;
            }
        }

        // 默认返回标准杆
        return  0;
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
