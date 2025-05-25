<?php
defined('BASEPATH') or exit('No direct script access allowed');

class RedisLog extends CI_Controller {
    private $redis;

    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, authorization');
        header('Access-Control-Allow-Credentials: true');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            exit();
        }
        // 初始化 Redis 连接
        $this->redis = new Redis();
        $this->redis->connect('127.0.0.1', 6379); // 根据您的 Redis 配置修改
    }

    public function getRedisLog() {
        // 获取当前日志长度和日志内容
        $logs = $this->redis->lRange('application_logs', 0, -1);


        // 翻转 logs 顺序 

        $logs = array_reverse($logs);


        $logLengthBefore = count($logs);

        // 输出日志
        $response = [
            'logs' => array_map(function ($logItem) {
                return  $logItem;
            }, $logs)
        ];
        // 给前端返回
        echo json_encode($response);
        // 删除已输出的日志
        $logsToDelete = $logLengthBefore;
        if ($logsToDelete > 0) {
            $this->redis->lTrim('application_logs', $logsToDelete, -1);
        }
    }
}
