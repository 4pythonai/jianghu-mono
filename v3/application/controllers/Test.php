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
