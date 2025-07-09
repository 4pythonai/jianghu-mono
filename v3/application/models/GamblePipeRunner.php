<?php

set_time_limit(0);


use League\Pipeline\StageInterface;


class GamblePipeRunner   extends CI_Model implements StageInterface {
    public  $payload = [];
    public  $config = [];

    // 常量定义 (根据业务逻辑，所有参与用户都在出发顺序中，无需默认值)



    // private 参数
    private $gambleSysName;
    private $gameid;
    private $gambleid;
    private $groupid;
    private $userid;
    private $holes;
    private $players; //参与赌球的人员
    private $bootStrapOrder; //出发顺序,即参与赌球的人员的初始排名,因为没有比赛成绩,所以要硬性规定下
    private $firstholeindex;   // 第一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $lastholeindex;    // 最后一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $scores;           // 记分
    private $group_info;       // group信息,所有人
    private $attenders;  // 参与赌球的人员
    private $gamble_result;    // 一个赌球游戏的结果
    private $redBlueConfig;
    private $dutyConfig;  // 包洞配置

    // 以下为结果
    private $useful_holes;
    public function __invoke($cfg) {
    }





    // 初始化信息,包括分组方法,kpi名称,让杆配置
    public function initGamble($config) {
        $this->config = $config;
        $this->gambleSysName = $config['gambleSysName'];
        $this->gameid = $config['gameid'];
        $this->gambleid = $config['gambleid'];
        $this->groupid = $config['groupid'];
        $this->userid = $config['userid'];

        $this->firstholeindex = 1;
        $this->lastholeindex =  18;
        $this->holes =  $this->MGambleDataFactory->getGameHoles($this->gambleid);
        $this->scores = $this->MGambleDataFactory->getOneGambleHoleData($this->gameid, $this->groupid, $this->firstholeindex, $this->lastholeindex);
        $this->group_info = $this->MGambleDataFactory->m_get_group_info($this->gameid, $this->groupid);
        $this->players =  $this->MRuntimeConfig->getAllPlayers($this->gambleid);
        $this->attenders = $this->MRuntimeConfig->getAttenders($this->gambleid);
        $this->bootStrapOrder = $this->MRuntimeConfig->getBootStrapOrder($this->gambleid);
        $this->redBlueConfig = $this->MRuntimeConfig->getRedBlueConfig($this->gambleid, count($this->attenders));
        $this->dutyConfig = $this->MRuntimeConfig->getDutyConfig($this->gambleid);
    }

    // 处理让杆
    public function StrokingScores() {
        $stroking_config = $this->MRuntimeConfig->getStrokingConfig($this->gambleid, $this->userid);
        $this->scores = $this->MStroking->processStroking($this->scores, $stroking_config);
    }


    public function printGambleConfig() {
        debug("游戏名称", $this->gambleSysName);
        debug("游戏id", $this->gameid);
        debug("赌球id", $this->gambleid);
        debug("分组id", $this->groupid);
        debug("用户id", $this->userid);
        debug("负分配置", $this->dutyConfig);
        debug("分组方式", $this->redBlueConfig);
    }



    // 得到需要计算的洞
    public function setUsefulHoles() {
        $this->useful_holes = $this->MGambleDataFactory->getUsefulHoles($this->holes, $this->scores);
        // gambleSysName 给每个洞加上 输赢点数
        foreach ($this->useful_holes as &$hole) {
            $hole['gambleSysName'] = $this->gambleSysName;
        }
    }

    public function processHoles() {
        // 创建上下文对象，避免重复创建
        $context = GambleContext::fromGamblePipeRunner($this);

        // 获取8421配置 （如果需要）
        $configs = null;
        if ($this->gambleSysName == '8421') {
            $configs = $this->MRuntimeConfig->get8421AllConfigs($this->gambleid);
        }

        foreach ($this->useful_holes as  $index => &$hole) {
            $hole['debug'] = [];
            $hole['indicators'] = [];
            $hole['meat'] = [];

            // 红蓝分组 - 直接传递 useful_holes 的引用以确保实时数据
            $this->MRedBlue->setRedBlueWithContext($index, $hole, $context, $this->useful_holes);

            // 计算指标
            $this->MIndicator->computeIndicators($index, $hole, $configs, $context);

            // 进行排名计算
            $this->MRanking->rankAttendersWithContext($index, $hole, $context);

            // 判断输赢
            $this->MIndicator->judgeWinner($hole, $context);

            // 设置双方金额
            $this->MMoney->setHoleMoneyDetail($hole, $this->dutyConfig);

            debug($hole);
        }
    }










    public function debug() {
        header('Content-Type: application/json');
        echo json_encode($this->payload, JSON_PRETTY_PRINT);
    }




    public function getter() {
        return  [
            'gameid' => $this->gameid,
            'gambleid' => $this->gambleid,
            'groupid' => $this->groupid,
            'userid' => $this->userid,
            'gambleSysName' => $this->gambleSysName,
            'redBlueConfig' => $this->redBlueConfig,
            'holes' => $this->holes,
            'firstholeindex' => $this->firstholeindex,
            'lastholeindex' => $this->lastholeindex,
            'scores' => $this->scores,
            'group_info' => $this->group_info,
            'attenders' => $this->attenders,
            'bootStrapOrder' => $this->bootStrapOrder,
            'dutyConfig' => $this->dutyConfig,
            'useful_holes' => $this->useful_holes, // 实际的计算结果
        ];
    }




    /**
     * 添加调试日志
     */
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
}
