<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}




class MPoints extends CI_Model {


    public function __construct() {
        parent::__construct();
        $this->load->model('gamble/Indicators/MIndicator8421');
        $this->load->model('gamble/Indicators/MIndicatorLasi');
    }




    public function setWinFailPoints(&$hole, $context) {
        if ($context->gambleSysName == '4p-8421') {
            $this->MIndicator8421->set8421WinFailPoints($hole, $context);
        }
        if ($context->gambleSysName == '4p-lasi') {
            $this->MIndicatorLasi->setLasiWinFailPoints($hole, $context);
        }
    }


    public function setLasiMultiplyReward(&$hole, $context) {
    }
}
