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
    private $holes;
    private $bootStrapOrder; //出发顺序,即参与赌球的人员的初始排名,因为没有比赛成绩,所以要硬性规定下
    private $firstHoleindex;   // 第一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $lastholeindex;    // 最后一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $scores;           // 记分
    private $group_info;       // group信息,所有人
    private $attenders;  // 参与赌球的人员
    private $redBlueConfig;
    private $dutyConfig;  // 包洞配置
    private $ranking4TieResolveConfig;  // 排名解决平局配置

    // 以下为结果
    private $useful_holes;

    public function __invoke($cfg) {
    }





    // 初始化信息,包括分组方法,kpi名称,让杆配置
    public function initGamble($config) {


        $this->gambleSysName = $config['gambleSysName'];
        $this->gameid = $config['gameid'];
        $this->gambleid = $config['runtimeid'];
        $this->groupid = $config['groupid'];
        $this->userid = $config['userid'];

        $this->firstHoleindex = $this->MRuntimeConfig->getFirstHoleindex($this->gambleid);
        $this->lastholeindex = $this->MRuntimeConfig->getLastHoleindex($this->gambleid);
        $this->holes =  $this->MGambleDataFactory->getGameHoles($this->gameid);
        $this->scores = $this->MGambleDataFactory->getOneGambleHoleData($this->gameid, $this->groupid, $this->firstHoleindex, $this->lastholeindex);
        $this->group_info = $this->MGambleDataFactory->m_get_group_info($this->gameid, $this->groupid);
        $this->players =  $this->MRuntimeConfig->getAllPlayers($this->gambleid);
        $this->attenders = $this->MRuntimeConfig->getAttenders($this->gambleid);
        $this->bootStrapOrder = $this->MRuntimeConfig->getBootStrapOrder($this->gambleid);
        $this->redBlueConfig = $this->MRuntimeConfig->getRedBlueConfig($this->gambleid, count($this->attenders));
        $this->dutyConfig = $this->MRuntimeConfig->getDutyConfig($this->gambleid);
        $this->ranking4TieResolveConfig = $this->MRuntimeConfig->getRanking4TieResolveConfig($this->gambleid);
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
        debug(["93:A为峰_a2", "185:A图图手机", "67:不发力", "160:A高攀_a1"]);
        $dutyConfigMeaning = [
            '1' => '不包负分 (NODUTY)',
            '2' => '包负分 (DUTY_NEGATIVE)',
            '3' => '同伴顶头保负分 (DUTY_CODITIONAL)',
            'NODUTY' => '不包负分',
            'DUTY_NEGATIVE' => '包负分',
            'DUTY_CODITIONAL' => '同伴顶头保负分'
        ];

        $meaningText = isset($dutyConfigMeaning[$this->dutyConfig]) ? $dutyConfigMeaning[$this->dutyConfig] : '未知配置';
        debug("负分配置", $this->dutyConfig . " => " . $meaningText);

        debug("分组方式", $this->redBlueConfig);
        debug("排名解决平局配置", $this->ranking4TieResolveConfig);
        debug("出发顺序", $this->bootStrapOrder);

        // 打印8421系统配置
        debug("=== 8421系统配置 ===");
        if ($this->gambleSysName == '8421') {
            $configs = $this->MRuntimeConfig->get8421AllConfigs($this->gambleid);
            if ($configs) {
                debug("8421用户添加值对配置", $configs['val8421_config'] ?? '未设置');
                debug("8421 扣分的配置", $configs['sub8421ConfigString'] ?? '未设置');
                debug("8421 扣分封顶", $configs['max8421SubValue'] ?? '未设置');
                debug("8421 顶洞配置", $configs['draw8421Config'] ?? '未设置');
                debug("8421 吃肉范围配置", $configs['eatingRange'] ?? '未设置');
                debug("8421 肉值配置字符串");
                debug([
                    "MEAT_AS_3" => "每块肉3分，吃肉数量由上面表格(get8421EatingRange)决定,考虑封顶",
                    "SINGLE_DOUBLE" => "分值翻倍翻倍,比如:本洞赢 8 分,  吃 1 个洞2倍(16 分) ,2 个洞 X3(24 分),3 个洞 X4 倍(32 分).此时如果有封顶 如 3,则为 8+N*3",
                    "CONTINUE_DOUBLE" => "连续翻倍,不遗留任何肉,无需考虑封顶,无需考虑 get8421EatingRange"
                ]);
                debug("8421 肉值配置字符串", $configs['meatValueConfigString'] ?? '未设置');
                debug("8421 肉最大值", $configs['meatMaxValue'] ?? '未设置');
            } else {
                debug("8421配置", "未找到gambleid=" . $this->gambleid . "的配置");
            }
        } else {
            debug("8421配置", "当前不是8421游戏系统");
        }
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
            $this->MMoney->setHoleMoneyDetail($hole, $this->dutyConfig);

            // 处理吃肉逻辑（在 winner_detail 设置之后）
            if ($this->gambleSysName == '8421' && $configs) {
                $this->MMeat->processEating($hole, $configs, $context);
            }
            // debug($hole);
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
            'ranking4TieResolveConfig' => $this->ranking4TieResolveConfig,
            'holes' => $this->holes,
            'firstHoleindex' => $this->firstHoleindex,
            'lastholeindex' => $this->lastholeindex,
            'scores' => $this->scores,
            'group_info' => $this->group_info,
            'attenders' => $this->attenders,
            'bootStrapOrder' => $this->bootStrapOrder,
            'dutyConfig' => $this->dutyConfig,
            'useful_holes' => $this->useful_holes, // 实际的计算结果
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

    public function getFirstHoleindex() {
        return $this->firstHoleindex;
    }

    public function getLastHoleindex() {
        return $this->lastholeindex;
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
}
