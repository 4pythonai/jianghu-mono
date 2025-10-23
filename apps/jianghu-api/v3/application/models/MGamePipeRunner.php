<?php

use League\Pipeline\Pipeline;

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MGamePipeRunner extends CI_Model {
    public function __construct() {
        parent::__construct();
        $this->load->model('MGamePipe');
    }

    public function  GameFeedHandler($cfg) {
        $pipeline = (new Pipeline())
            ->pipe(function ($config) {

                $this->MGamePipe->init($config);
            })
            ->pipe(function () {
                $this->MGamePipe->getMyGames();
            })

            ->pipe(function () {
                $this->MGamePipe->getStarFriendsGames();
            })
            ->pipe(function () {
                $this->MGamePipe->getStarGames();
            })

            ->pipe(function () {
                return $this->MGamePipe->getter();
            });

        $data = $pipeline->process($cfg);
        return $data;
    }
}
