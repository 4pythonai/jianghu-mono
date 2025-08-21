<?php

set_time_limit(0);


use League\Pipeline\StageInterface;


class GamblePipeRunner   extends CI_Model implements StageInterface {
    public  $payload = [];


    public $context; //全局上下文对象


    // private 参数
    private $gambleSysName;
    private $gambleUserName;
    private $gameid;
    private $gambleid;
    private $groupid;
    private $userid;
    private $group_info;


    private $holes;

    private $bootStrapOrder; //出发顺序,即参与赌球的人员的初始排名,因为没有比赛成绩,所以要硬性规定下
    private $startHoleindex;   // 第一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $roadLength; // 路长

    private $scores;           // 记分
    private $attenders;  // 参与赌球的人员
    private $redBlueConfig;  // 分组配置
    private $dutyConfig;  // 包洞配置
    private $ranking4TieResolveConfig;  // 排名解决平局配置
    private $holePlayList; // 洞序配置

    private $useful_holes; // 参与计算的球洞范围内已经记分完毕的
    private $eatingRange; // 吃肉范围
    private $stroking_config; // 让杆配置
    private $meatValueConfig; // 吃肉配置
    private $meatMaxValue; // 吃肉封顶,
    private $kickConfig; // 踢球配置
    private $donationCfg; // 捐赠配置
    private $bigWind; // 大风配置
    private $kpis; // KPI配置
    private $RewardConfig; // 奖励配置



    public function __invoke($cfg) {
    }





    // 初始化信息,包括分组方法,kpi名称,让杆配置
    public function initGamble($config) {


        $this->gambleSysName = $config['gambleSysName'];
        $this->gambleUserName = $config['gambleUserName'];
        $this->gameid = $config['gameid'];
        $this->gambleid = $config['gambleid'];
        $this->groupid = $config['groupid'];
        $this->userid = $config['userid'];


        // 运行时配置
        $_config_row = $this->MRuntimeConfig->getGambleConfig($this->gambleid);

        $this->holes =  $this->MGambleDataFactory->getHoleOrderArrayByHolePlayList($this->gameid,  $_config_row['startHoleindex'], $_config_row['roadLength']);
        $this->scores = $this->MGambleDataFactory->getScoresOrderByHolePlayList($this->gameid, $_config_row['startHoleindex'], $_config_row['roadLength']);
        $this->group_info = $this->MGame->m_get_group_info($this->groupid);



        $this->attenders = json_decode($_config_row['attenders'], true);
        $this->bootStrapOrder = json_decode($_config_row['bootstrap_order'], true);
        $this->dutyConfig = $_config_row['dutyConfig'];
        $this->ranking4TieResolveConfig = $_config_row['ranking_tie_resolve_config'];
        $this->drawConfig = $_config_row['drawConfig'];
        $this->playerIndicatorConfig = json_decode($_config_row['playerIndicatorConfig'], true);
        $this->badScoreBaseLine = $_config_row['badScoreBaseLine'];
        $this->badScoreMaxLost = $_config_row['badScoreMaxLost'];
        $this->eatingRange = json_decode($_config_row['eatingRange'], true);
        $this->stroking_config =  json_decode($_config_row['stroking_config'], true);
        $this->meatValueConfig = $_config_row['meatValueConfig'];
        $this->meatMaxValue = $_config_row['meatMaxValue'];

        $this->startHoleindex = $_config_row['startHoleindex'];
        $this->roadLength = $_config_row['roadLength'];

        $this->redBlueConfig = $_config_row['red_blue_config'];

        $this->kickConfig = $_config_row['kickConfig'];
        $this->donationCfg = $_config_row['donationCfg'];
        $this->bigWind = $_config_row['bigWind'];
        $this->kpis = json_decode($_config_row['kpis'], true);
        $this->RewardConfig = json_decode($_config_row['RewardConfig'], true);



        $this->context = GambleContext::fromGamblePipeRunner($this);
    }

    // 处理让杆
    public function StrokingScores() {
        $this->context->scores = $this->MStroking->processStroking($this->context->scores, $this->stroking_config);
    }




