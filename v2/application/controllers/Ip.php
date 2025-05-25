<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Ip extends CI_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }

    public function index() {
        // print remote ip address
        echo $_SERVER['REMOTE_ADDR'];
    }
}
