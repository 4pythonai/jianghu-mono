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
}
