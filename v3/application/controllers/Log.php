<?php
if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Log extends CI_Controller {
    function index() {

        $base_url = str_replace('log', '', $_SERVER['REQUEST_SCHEME']   . '://' . $_SERVER['HTTP_HOST'] .  $_SERVER['REQUEST_URI']);
        $base_url = str_replace('Log', '',  $base_url);
        $base_url = str_replace('/v3/index.php', '',  $base_url);

        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
        $this->load->helper('file');
        $jstr = '<script src="' .  $base_url . 'js/jquery/jquery-1.7.1.min.js" type="text/javascript" charset="utf-8"></script>';
        $jstr .= '<script src="' . $base_url . 'js/log.js" type="text/javascript" charset="utf-8"></script>';
        $css     = $base_url . "css/log.css";
        $css_str = "<link rel='stylesheet' href=$css>";

        $fontcss = $base_url . "css/font-awesome-4.7.0/css/font-awesome.min.css";
        $fontcss_str = "<link rel='stylesheet' href=$fontcss>";

        echo '<html><head><meta http-equiv="content-type" content="text/html;charset=utf-8">' . $jstr . $css_str . $fontcss_str . '<title>樵GAPI日志</title></head>';
        echo "<body><div>";
        echo "<input onclick=clear_log() type=button value=Clear_log name=Hide_Input>";
        echo "</div>";

        $logfile = helper_getlogname();
        if (file_exists($logfile)) {
            $string = file_get_contents(helper_getlogname());
        } else {
            $string = '';
        }

        $php_errmsg = '<h2>PHP_error_logfile: (/tmp/php_errors.log)</h2>' . file_get_contents('/tmp/php_errors.log');
        echo "<pre>" . $php_errmsg . "</pre>";
        echo "<h2>app_log_file: $logfile </h2>";
        echo "<br/>";
        echo "<pre style='margin-bottom:4px;'>" . $string . "</pre>";
        echo '
        <div id="menu">
                    <ul>
                        <li>
                        <a href="javascript:gotop();"><i class="fa fa-arrow-circle-up"></i></a>
                        </li>
                        <li>
                        <a href="javascript:gobottom();"><i class="fa fa-arrow-circle-down"></i></a>
                         </li>
                    </ul>
                </div>
               ';
        echo "</body></html>";
    }


    public function clearlog() {
        file_put_contents(helper_getlogname(), '');
        file_put_contents("/tmp/php_errors.log", '');
    }

    public function info() {

        $errorMessage = "Duplicate entry '19084319' for key 'student.stno'";


        if (preg_match("/Duplicate entry '(\d+)' for key 'student\.stno'/", $errorMessage, $matches)) {
            $duplicateValue = $matches[1];
            echo "有重复数据: " . $duplicateValue;
        } else {
            // 处理其他类型的错误
            echo "发生错误: " . $errorMessage;
        }
    }
}
