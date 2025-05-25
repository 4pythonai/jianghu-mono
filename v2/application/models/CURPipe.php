<?php

declare(strict_types=1);

use League\Pipeline\Pipeline;
use League\Pipeline\StageInterface;

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class CURPipe extends CI_Model {
    public function __construct() {
        parent::__construct();
        $this->load->model('CURPipeRunner');
        set_time_limit(0);
    }





    public function  ListObjects($cfg) {
        $pipeline = (new Pipeline())
            ->pipe(function ($cfg) {
                $this->CURPipeRunner->init_S3($cfg);
            })
            ->pipe(function () {
                $this->CURPipeRunner->ListObjects();
            })
            ->pipe(function () {
                return $this->CURPipeRunner->getter();
            });

        $tmp = $pipeline->process($cfg);
        return $tmp;
    }
}
