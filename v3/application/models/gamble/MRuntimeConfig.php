<?php

declare(strict_types=1);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MRuntimeConfig extends CI_Model {


    // 让杆的配置,可能返回多条记录,即调整让杆, 受让杆数永远为正数,
    // 如界面为负,则是1人让3人,生成3条记录.
    public function  getStrokingConfig($gambleid, $userid) {

        if ($userid == 185) {
            return [
                '185' => [
                    '1#' => ['PAR3' => 1, 'PAR4' => 0.5, 'PAR5' => 0.5],
                    '8#' => ['PAR3' => 0.5, 'PAR4' => 0.5, 'PAR5' => 0.5]
                ]
            ];
        }
        return null;
    }
}
