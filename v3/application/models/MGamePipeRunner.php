<?php

declare(strict_types=1);

use League\Pipeline\Pipeline;
use League\Pipeline\StageInterface;

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MGamePipeRunner extends CI_Model {
    public function __construct() {
        parent::__construct();
        $this->load->model('MGamePipe');
    }

    public function  GameDataHandler($cfg) {
        $pipeline = (new Pipeline())
            ->pipe(function ($config) {
                $this->MGamePipe->init($config);
            })
            ->pipe(function () {
                $this->MGamePipe->setAllRows();
            })
            ->pipe(function () {
                $this->MGamePipe->setRealRows();
            })
            ->pipe(function () {
                return $this->MGamePipe->getter();
            });

        $data = $pipeline->process($cfg);
        return $data;
    }
}
