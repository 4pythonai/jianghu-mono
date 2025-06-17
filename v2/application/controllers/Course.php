<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Course extends MY_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }


    public function getNearestCourses() {
        $json_paras = json_decode(file_get_contents('php://input'), true);

        $lat = $json_paras['latitude'];
        $lng = $json_paras['longitude'];

        // Validate input parameters
        if (!is_numeric($lat) || !is_numeric($lng)) {
            echo json_encode(array(
                'code' => 400,
                'message' => 'Invalid latitude or longitude parameters'
            ));
            return;
        }

        try {

            $query = " SELECT 
                courseid, name, lat, lng,
                ROUND(6371 * 2 * ASIN(SQRT(
                    POWER(SIN(( $lat - ABS(lat)) * PI()/180 / 2), 2) +
                    COS( $lat * PI()/180) * 
                    COS(ABS(lat) * PI()/180) *
                    POWER(SIN(($lng  - lng) * PI()/180 / 2), 2)
                )), 2) AS distance_km
            FROM t_course
            WHERE status <> 1 
            AND lat <> 0 
            AND lng <> 0
            ORDER BY distance_km ASC
            LIMIT 5
            ";


            $courses = $this->db->query($query)->result_array();
            echo json_encode(['code' => 200, 'data' => $courses], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode(['code' => 500, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }






    public function searchCourse() {
        $json_paras = json_decode(file_get_contents('php://input'), true);

        $keyword = $json_paras['keyword'];
        $page = isset($json_paras['page']) ? (int)$json_paras['page'] : 1;
        $per_page = 10; // 每页显示10条记录

        // 计算偏移量
        $offset = ($page - 1) * $per_page;

        // 获取总记录数
        $total_query = $this->db->select('COUNT(*) as total')
            ->from('t_course')
            ->like('name', $keyword)
            ->get();
        $total = $total_query->row()->total;

        // 获取分页数据
        $courses = $this->db->select('courseid, name')
            ->from('t_course')
            ->like('name', $keyword)
            ->limit($per_page, $offset)
            ->get()
            ->result_array();

        echo json_encode([
            'code' => 200,
            'courses' => $courses,
            'current_page' => $page,
            'per_page' => $per_page,
            'total' => $total,
            'total_pages' => ceil($total / $per_page)
        ], JSON_UNESCAPED_UNICODE);
    }


    public function getFavorites() {
        $user_id = $this->getUser();
        $query = "SELECT * FROM t_course  limit 3";
        $courses = $this->db->query($query)->result_array();
        echo json_encode(['code' => 200, 'courses' => $courses], JSON_UNESCAPED_UNICODE);
    }


    public function getCourseDetail() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $courseid = $json_paras['courseid'];
        $query = "SELECT id,courseid,name,coverpath,courtnum FROM t_course WHERE courseid = $courseid";
        $course = $this->db->query($query)->row_array();

        // courts
        $query = "SELECT * FROM t_course_court WHERE courseid = $courseid order by courtname";
        $courts = $this->db->query($query)->result_array();

        // holes
        foreach ($courts as &$court) {
            $courtid = $court['courtid'];
            $query = "SELECT  holeid,holename, par FROM t_court_hole WHERE courtid = $courtid ";
            $holes = $this->db->query($query)->result_array();
            $court['courtholes'] = $holes;
        }
        echo json_encode(['code' => 200, 'course' => $course, 'courts' => $courts], JSON_UNESCAPED_UNICODE);
    }
}
