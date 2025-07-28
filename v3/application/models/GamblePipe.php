<?php

use League\Pipeline\Pipeline;

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class GamblePipe extends CI_Model {
    public function __construct() {
        parent::__construct();
        $this->load->model('GamblePipeRunner');
        set_time_limit(0);
    }





    public function  GetGambleResult($cfg) {
        $pipeline = (new Pipeline())
            ->pipe(function ($cfg) {
                $this->GamblePipeRunner->initGamble($cfg);
            })


            // 处理让杆
            ->pipe(function () {
                $this->GamblePipeRunner->StrokingScores();
            })

            ->pipe(function () {
                $this->GamblePipeRunner->setRangedHoles();
            })


            ->pipe(function () {
                $this->GamblePipeRunner->setUsefullHoles();
            })


            ->pipe(function () {
                $this->GamblePipeRunner->processHoles();
            })


            ->pipe(function () {
                return $this->GamblePipeRunner->getter();
            });



        $tmp = $pipeline->process($cfg);
        return $tmp;
    }
}
