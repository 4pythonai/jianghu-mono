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
        $json_paras = (array) json_decode(file_get_contents('php://input'));
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
}
