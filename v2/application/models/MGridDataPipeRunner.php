<?php

declare(strict_types=1);

use League\Pipeline\Pipeline;
use League\Pipeline\StageInterface;

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MGridDataPipeRunner extends CI_Model {
    public function __construct() {
        parent::__construct();
        $this->load->model('MGridDataPipe');
    }

    public function  GridDataHandler($cfg) {
        $pipeline = (new Pipeline())
            ->pipe(function ($config) {
                $this->MGridDataPipe->init($config);
            })
            ->pipe(function () {
                $this->MGridDataPipe->setQueryCfg();
            })
            ->pipe(function () {
                $this->MGridDataPipe->setBasefields();
            })
            ->pipe(function () {
                $this->MGridDataPipe->setCommboFields();
            })
            ->pipe(function () {
                $this->MGridDataPipe->setTransformeredFields();
            })
            ->pipe(function () {
                $this->MGridDataPipe->setSqlTransformered();
            })
            ->pipe(function () {
                $this->MGridDataPipe->setWhereString();
            })
            ->pipe(function () {
                $this->MGridDataPipe->setSqlWithQueryCfg();
            })
            ->pipe(function () {
                $this->MGridDataPipe->setSqlWithAuthor();
            })
            ->pipe(function () {
                $this->MGridDataPipe->setSqlQuick();
            })
            ->pipe(function () {
                $this->MGridDataPipe->setAllRows();
            })
            ->pipe(function () {
                $this->MGridDataPipe->setRealRows();
            })
            ->pipe(function () {
                return $this->MGridDataPipe->getter();
            });

        $data = $pipeline->process($cfg);
        return $data;
    }
}
