<?php

declare(strict_types=1);

use Aws\Organizations\OrganizationsClient;
use Aws\Sts\StsClient;
use Aws\Exception\AwsException;

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class Ping extends MY_Controller {
    public function __construct() {

        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
    }


    public  function echo() {
        $para = (array)json_decode(file_get_contents('php://input'), true);
        $para_string = json_encode($para);
        $res = [];
        $res['code'] = 200;
        $res['message'] = 'pong:' . $para_string;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }
}
