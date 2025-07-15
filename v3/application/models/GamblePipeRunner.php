<?php

set_time_limit(0);


use League\Pipeline\StageInterface;


class GamblePipeRunner   extends CI_Model implements StageInterface {
    public  $payload = [];

    // 常量定义 (根据业务逻辑，所有参与用户都在出发顺序中，无需默认值)

    public $context; //全局上下文对象


    // private 参数
    private $gambleSysName;
    private $gameid;
    private $gambleid;
    private $groupid;
    private $userid;
    private $group_info;       // group信息,所有人


    private $holes;
    private $bootStrapOrder; //出发顺序,即参与赌球的人员的初始排名,因为没有比赛成绩,所以要硬性规定下
    private $startHoleindex;   // 第一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $endHoleindex;    // 最后一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $scores;           // 记分
    private $attenders;  // 参与赌球的人员
    private $redBlueConfig;  // 分组配置
    private $dutyConfig;  // 包洞配置
    private $ranking4TieResolveConfig;  // 排名解决平局配置

    private $rangedHoles; // 参与计算的球洞范围
    private $useful_holes; // 参与计算的球洞范围内已经记分完毕的
    private $eating_range; // 吃肉范围
    private $stroking_config; // 让杆配置
    private $meat_value_config_string; // 吃肉配置
    private $meat_max_value; // 吃肉封顶


    public function __invoke($cfg) {
    }





    // 初始化信息,包括分组方法,kpi名称,让杆配置
    public function initGamble($config) {


        $this->gambleSysName = $config['gambleSysName'];
        $this->gameid = $config['gameid'];
        $this->gambleid = $config['gambleid'];
        $this->groupid = $config['groupid'];
        $this->userid = $config['userid'];

        $this->holes =  $this->MGambleDataFactory->getGameHoles($this->gameid);
        $this->scores = $this->MGambleDataFactory->getOneGambleHoleData($this->gameid, $this->groupid, $this->startHoleindex, $this->endHoleindex);
        $this->group_info = $this->MGambleDataFactory->m_get_group_info($this->groupid);


        // 运行时配置

        $_config_row = $this->MRuntimeConfig->getGambleConfig($this->gambleid);

        debug($_config_row);

        $this->attenders = json_decode($_config_row['attenders'], true);
        $this->bootStrapOrder = json_decode($_config_row['bootstrap_order'], true);
        $this->dutyConfig = $_config_row['duty_config'];
        $this->ranking4TieResolveConfig = $_config_row['ranking_tie_resolve_config'];

        $this->draw8421_config = $_config_row['draw8421_config'];
        $this->val8421_config = json_decode($_config_row['val8421_config'], true);
        $this->sub8421_config_string = $_config_row['sub8421_config_string'];
        $this->max8421_sub_value = $_config_row['max8421_sub_value'];
        $this->eating_range = json_decode($_config_row['eating_range'], true);
        $this->stroking_config =  json_decode($_config_row['stroking_config'], true);
        $this->meat_value_config_string = $_config_row['meat_value_config_string'];
        $this->meat_max_value = $_config_row['meat_max_value'];

        $this->startHoleindex = $_config_row['startHoleindex'];
        $this->endHoleindex = $_config_row['endHoleindex'];
        $this->redBlueConfig = $_config_row['red_blue_config'];

        // 新增：初始化全局上下文对象
        $this->context = GambleContext::fromGamblePipeRunner($this);
    }

    // 处理让杆
    public function StrokingScores() {
        $this->context->scores = $this->MStroking->processStroking($this->context->scores, $this->stroking_config);
    }

    // 得到起始-终止范围内的所有洞
    public function setRangedHoles() {
        $rangedHoles = $this->MGambleDataFactory->getRangedHoles($this->context->holes, $this->context->startHoleindex, $this->context->endHoleindex);
        $this->context->rangedHoles = $rangedHoles;
    }



    // 得到需要计算的洞
    public function setFinishedHolesInRange() {
        $tmp = $this->MGambleDataFactory->getFinishedHoles($this->context->rangedHoles, $this->context->scores);
        $this->context->usefulHoles = $tmp;
    }




