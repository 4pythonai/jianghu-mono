<?php

use League\Pipeline\Pipeline;
use League\Pipeline\StageInterface;

class MGamePipe extends CI_Model implements StageInterface {

    public $payload = [];
    public function __invoke($cfg) {
        return $cfg;
    }

    public function init($config) {

        $this->payload['creatorid'] = $config['creatorid'];
    }




    public function debug() {
        header('Content-Type: application/json');
        echo json_encode($this->payload, JSON_PRETTY_PRINT);
    }



    public function setAllRows() {

        $sql = "SELECT * FROM t_game  ";
        $rows = $this->db->query($sql)->result_array();
        $this->payload['allgames'] =  $rows;
    }

    public function setRealRows() {
        $this->payload['realgames']  = $this->payload['allgames'];
    }



    public function getter() {
        return  $this->payload;
    }
}
