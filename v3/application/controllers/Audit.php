<?php

declare(strict_types=1);
set_time_limit(0);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

// http://127.0.0.1:7880/Gamble/alpha_summary/?single=1&  gambleid=679528& 
// groupid=2689120&userid=185&debug=1



class Audit extends CI_Controller {
    public function __construct() {

        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
        $this->load->model('GamblePipe');
        $this->load->model('GamblePipeRunner');
        $this->load->model('gamble/MGambleDataFactory');
        $this->load->model('gamble/MRuntimeConfig');
        $this->load->model('gamble/MStroking');
        $this->load->model('gamble/MIndicator');
        $this->load->model('gamble/MRedBlue');
        $this->load->model('gamble/MMoney');
        $this->load->model('gamble/MRanking');
        $this->load->model('gamble/GambleContext');
        $this->load->model('gamble/MRanking');
        $this->load->model('gamble/GambleContext');
        $this->load->model('gamble/MMeat');
    }

    public function printResult($result) {
        $this->load->view('gamble/VGambleResut', $result);
    }



    //  update t_game set gamestate=3 where gameid=1344463

    public function index() {
        $cfg = ['gambleSysName' => '8421',  'gameid' => 1344463, 'gambleid' => 679528, 'groupid' => 2742243, 'userid' => 185];

        $final_result = $this->GamblePipe->GetGambleResult($cfg);
        debug($final_result['useful_holes']);
        // debug("Final Result>>>>>>>>>>>>>>>>>>>>>>>");
        $this->printResult($final_result);
    }
}
