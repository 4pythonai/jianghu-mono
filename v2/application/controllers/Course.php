<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Course extends CI_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }






    public function getNearstCourses() {
        $lat = $this->input->get('latitude');
        $lng = $this->input->get('longitude');

        // Validate input parameters
        if (!is_numeric($lat) || !is_numeric($lng)) {
            echo json_encode(array(
                'code' => 400,
                'message' => 'Invalid latitude or longitude parameters'
            ));
            return;
        }

        try {
            // Using simplified distance calculation
            $query = "SELECT *, 
                ROUND(
                    SQRT(
                        POW(69.1 * (CAST(lat AS DECIMAL(10,8)) - ?), 2) + 
                        POW(69.1 * (? - CAST(lgt AS DECIMAL(10,8))) * COS(CAST(lat AS DECIMAL(10,8)) / 57.3), 2)
                    ) * 1.60934, 2
                ) AS distance 
                FROM t_course 
                WHERE lat IS NOT NULL 
                AND lgt IS NOT NULL 
                AND lat != '' 
                AND lgt != ''
                AND CAST(lat AS DECIMAL(10,8)) BETWEEN ? - 1 AND ? + 1
                AND CAST(lgt AS DECIMAL(10,8)) BETWEEN ? - 1 AND ? + 1
                ORDER BY distance
                LIMIT 10";

            $courses = $this->db->query($query, array($lat, $lng, $lat, $lat, $lng, $lng))->result_array();

            echo json_encode(['code' => 200, 'data' => $courses], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode(array(
                'code' => 500,
                'message' => 'Database error: ' . $e->getMessage()
            ));
        }
    }
}
