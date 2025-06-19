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


        $get_data_config = [
            'creatorid' => [837581, 837590],
        ];


        $result  =  $this->MGamePipeRunner->GameDataHandler($get_data_config);
        $ret = [];
        $ret['code'] = 200;
        $ret['allgames'] = $result['allgames'];
        $ret['realgames'] = count($result['realgames']);
        echo json_encode($ret);
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
        $query = "SELECT id,courseid,name,coverpath,courtnum FROM t_course WHERE courseid = $courseid";
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