    // 得到需要计算的洞（合并了范围筛选和有用洞筛选功能）
    public function setUsefullHoles() {
        // 先筛选出指定范围的洞
        $_rangedHoles = $this->MGambleDataFactory->getRangedHoles($this->context->holes, $this->context->startHoleindex, $this->context->roadLength);

        // 再从范围洞中筛选出有用的洞
        $tmp = $this->MGambleDataFactory->getUsefulHoles($_rangedHoles, $this->context->scores);
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

            // 设置要比较的 kpi分支,如 [8421],['best','worst','total']
            $this->MIndicator->setKpiBranches($context);


            // 计算所有分项指标
            $this->MIndicator->calculateKPIs($hole, $context);

            // 判断输赢,设置点数
            $this->MPoints->setWinnerFailerAndPoints($hole, $context);

            // 进行排名计算( 排名必须在输赢判定后,因为排名可能用到输赢)
            $this->MRanking->rankAttendersWithContext($index, $hole, $context);

            // 检查是否产生肉（顶洞）
            $this->MMeat->addMeatIfDraw($hole, $context);

            $this->MMoney->setHolePointsDetail($hole, $context);

            // 设置 duty
            $this->MMoney->dutyHandler($hole, $context);

            // 处理吃肉逻辑（在 winner_detail 设置之后）
            $this->MMeat->processEating($hole, $context);
        }


        $this->MDonation->processDonation($context);

        $this->MDonation->setFinalPoints($context);
    }


    public function debug() {
        header('Content-Type: application/json');
        echo json_encode($this->payload, JSON_PRETTY_PRINT);
    }




    public function getter() {
        // 返回 context 里的所有数据
        $tmp = [
            'gameid' => $this->context->gameid,
            'gambleid' => $this->context->gambleid,
            'kpis' => $this->context->kpis,
            'RewardConfig' => $this->context->RewardConfig,
            'badScoreBaseLine' => $this->context->badScoreBaseLine,
            'groupid' => $this->context->groupid,
            'userid' => $this->context->userid,
            'gambleSysName' => $this->context->gambleSysName,
            'gambleUserName' => $this->context->gambleUserName,
            'redBlueConfig' => $this->context->redBlueConfig,
            'ranking4TieResolveConfig' => $this->context->ranking4TieResolveConfig,
            'drawConfig' => $this->context->drawConfig,
            // 'holes' => $this->context->holes,
            'startHoleindex' => $this->context->startHoleindex,
            'meat_pool' => $this->context->meat_pool,
            'donation_pool' => $this->context->donation_pool,
            // 'scores' => $this->context->scores,
            'meatValueConfig' => $this->context->meatValueConfig,
            'meatMaxValue' => $this->context->meatMaxValue,
            'attenders' => $this->context->attenders,
            'bootStrapOrder' => $this->context->bootStrapOrder,
            'dutyConfig' => $this->context->dutyConfig,
            'eatingRange' => $this->context->eatingRange,
            'kickConfig' => $this->context->kickConfig,
            'donationCfg' => $this->context->donationCfg,
            'bigWind' => $this->context->bigWind,
            'group_info' => $this->context->group_info,
            'useful_holes' => $this->context->usefulHoles, // 实际的计算结果,
            'roadLength' => $this->context->roadLength,
            'kpiBranches' => $this->context->kpiBranches,
        ];
        return $tmp;
    }


    // Getter 方法用于上下文对象
    public function getGambleSysName() {
        return $this->gambleSysName;
    }

    public function getGambleUserName() {
        return $this->gambleUserName;
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


    public function getDrawConfig() {
        return $this->drawConfig;
    }

    public function getPlayerIndicatorConfig() {
        return $this->playerIndicatorConfig;
    }

    public function getDeductionConfig() {
        return $this->badScoreBaseLine;
    }

    public function getDeductionMaxValue() {
        return $this->badScoreMaxLost;
    }

    public function getEatingRange() {
        return $this->eatingRange;
    }

    public function getMeatValueConfig() {
        return $this->meatValueConfig;
    }

    public function getMeatMaxValue() {
        return $this->meatMaxValue;
    }

    public function getHolePlayList() {
        return $this->holePlayList;
    }

    public function getKickConfig() {
        return $this->kickConfig;
    }

    public function getDonationCfg() {
        return $this->donationCfg;
    }

    public function getBigWind() {
        return $this->bigWind;
    }

    public function getRoadLength() {
        return $this->roadLength;
    }

    public function getKpis() {
        return $this->kpis;
    }

    public function getRewardConfig() {
        return $this->RewardConfig;
    }
}
