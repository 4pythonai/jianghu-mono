<?php

declare(strict_types=1);

use Aws\Organizations\OrganizationsClient;
use Aws\Sts\StsClient;
use Aws\Exception\AwsException;

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class CUR extends MY_Controller {
    public function __construct() {

        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
    }


    public function ListObjects() {
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $ak = $para['ak'];
        $sk = $para['sk'];
        $region = $para['region'];
        $cfg = [
            'ak' => $ak,
            'sk' => $sk,
            'region' => $region,
            'month' => $para['month'],
            'payerid' => $para['payerid'],
            'curtype' => $para['curtype']
        ];

        $res = [];
        $res['code'] = 200;
        $s3Result = $this->CURPipe->ListObjects($cfg);
        $res['s3_objects'] = $s3Result['s3_objects'];
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }


    public function DownloadAndExtract() {
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $cfg = [
            'ak' => $para['ak'],
            'sk' => $para['sk'],
            'region' => $para['region'],
            'payerid' => $para['payerid'],
            'target_bucket' => $para['target_bucket'],
            'target_objectkey' => $para['target_objectkey'],
        ];

        $res = [];
        $res['code'] = 200;
        $res['SaveAs'] =  $this->CURPipe->DownloadAndExtract($cfg);
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }
}
