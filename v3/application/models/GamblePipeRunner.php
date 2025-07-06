<?php

declare(strict_types=1);
set_time_limit(0);


use League\Pipeline\StageInterface;


class GamblePipeRunner   extends CI_Model implements StageInterface {
    public  $payload = [];
    public  $config = [];

    // private 参数
    private $gameid;
    private $gambleid;
    private $groupid;
    private $userid;
    private $holes;
    private $players; //参与赌球的人员
    private $firstHolePlayersOrder; //出发顺序,即参与赌球的人员的初始排名,因为没有比赛成绩,所以要硬性规定下
    private $firstholeindex;   // 第一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $lastholeindex;    // 最后一个参与计算的洞的index,因为要支持从某个洞开始赌球
    private $scores;           // 记分
    private $group_info;       // 组信息,所有人
    private $attenders;  // 参与赌球的人员
    private $gamble_result;    // 一个赌球游戏的结果




    public function __invoke($cfg) {
        return $cfg;
    }


    public function StrokingScores() {
        $this->load->model('gamble/MRuntimeConfig');
        $stroking_config = $this->MRuntimeConfig->getStrokingConfig($this->gambleid, $this->userid);
        $this->load->model('gamble/MStroking');
        $this->scores = $this->MStroking->processStroking($this->scores, $stroking_config);
    }



    public function initGamble($config) {
        $this->config = $config;
        $this->gameid = $config['gameid'];
        $this->gambleid = $config['gambleid'];
        $this->groupid = $config['groupid'];
        $this->userid = $config['userid'];

        $this->firstholeindex = 1;
        $this->lastholeindex =  18;

        $this->holes =  $this->MGambleDataFactory->getGameHoles($this->gambleid);
        $this->scores = $this->MGambleDataFactory->getOneGambleHoleData($this->gameid, $this->groupid, $this->firstholeindex, $this->lastholeindex);
        $this->group_info = $this->MGambleDataFactory->m_get_group_info($this->gameid, $this->groupid);
        $this->players = [
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
        $this->attenders = [93, 160, 185, 2271];
        $this->firstHolePlayersOrder = [93, 160, 185, 2271];
    }





    public  function DoGetGambleResult() {
        $this->GambleArray = "GambleArray";
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
            'holes' => $this->holes,
            'firstholeindex' => $this->firstholeindex,
            'lastholeindex' => $this->lastholeindex,
            'scores' => $this->scores,
            'group_info' => $this->group_info,
            'attenders' => [93, 160, 185, 2271],
            'gamble_result' => $this->getGambleResultDemo(),
        ];
    }


    public function cleanup() {
        $this->GambleArray = [];
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
}
