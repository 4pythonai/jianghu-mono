<?php
defined('BASEPATH') or exit('No direct script access allowed');
class BillingSteps extends MY_Controller {

    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }



    public function checkTableIsEmpty() {
        $res = [];

        // Check if tables exist
        $tables = ['s3_global_cur_raw', 's3_global_cur_month_pivot'];
        $missingTables = [];
        $nonEmptyTables = [];

        foreach ($tables as $table) {
            // Check if table exists
            $tableExists = $this->db->query("SHOW TABLES LIKE '$table'")->num_rows() > 0;

            if (!$tableExists) {
                $missingTables[] = $table;
                continue;
            }

            // Check if table is empty
            $isEmpty = $this->db->query("SELECT COUNT(*) as count FROM $table")->row()->count == 0;

            if (!$isEmpty) {
                $nonEmptyTables[] = $table;
            }
        }

        if (!empty($missingTables)) {
            $res['code'] = 200;
            $res['checkStatus'] = 'fail';
            $res['message'] = '以下表格不存在: ' . implode(', ', $missingTables);
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            return;
        }

        if (!empty($nonEmptyTables)) {
            $res['code'] = 200;
            $res['checkStatus'] = 'fail';
            $res['message'] = '以下表格不为空: ' . implode(', ', $nonEmptyTables);
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            return;
        }

        $res['code'] = 200;
        $res['checkStatus'] = 'success';
        $res['message'] = '所有表格存在且为空';
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }
}
