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
        foreach ($this->useful_holes as  $index => &$hole) {
            $hole['debug'] = [];
            $hole['indicators'] = [];

            $this->MRedBlue->setRedBlue($index, $hole, $this->attenders, $this->bootStrapOrder, $this->redBlueConfig);
            $this->ComputeIndicator($index, $hole);
            $this->RankingAttenders($index, $hole);
            $this->MIndicator->judgeWinner($hole);
            $this->MMoney->setHoleMoneyDetail($hole, $this->dutyConfig);
            debug($hole);
        }
    }

    private function ComputeIndicator($index, &$hole) {
        if ($this->gambleSysName == '8421') {
            $this->cal8421Indicators($index, $hole);
        }
    }

    /**
     * 对参赛者在本洞进行排名，不允许并列
     * 
     * 排名逻辑已移植到 MRanking 模型中，支持：
     * - 当前洞indicators比较
     * - 历史洞回溯打破并列  
     * - 出发顺序兜底
     * 
     * @param int $index 洞索引
     * @param array $hole 洞数据（包含indicators，会被添加ranking）
     */
    private function RankingAttenders($index, &$hole) {

        // [indicators] => Array
        // (
        //     [93] => 8
        //     [160] => 8
        //     [185] => -3
        //     [67] => -2
        // )

        // 创建上下文对象，避免传递过多参数
        $context = GambleContext::fromGamblePipeRunner($this);

        // 调用 MRanking 模型进行排名计算
        $this->MRanking->rankAttendersWithContext($hole, $index, $context);
    }



    private function cal8421Indicators($index, &$hole) {

        // 8421加分项
        $val8421_config = $this->MRuntimeConfig->get8421UserAddValuePair($this->gambleid);
        // 8421 减分项
        $sub8421ConfigString = $this->MRuntimeConfig->get8421SubConfigString($this->gambleid);
        // 8421 扣分封顶,正数
        $max8421SubValue = $this->MRuntimeConfig->get8421MaxSubValue($this->gambleid);

        // debug("8421加分项", $val8421_config);
        // debug("扣分配置", $sub8421ConfigString);
        // debug("扣分封顶", $max8421SubValue);
        // debug("负分配置", $this->dutyConfig);
        // debug("分组方式", $this->redBlueConfig);






        $indicatorBlue = 0;
        $indicatorRed = 0;
        foreach ($hole['red']  as $userid) {

            $userAddConfigPair = $val8421_config[$userid];
            $_8421_add_sub_max_config = [
                'add' => $userAddConfigPair,
                'sub' => $sub8421ConfigString,
                'max' => $max8421SubValue,
            ];

            $indicator = $this->MIndicator->OnePlayer8421Indicator($hole['par'],  $hole['computedScores'][$userid], $_8421_add_sub_max_config);
            $logMsg = sprintf(
                "第 %s 洞,红队,队员:%4d,PAR:%d,分值:%2d,指标:%2d",
                $hole['id'],
                $userid,
                $hole['par'],
                $hole['computedScores'][$userid],
                $indicator
            );
            $hole['indicators'][$userid] = $indicator;
            $this->addDebugLog($hole, $logMsg);
            $indicatorRed += $indicator;
        }

        foreach ($hole['blue']  as $userid) {

            $userAddConfigPair = $val8421_config[$userid];

            $_8421_add_sub_max_config = [
                'add' => $userAddConfigPair,
                'sub' => $sub8421ConfigString,
                'max' => $max8421SubValue,
            ];

            $indicator = $this->MIndicator->OnePlayer8421Indicator($hole['par'],  $hole['computedScores'][$userid], $_8421_add_sub_max_config);
            $logMsg = sprintf(
                "第 %s 洞,蓝队,队员:%4d,PAR:%d,分值:%2d,指标:%2d",
                $hole['id'],
                $userid,
                $hole['par'],
                $hole['computedScores'][$userid],
                $indicator
            );
            $hole['indicators'][$userid] = $indicator;
            $this->addDebugLog($hole, $logMsg);
            $indicatorBlue += $indicator;
        }

        $hole['indicatorBlue'] = $indicatorBlue;
        $hole['indicatorRed'] = $indicatorRed;
    }






    public function debug() {
        header('Content-Type: application/json');
        echo json_encode($this->payload, JSON_PRETTY_PRINT);
    }




    public function getter() {
        return  [
            'gameid' => $this->gameid,
            '分组方式' => $this->redBlueConfig,
            'gambleid' => $this->gambleid,
            'groupid' => $this->groupid,
            'userid' => $this->userid,
            'holes' => $this->holes,
            'firstholeindex' => $this->firstholeindex,
            'lastholeindex' => $this->lastholeindex,
            'scores' => $this->scores,
            'group_info' => $this->group_info,
            'attenders' => [93, 160, 185, 2271],
            'gamble_result' => $this->getGambleResultDemo(),
        ];
    }




    /**
     * 生成完整的 gamble_result demo 数据
     * 用于展示表格结构和数据格式
     */
    public function getGambleResultDemo() {
        return [
            'meta' => [
                'gameid' => 1318446,
                'gambleid' => 679528,
                'groupid' => 2689120,
                'gamble_type' => '2v2',
                'total_holes' => 18,
                'calculated_holes' => 2, // 实际计算的洞数
                'created_at' => date('Y-m-d H:i:s'),
            ],

            'players' =>  $this->players,
            'holes' => [
                [
                    'holeid' => 2485,
                    'holename' => 'A1',
                    'par' => 5,
                    'hindex' => 1,
                    'court_key' => 1,
                    'details' => [
                        93 => [
                            'score' => 5,              // 实际成绩
                            'stroking_score' => 5,     // 让杆后成绩
                            'stroking_value' => 0,     // 让杆数
                            'team' => 'blue',          // 分队
                            'point' => 0.5,            // 输赢点数 (正数赢，负数输)
                            'is_attender' => true,     // 是否参与赌博
                            'is_baodong' => false,     // 是否包洞
                            'baodong_detail' => '',    // 包洞详细说明
                            'indicator' => 4.5,        // 队伍指标贡献值
                        ],
                        160 => [
                            'score' => 5,
                            'stroking_score' => 5,
                            'stroking_value' => 0,
                            'team' => 'red',
                            'point' => -0.5,
                            'is_attender' => true,
                            'is_baodong' => false,
                            'baodong_detail' => '',
                            'indicator' => 5.0,
                        ],
                        185 => [
                            'score' => 4,
                            'stroking_score' => 4,
                            'stroking_value' => 0,
                            'team' => 'blue',
                            'point' => 0.5,
                            'is_attender' => true,
                            'is_baodong' => false,
                            'baodong_detail' => '',
                            'indicator' => 4.5,
                        ],
                        2271 => [
                            'score' => 10,
                            'stroking_score' => 9,     // 让了1杆
                            'stroking_value' => 1,
                            'team' => 'red',
                            'point' => -0.5,
                            'is_attender' => true,
                            'is_baodong' => true,       // 包洞
                            'baodong_detail' => '成绩过差，触发包洞机制',
                            'indicator' => 5.0,
                        ],
                    ],
                    'team_summary' => [
                        'blue' => [
                            'indicator' => 4.5,        // 队伍指标 (取最好成绩)
                            'total_point' => 1.0,      // 队伍总得分
                            'members' => [93, 185],
                        ],
                        'red' => [
                            'indicator' => 5.0,        // 队伍指标
                            'total_point' => -1.0,     // 队伍总得分
                            'members' => [160, 2271],
                        ],
                    ],
                    'hole_summary' => [
                        'draw' => false,            // 是否顶洞
                        'meat_count' => 0,          // 肉的数量
                        'multiplier' => 1,          // 倍数
                        'winner_team' => 'blue',    // 获胜队伍
                        'point_diff' => 0.5,        // 点数差
                        'calculation_method' => 'best_score', // 计算方法
                    ],
                ],
                [
                    'holeid' => 2486,
                    'holename' => 'A2',
                    'par' => 4,
                    'hindex' => 2,
                    'court_key' => 1,
                    'details' => [
                        93 => [
                            'score' => 4,
                            'stroking_score' => 4,
                            'stroking_value' => 0,
                            'team' => 'blue',
                            'point' => 0,              // 平局
                            'is_attender' => true,
                            'is_baodong' => false,
                            'baodong_detail' => '',
                            'indicator' => 4.0,
                        ],
                        160 => [
                            'score' => 8,
                            'stroking_score' => 7.5,   // 让了0.5杆
                            'stroking_value' => 0.5,
                            'team' => 'red',
                            'point' => 0,
                            'is_attender' => true,
                            'is_baodong' => false,
                            'baodong_detail' => '',
                            'indicator' => 4.0,
                        ],
                        185 => [
                            'score' => 4,
                            'stroking_score' => 4,
                            'stroking_value' => 0,
                            'team' => 'blue',
                            'point' => 0,
                            'is_attender' => true,
                            'is_baodong' => false,
                            'baodong_detail' => '',
                            'indicator' => 4.0,
                        ],
                        2271 => [
                            'score' => 4,
                            'stroking_score' => 4,
                            'stroking_value' => 0,
                            'team' => 'red',
                            'point' => 0,
                            'is_attender' => true,
                            'is_baodong' => false,
                            'baodong_detail' => '',
                            'indicator' => 4.0,
                        ],
                    ],
                    'team_summary' => [
                        'blue' => [
                            'indicator' => 4.0,
                            'total_point' => 0,
                            'members' => [93, 185],
                        ],
                        'red' => [
                            'indicator' => 4.0,
                            'total_point' => 0,
                            'members' => [160, 2271],
                        ],
                    ],
                    'hole_summary' => [
                        'draw' => true,             // 顶洞
                        'meat_count' => 1,          // 产生1个肉
                        'multiplier' => 1,
                        'winner_team' => null,
                        'point_diff' => 0,
                        'calculation_method' => 'best_score',
                    ],
                ],
            ],

            'summary' => [
                'total_points' => [
                    93 => 0.5,      // 总输赢点数
                    160 => -0.5,
                    185 => 0.5,
                    2271 => -0.5,
                ],
                'team_points' => [
                    'blue' => 1.0,
                    'red' => -1.0,
                ],
                'meat_summary' => [
                    'total_meat' => 1,          // 总肉数
                    'pending_holes' => [2],     // 待决定的洞
                ],
                'special_events' => [
                    'baodong_count' => 1,       // 包洞次数
                    'punishment_count' => 0,    // 惩罚次数
                ],
                'statistics' => [
                    'total_calculated_holes' => 2,
                    'draw_holes' => 1,
                    'decided_holes' => 1,
                    'average_score' => [
                        93 => 4.5,
                        160 => 6.5,
                        185 => 4.0,
                        2271 => 7.0,
                    ],
                ],
            ],
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
