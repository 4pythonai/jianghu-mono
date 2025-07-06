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


    // 分组方式
    public function getRedBlueConfig($gambleid, $attender_number) {

        if ($attender_number == 2) {
            return $this->get2playersRedBlueConfig($gambleid, $attender_number);
        }
        if ($attender_number == 3) {
            return $this->get3playersRedBlueConfig($gambleid, $attender_number);
        }
        if ($attender_number == 4) {
            return $this->get4playersRedBlueConfig($gambleid, $attender_number);
        }
    }

    // 2人分组方式
    public function get2playersRedBlueConfig($gambleid, $attender_number) {
        return null;
    }

    // 3人分组方式
    public function get3playersRedBlueConfig($gambleid, $attender_number) {
        return null;
    }


    // 4人分组方式
    public function get4playersRedBlueConfig($gambleid, $attender_number) {
        if ($gambleid == 679528) {
            return "4_乱拉";  //  (1,4 名 ) vs (2,3名),第一洞为 1,4 名,第二洞为 2,3名
            return "4_固拉"; //  确定后不改变
            return "4_高手不见面";  // (A组 第1名+B组第2名) vs (B组第1+A组第2),防止一方实力太强
        }
    }



    // 获取所有玩家

    public function getAllPlayers($gambleid) {
        $players = [
            [
                'userid' => 93,
                'username' => 'A为峰_a2',
                'nickname' => 'A为峰_a2',
                'cover' => 'http://s1.golf-brother.com/data/attach/user/2014/12/29/c240_cb01d5ff2b7ec41ebeab07c461e191aa.jpg',
                'is_attender' => true,
                'initial_team' => 'blue',
                'skill_level' => 1, // 技术水平排名
            ],
            [
                'userid' => 160,
                'username' => 'A高攀_a1',
                'nickname' => 'A高攀_a1',
                'cover' => 'http://s1.golf-brother.com/data/attach/user/2014/10/15/c240_97e3c9ba9b58bb48c08ab6871decde0f.png',
                'is_attender' => true,
                'initial_team' => 'red',
                'skill_level' => 2,
            ],
            [
                'userid' => 185,
                'username' => 'A图图手机',
                'nickname' => 'A图图手机',
                'cover' => 'http://s1.golf-brother.com/data/attach/userVipPic/2023/05/14/c240_c93a158495a41393d4799324c952cea1.png',
                'is_attender' => true,
                'initial_team' => 'blue',
                'skill_level' => 3,
            ],
            [
                'userid' => 2271,
                'username' => 'B何斌_b2',
                'nickname' => 'B何斌_b2',
                'cover' => 'http://s1.golf-brother.com/data/attach/user/c240_holder_formal_user_cover.png',
                'is_attender' => true,
                'initial_team' => 'red',
                'skill_level' => 4,
            ]
        ];
        return $players;
    }


    // 获取出发顺序  
    public function getFirstHolePlayersOrder($gambleid) {
        return [93, 160, 185, 2271];
    }

    public function getAttenders($gambleid) {
        return [93, 160, 185, 2271];
    }
}
