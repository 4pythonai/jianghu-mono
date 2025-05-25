<?php

declare(strict_types=1);
set_time_limit(0);

require_once APPPATH . 'third_party/aws/aws-autoloader.php';

use League\Pipeline\Pipeline;
use League\Pipeline\StageInterface;
use League\Csv\Reader;
use Aws\S3\S3Client;
use Aws\Sts\StsClient;


class CURPipeRunner   extends CI_Model implements StageInterface {
    public  $payload = [];
    public  $s3_objects = [];
    public  $s3Success = true;
    public  $s3ErrosMsg = '';
    public  $SaveAs = '';
    public  $config = [];
    private $CSVRawRows = []; // CSV 得到的所有列的原始数据
    private $RawRows = [];    // 提取某些列,并添加某些列,并处理 lineItem_BlendedCost 后的数据


    public function __invoke($cfg) {
        return $cfg;
    }

    public function init($config) {
        $this->config['tierid'] = $this->MCloudLevel->getTieridByPayerid($config['payerid']);
        $this->config['payerid'] = $config['payerid'];
        $this->config['batch'] = $config['batch'];
        $this->config['billmonth'] = $config['billmonth'];
        $_res = $this->AWSObjectKeyNameUtil->buildAwsLocalPath(
            $config['target_objectkey'],
            $config['payerid']
        );

        $this->config['region'] = $this->MCloudLevel->getRegion($config['payerid']);

        if (substr($this->config['region'], 0, 3) === "cn-") {
            $this->config['regionType'] = 'china';
        } else {
            $this->config['regionType'] = 'global';
        }
        $this->config['csvname'] =  $_res['csvname'];
    }


    public function init_S3($config) {
        $this->config = $config;
        $this->awsConfig = [
            'version' => 'latest',
            'region'  => $this->config['region'],
            'credentials' => [
                'key'    =>  $this->config['ak'],
                'secret' =>   $this->config['sk']
            ],
        ];
        $this->s3Client = new S3Client($this->awsConfig);
    }





    public  function ListObjects() {
        clog("列出Payer文件:" . $this->config['payerid'], 'black', 'normal', 2);
        $bucket = "cur-" . $this->config['payerid'] . "-" . strtolower($this->config['curtype']);
        $from_to_str = $this->AWSObjectKeyNameUtil->getMonthRangeString($this->config['month']);
        $Prefix = 'CUR/CUR-REPORT-' . strtoupper($this->config['curtype']) . '/' . $from_to_str . '/';

        try {
            $contents = $this->s3Client->ListObjectsV2([
                'Bucket' => $bucket,
                'Prefix' => $Prefix,
                "Delimiter" => '/',
            ]);

            $this->s3Success = true;
            $s3_objects = [];
            if (is_array($contents['Contents'])) {
                foreach ($contents['Contents'] as $content) {
                    $s3_objects[] = [
                        'bucket' => $bucket,
                        'target_bucket' => $bucket,
                        'objectkey' => $content['Key'],
                        'target_objectkey' => $content['Key'],
                        'Prefix' => $Prefix
                    ];
                }
            }
            $this->s3_objects = $s3_objects;
        } catch (Exception $exception) {

            $this->s3Success = false;
            $this->s3_objects = [];
            $_errmsg = "Failed to list objects in  $bucket with error: " . $exception->getMessage();
            $this->s3ErrosMsg =  $_errmsg;
            clog($_errmsg, 'red');
        }
    }



    public function debug() {
        header('Content-Type: application/json');
        echo json_encode($this->payload, JSON_PRETTY_PRINT);
    }


    public function getter() {
        return  [
            's3_objects' => $this->s3_objects,
            'SaveAs' => $this->SaveAs,
            's3Success' => $this->s3Success,
            's3ErrosMsg' => $this->s3ErrosMsg

        ];
    }


    public function cleanup() {
        $this->payload = [];
        $this->config = [];
        $this->RawRows = [];
        $this->CSVRawRows = [];
        $this->s3_objects = [];
        $this->s3Success = true;
        $this->SaveAs = '';
    }
}
