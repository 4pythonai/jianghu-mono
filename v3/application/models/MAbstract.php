<?php

class MAbstract  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }


  public function createAbstract($gambleSysName, $red_blue_config) {
    return  $gambleSysName . "(4人" . $red_blue_config . rand(100000, 999999) . ")";
  }
}
