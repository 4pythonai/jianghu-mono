<?php

set_time_limit(0);


use League\Pipeline\StageInterface;


class GamblePipeRunner   extends CI_Model implements StageInterface {
    public  $payload = [];

    // 常量定义 (根据业务逻辑，所有参与用户都在出发顺序中，无需默认值)



    // private 参数
    private $gambleSysName;
    private $gameid;
    private $gambleid;
    private $groupid;
    private $userid;
    private $group_info;       // group信息,所有人

    private $useful_holes;

    private $holes;
    private $bootStrapOrder; //出发顺序,即参与赌球的人员的初始排名,因为没有比赛成绩,所以要硬性规定下
    private $startHoleindex;   // 第一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $endHoleindex;    // 最后一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $scores;           // 记分
    private $attenders;  // 参与赌球的人员
    private $redBlueConfig;
    private $dutyConfig;  // 包洞配置
    private $ranking4TieResolveConfig;  // 排名解决平局配置

    private $rangedHoles;

    public $context; // 新增：全局上下文对象

    public function __invoke($cfg) {
    }





    // 初始化信息,包括分组方法,kpi名称,让杆配置
    public function initGamble($config) {


        $this->gambleSysName = $config['gambleSysName'];
        $this->gameid = $config['gameid'];
        $this->gambleid = $config['runtimeid'];
        $this->groupid = $config['groupid'];
        $this->userid = $config['userid'];

        $this->startHoleindex = $this->MRuntimeConfig->getStartHoleindex($this->gambleid);
        $this->endHoleindex = $this->MRuntimeConfig->getEndHoleindex($this->gambleid);
        $this->holes =  $this->MGambleDataFactory->getGameHoles($this->gameid);
        $this->scores = $this->MGambleDataFactory->getOneGambleHoleData($this->gameid, $this->groupid, $this->startHoleindex, $this->endHoleindex);
        $this->group_info = $this->MGambleDataFactory->m_get_group_info($this->groupid);
        $this->attenders = $this->MRuntimeConfig->getAttenders($this->gambleid);
        $this->bootStrapOrder = $this->MRuntimeConfig->getBootStrapOrder($this->gambleid);
        $this->redBlueConfig = $this->MRuntimeConfig->getRedBlueConfig($this->gambleid, count($this->attenders));
        $this->dutyConfig = $this->MRuntimeConfig->getDutyConfig($this->gambleid);
        $this->ranking4TieResolveConfig = $this->MRuntimeConfig->getRanking4TieResolveConfig($this->gambleid);

        // 新增：初始化全局上下文对象
        $this->context = GambleContext::fromGamblePipeRunner($this);
    }

    // 处理让杆
    public function StrokingScores() {
        $stroking_config = $this->MRuntimeConfig->getStrokingConfig($this->context->gambleid, $this->context->userid);
        $this->context->scores = $this->MStroking->processStroking($this->context->scores, $stroking_config);
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
        // $this->context->rangedHoles = $tmp;
    }




    public function processHoles() {
        // 直接使用全局 context
        $context = $this->context;

        // 获取8421配置 （如果需要）
        $configs = null;
        if ($context->gambleSysName == '8421') {
            $configs = $this->MRuntimeConfig->get8421AllConfigs($context->gambleid);
        }

        foreach ($context->usefulHoles as $index => &$hole) {
            $hole['debug'] = [];
            $hole['indicators'] = [];


            // 红蓝分组 - 直接传递 useful_holes 的引用以确保实时数据
            $this->MRedBlue->setRedBlueWithContext($index, $hole, $context);

            // 计算指标
            $this->MIndicator->computeIndicators($index, $hole, $configs, $context);

            // 判断输赢
            $this->MIndicator->judgeWinner($hole, $context);

            // 进行排名计算( 排名必须在输赢判定后,因为排名可能用到输赢)
            $this->MRanking->rankAttendersWithContext($index, $hole, $context);

            // 检查是否产生肉（顶洞）
            $this->MMeat->addMeatIfDraw($hole, $context);

            // 设置双方金额（这会设置 winner_detail）
            $this->MMoney->setHoleMoneyDetail($hole, $context->dutyConfig);

            // 处理吃肉逻辑（在 winner_detail 设置之后）
            if ($context->gambleSysName == '8421' && $configs) {
                $this->MMeat->processEating($hole, $configs, $context);
            }
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
        ];
    }




    private function addDebugLog(&$hole, $msg) {
        $hole['debug'][] = $msg;
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
}
