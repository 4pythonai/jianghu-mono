<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
class MRuntimeConfig extends CI_Model {

    // 原始配置缓存
    private $_gambleConfigCache = [];

    public function getGambleConfig($gambleid) {
        $sql = "select * from t_gamble_runtime where id=$gambleid";
        $RunTimeConfigRow = $this->db->query($sql)->row_array();
        $userRuleId = $RunTimeConfigRow['userRuleId'];
        $sql = "select * from t_gamble_rule_user where id=$userRuleId";
        $GambleConfigRow = $this->db->query($sql)->row_array();
        $RunTimeConfigRow['sub8421_config_string'] = $GambleConfigRow['sub8421_config_string'];
        $RunTimeConfigRow['max8421_sub_value'] = $GambleConfigRow['max8421_sub_value'];
        $RunTimeConfigRow['draw8421_config'] = $GambleConfigRow['draw8421_config'];
        $RunTimeConfigRow['eating_range'] = $GambleConfigRow['eating_range'];
        $RunTimeConfigRow['meat_value_config_string'] = $GambleConfigRow['meat_value_config_string'];
        $RunTimeConfigRow['meat_max_value'] = $GambleConfigRow['meat_max_value'];
        $RunTimeConfigRow['duty_config'] = $GambleConfigRow['duty_config'];

        // 缓存结果
        $this->_gambleConfigCache[$gambleid] = $RunTimeConfigRow;
        return $RunTimeConfigRow;
    }

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

    // 可以吃肉的范围, 赢方最好成绩----对应吃肉数量
    public function get8421EatingRange($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        if (isset($config['eating_range']) && !empty($config['eating_range'])) {
            return json_decode($config['eating_range'], true);
        }
    }

    public function getMeatValueConfigString($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        return $config['meat_value_config_string'];
    }

    // 每次吃肉的值得封顶,以极大数 1000000 为封顶,即不封顶
    public function getMeatMaxValue($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        return $config['meat_max_value'];
    }

    // 让杆的配置,可能返回多条记录,即调整让杆, 受让杆数永远为正数,
    // 如界面为负,则是1人让3人,生成3条记录.
    public function getStrokingConfig($gambleid, $userid) {
        $config = $this->getGambleConfig($gambleid);
        if (isset($config['stroking_config']) && !empty($config['stroking_config'])) {
            $strokingConfig = json_decode($config['stroking_config'], true);
            return $strokingConfig[$userid] ?? [];
        }

        return [];
    }

    /*
    扣分封顶配置,即最多扣多少分,返回正数,小程序界面的
    不封顶为100,因为不可能发生
    */
    public function get8421MaxSubValue($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        return $config['max8421_sub_value'];
    }

    /*
      扣分的配置,3种格式:
       1: Par+X ,从Par+X开始扣1分, 如Par+2,从Par+2开始扣1分,打到Par+3,则扣2分
       2: DoublePar+X ,从DoublePar+X开始扣1分, 如DoublePar+2,从DoublePar+2开始扣1分,打到DoublePar+3,则扣2分
       3: NoSub ,不扣分
    */
    public function get8421SubConfigString($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        return $config['sub8421_config_string'];
    }

    public function get8421DrawConfig($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        return $config['draw8421_config'];
    }

    public function get8421UserAddValuePair($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        if (isset($config['val8421_config']) && !empty($config['val8421_config'])) {
            return json_decode($config['val8421_config'], true);
        }
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
        $config = $this->getGambleConfig($gambleid);
        return $config['red_blue_config'];
    }

    public function getRanking4TieResolveConfig($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        return $config['ranking_tie_resolve_config'];
    }



    // 获取出发顺序  
    public function getBootStrapOrder($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        if (isset($config['bootstrap_order']) && !empty($config['bootstrap_order'])) {
            return json_decode($config['bootstrap_order'], true);
        }
    }

    public function getAttenders($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        if (isset($config['attenders']) && !empty($config['attenders'])) {
            return json_decode($config['attenders'], true);
        }
    }

    /* 包负分配置
    * 1: 不包负分       NODUTY
    * 2: 包负分         DUTY_NEGATIVE
    * 3: 同伴顶头保负分  DUTY_CODITIONAL
    */
    public function getDutyConfig($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        return $config['duty_config'];
    }

    /**
     * 获取第一个洞的索引
     * @param int $gambleid 赌球ID
     * @return int 第一个洞的索引
     */
    public function getStartHoleindex($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        return $config['startHoleindex'];
    }

    /**
     * 获取最后一个洞的索引
     * @param int $gambleid 赌球ID
     * @return int 最后一个洞的索引
     */
    public function getEndHoleindex($gambleid) {
        $config = $this->getGambleConfig($gambleid);
        return $config['endHoleindex'];
    }
}
