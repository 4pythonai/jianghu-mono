<?php

declare(strict_types=1);

use League\Pipeline\Pipeline;
use League\Pipeline\StageInterface;

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
            ->pipe(function () {
                $this->GamblePipeRunner->DoGetGambleResult();
            })

            // 处理让杆
            ->pipe(function () {
                $this->GamblePipeRunner->StrokingScores();
            })


            ->pipe(function () {
                return $this->GamblePipeRunner->getter();
            });

        $tmp = $pipeline->process($cfg);
        return $tmp;
    }
}
