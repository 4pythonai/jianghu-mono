<?php

declare(strict_types=1);

use League\Pipeline\Pipeline;
use League\Pipeline\StageInterface;


if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MTableGridCfgAssemble extends CI_Model {
    public function __construct() {
        parent::__construct();
        $this->load->model('MTableGridCfgExecutor');
    }

    public function  PipeRunner($cfg) {

        $pipeline = (new Pipeline())

            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->init($config);
                return $config;
            })
            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->setGridMeta($config);
                return $config;
            })
            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->setTotalColsCfg();
                return $config;
            })

            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->reorderColumns();
                return $config;
            })

            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->setColumnHiddenCols();
                return $config;
            })
            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->setFormHiddenCols();
                return $config;
            })
            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->setTableColumnRender();
                return $config;
            })
            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->setFormUsedColumns();
                return $config;
            })
            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->setUFormConfig();
                return $config;
            })
            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->setButtonCfg();
                return $config;
            })

            ->pipe(function ($config) {
                $this->MTableGridCfgExecutor->removeForbidButtons();
                return $config;
            })

            ->pipe(function () {
                $result = $this->MTableGridCfgExecutor->getter();
                return $result;
            });
        $tmp = $pipeline->process($cfg);
        return $tmp;
    }
}
