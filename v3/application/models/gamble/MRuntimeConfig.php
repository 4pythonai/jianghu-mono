<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MRuntimeConfig extends CI_Model {

    // 8421 配置缓存
    private $_8421ConfigsCache = [];

    /**
     * 获取8421系统的所有配置（带缓存）
     * @param int $gambleid 赌球ID
     * @return array 包含所有8421配置的数组
     */
    public function get8421AllConfigs($gambleid) {
        // 使用缓存避免重复获取
        if (!isset($this->_8421ConfigsCache[$gambleid])) {
            $this->_8421ConfigsCache[$gambleid]['val8421_config'] = $this->get8421UserAddValuePair($gambleid);
            $this->_8421ConfigsCache[$gambleid]['sub8421ConfigString'] = $this->get8421SubConfigString($gambleid);
            $this->_8421ConfigsCache[$gambleid]['max8421SubValue'] = $this->get8421MaxSubValue($gambleid);
            $this->_8421ConfigsCache[$gambleid]['draw8421Config'] = $this->get8421DrawConfig($gambleid);

            // 吃肉相关配置
            $this->_8421ConfigsCache[$gambleid]['eatingRange'] = $this->get8421EatingRange($gambleid);
            $this->_8421ConfigsCache[$gambleid]['meatValueConfigString'] = $this->getMeatValueConfigString($gambleid);
            $this->_8421ConfigsCache[$gambleid]['meatMaxValue'] = $this->getMeatMaxValue($gambleid);
        }

        return $this->_8421ConfigsCache[$gambleid];
    }



    // 肉的分值
    // 肉算 X 分, 吃肉数量由上面表格决定,考虑封顶
    // 分值翻倍:本洞赢 8 分,  吃 1 个洞2倍(16 分) ,2 个洞 X3(24 分),3 个洞 X4 倍(32 分).此时如果有封顶 如 3,则为 8+N*3
    // 连续翻倍: 吃完所有的洞, 2,4,8,16,不考虑封顶,也不考虑成绩表


    // 可以吃肉的范围, 赢方最好成绩----对应吃肉数量
    public function get8421EatingRange($gambleid) {

        // 帕以上  x
        // 帕     y
        // 鸟     z
        // 鸟以下  p
        return [
            'AbovePAR' => 1,
            'PAR' => 1,
            'Birdie' => 1,
            'BelowBirdie' => 1,
        ];
    }

    public function getMeatValueConfigString($gambleid) {
        return "MEAT_AS_3"; // 每块肉3分，吃肉数量由上面表格(get8421EatingRange)决定,考虑封顶
        // return "SINGLE_DOUBLE"; //  分值翻倍翻倍,比如:本洞赢 8 分,  吃 1 个洞2倍(16 分) ,2 个洞 X3(24 分),3 个洞 X4 倍(32 分).此时如果有封顶 如 3,则为 8+N*3
        // return "CONTINUE_DOUBLE"; // 连续翻倍,不遗留任何肉,无需考虑封顶,无需考虑 get8421EatingRange
    }

    // 每次吃肉的值得封顶,以极大数 1000000 为封顶,即不封顶
    public function getMeatMaxValue($gambleid) {
        return 2; // 肉封顶3点
        // return 1000000;
    }



    // 让杆的配置,可能返回多条记录,即调整让杆, 受让杆数永远为正数,
    // 如界面为负,则是1人让3人,生成3条记录.
    public function  getStrokingConfig($gambleid, $userid) {

        // if ($userid == 185) {
        //     return [
        //         '185' => [
        //             '1#' => ['PAR3' => 1, 'PAR4' => 0.5, 'PAR5' => 0.5],
        //             '8#' => ['PAR3' => 0.5, 'PAR4' => 0.5, 'PAR5' => 0.5]
        //         ]
        //     ];
        // }

        return [];
    }





    /*
    扣分封顶配置,即最多扣多少分,返回正数,小程序界面的
    不封顶为100,因为不可能发生
    */
    public function  get8421MaxSubValue($gambleid) {
        return  3; // 扣2分为止
        // return  100; // 不封顶
    }

    /*
      扣分的配置,3种格式:
       1: Par+X ,从Par+X开始扣1分, 如Par+2,从Par+2开始扣1分,打到Par+3,则扣2分
       2: DoublePar+X ,从DoublePar+X开始扣1分, 如DoublePar+2,从DoublePar+2开始扣1分,打到DoublePar+3,则扣2分
       3: NoSub ,不扣分
    */
    public function get8421SubConfigString($gambleid) {
        // Par+2 开始扣分
        // return "NoSub"; // 不扣分
        return "Par+4";
    }


    public function get8421DrawConfig($gambleid) {
        // return "NoDraw"; // 不考虑顶洞
        return "Diff_1"; // Indicator差值绝对值在x分以内算顶洞,0即为完全一样
    }


    public function  get8421UserAddValuePair($gambleid) {
        // ------------------
        // |成绩     | 加分  | 
        // |"鸟"     |  8   | 
        // |"帕"     |  4   | 
        // |"加1     |  2   | 
        // |"加2"    |  1   | 
        // |"加3"    |  X   | 

        $data = [
            67 => [
                "Par+2" => 1,
                "Par+1" => 2,
                "Par" => 4,
                "Birdie" => 8,
            ],

            93 => [
                "Par+2" => 1,
                "Par+1" => 2,
                "Par" => 4,
                "Birdie" => 8,
            ],

            160 => [
                "Par+2" => 1,
                "Par+1" => 2,
                "Par" => 4,
                "Birdie" => 8,
            ],

            185 => [
                "Par+2" => 1,
                "Par+1" => 2,
                "Par" => 4,
                "Birdie" => 8,
            ],
        ];


        return $data;
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
            // return "4_乱拉";  //  (1,4 名 ) vs (2,3名),第一洞为 1,4 名,第二洞为 2,3名
            return "4_固拉"; //  确定后不改变
            // return "4_高手不见面";  // (A组 第1名+B组第2名) vs (B组第1+A组第2),防止一方实力太强
        }
    }




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
                'userid' => 67,
                'username' => '不发力',
                'nickname' => '不发力',
                'cover' => 'http://s1.golf-brother.com/data/attach/userVipPic/2023/10/12/4e80dfffdc44daf29ec46b35a93ef6a0.png',
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
                'userid' => 160,
                'username' => 'A高攀_a1',
                'nickname' => 'A高攀_a1',
                'cover' => 'http://s1.golf-brother.com/data/attach/user/2014/10/15/97e3c9ba9b58bb48c08ab6871decde0f.png',
                'is_attender' => true,
                'initial_team' => 'red',
                'skill_level' => 4,
            ]
        ];
        return $players;
    }


    // 获取出发顺序  
    public function getBootStrapOrder($gambleid) {
        return [185, 93, 160, 67];
    }

    public function getAttenders($gambleid) {
        return [185, 93, 160, 67];
    }

    /* 包负分配置
    * 1: 不包负分       NODUTY
    * 2: 包负分         DUTY_NEGATIVE
    * 3: 同伴顶头保负分  DUTY_CODITIONAL
    *
    *
    *
    *
    */
    public function getDutyConfig($gambleid) {
        return  "DUTY_NEGATIVE";
        return "DUTY_CODITIONAL";
    }

    // 排名配置
    public function getRankingConfig($gambleid) {
        return "BYSCORE"; // 根据得分
        return "BYINDICATOR"; // 根据指标
    }
}