    public function processHoles() {
        // 直接使用全局 context
        $context = $this->context;


        foreach ($context->usefulHoles as $index => &$hole) {
            $hole['debug'] = [];
            $hole['indicators'] = [];


            // 红蓝分组 - 直接传递 useful_holes 的引用以确保实时数据
            $this->MRedBlue->setRedBlueWithContext($index, $hole, $context);

            // 计算指标
            $this->MIndicator->computeIndicators($index, $hole, $context);

            // 判断输赢
            $this->MIndicator->judgeWinner($hole, $context);

            // 进行排名计算( 排名必须在输赢判定后,因为排名可能用到输赢)
            $this->MRanking->rankAttendersWithContext($index, $hole, $context);

            // 检查是否产生肉（顶洞）
            $this->MMeat->addMeatIfDraw($hole, $context);

            // 设置双方金额（这会设置 winner_detail）
            $this->MMoney->setHoleMoneyDetail($hole, $context->dutyConfig);

            // 处理吃肉逻辑（在 winner_detail 设置之后）

            $this->MMeat->processEating($hole, $context);
        }
    }


    public function debug() {
        header('Content-Type: application/json');
        echo json_encode($this->payload, JSON_PRETTY_PRINT);
    }




    public function getter() {
        // 返回 context 里的所有数据
        return [
            'gameid' => $this->context->gameid,
            'gambleid' => $this->context->gambleid,
            'groupid' => $this->context->groupid,
            'userid' => $this->context->userid,
            'gambleSysName' => $this->context->gambleSysName,
            'redBlueConfig' => $this->context->redBlueConfig,
            'ranking4TieResolveConfig' => $this->context->ranking4TieResolveConfig,
            'holes' => $this->context->holes,
            'startHoleindex' => $this->context->startHoleindex,
            'endHoleindex' => $this->context->endHoleindex,
            'scores' => $this->context->scores,
            'group_info' => $this->context->group_info,
            'attenders' => $this->context->attenders,
            'bootStrapOrder' => $this->context->bootStrapOrder,
            'dutyConfig' => $this->context->dutyConfig,
            'useful_holes' => $this->context->usefulHoles, // 实际的计算结果,
            'rangedHoles' => $this->context->rangedHoles, // 实际的计算结果,
            'eating_range' => $this->context->eating_range,
        ];
    }







    // Getter 方法用于上下文对象
    public function getGambleSysName() {
        return $this->gambleSysName;
    }

    public function getGameid() {
        return $this->gameid;
    }

    public function getGambleid() {
        return $this->gambleid;
    }

    public function getGroupid() {
        return $this->groupid;
    }

    public function getUserid() {
        return $this->userid;
    }

    public function getHoles() {
        return $this->holes;
    }

    public function getStartHoleindex() {
        return $this->startHoleindex;
    }

    public function getEndHoleindex() {
        return $this->endHoleindex;
    }

    public function getScores() {
        return $this->scores;
    }

    public function getGroupInfo() {
        return $this->group_info;
    }

    public function getUsefulHoles() {
        return $this->useful_holes;
    }

    public function getBootStrapOrder() {
        return $this->bootStrapOrder;
    }

    public function getAttenders() {
        return $this->attenders;
    }

    public function getRedBlueConfig() {
        return $this->redBlueConfig;
    }

    public function getDutyConfig() {
        return $this->dutyConfig;
    }

    public function getRanking4TieResolveConfig() {
        return $this->ranking4TieResolveConfig;
    }

    public function getRangedHoles() {
        return $this->rangedHoles;
    }

    public function getDraw8421Config() {
        return $this->draw8421_config;
    }

    public function getVal8421Config() {
        return $this->val8421_config;
    }

    public function getSub8421ConfigString() {
        return $this->sub8421_config_string;
    }

    public function getMax8421SubValue() {
        return $this->max8421_sub_value;
    }

    public function getEatingRange() {
        return $this->eating_range;
    }

    public function getMeatValueConfigString() {
        return $this->meat_value_config_string;
    }

    public function getMeatMaxValue() {
        return $this->meat_max_value;
    }
}
