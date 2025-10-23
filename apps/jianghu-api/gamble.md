# 高尔夫赌球算法

> 我们要设计一个完备的高尔夫赌球算法,用于我们的微信小程序.
> 下面是对整个体系的抽象.
> 首先,赌球涉及到2方,blueTeam 和 redTeam 
> 根据打球的杆数,决定输赢,以及输赢的点数


## 对所有赌球规则的抽象

### 分组 Grouping ,blueTeam 与 redTeam
- 分组:blueTeam,redTeam,即红蓝两对,根据赌博的类型,可能有多种分组的方式,如 "1 vs 1" , "1 vs 2" , "1 vs 3", "2 vs 2".
  注意:除了"1 vs 1"方式,其他方式都有可能发生人员组合变化的情况,比如根据上一洞的score情况,决定下一洞的分组方式.
- 初次分组:bootStrapOrder,即比赛开始前强行指定的参数人员排名(一般根据技术水平排序)****


### 让杆机制, Stroking
- 为了游戏的平衡,可以设置让杆机制,即让一方获得一定的杆数优势,比如PAR3的洞不让,PAR4的洞让0.5等等.
- 由于可能存在让杆机制,所以每个选手的成绩有两个字段,realScore和strokingScore,realScore是实际成绩,strokingScore 是让杆后的成绩.
- 让杆可能改变,比如到了第8个洞停止让杆,或者增加让杆  

### 指标 Indicator
- 指标:indicator,即根据blueTeam和redTeam的让完的成绩(strokingScore),经过某种函数,计算出blueTeam和redTeam的indicator, 函数可能是:取最好成绩,取平均成绩,取杆数的算术和,杆数的乘法积,等等.
- 通过比较blueTeam和redTeam的indicator,来计算blueTeam和redTeam的输赢点数.
- 输赢点数的绝对值永远一样


### 输赢点数 Points
- 对双方Indicator的函数,计算出输赢点数


### 奖励机制,Reward
- 8421 或者 拉丝里面的配置

### 扣分规则
- 8421独有.
- 意思是 "杆数-成绩表的修正",即使配置了 杆数-成绩表,仍然可能不给负分.

### 惩罚机制 Punishment
> 分为包负分与包洞,先判断是否包,如果包,包多少
- 同伴顶头保负分:
   如果同伴最好成绩 等于或者超过对方,由另外一个人包洞,达到包分线/惩罚线.(此人的成绩差到+4,或者双PAR+1,杆差3洞)


### 平局的处理,Drawing/顶洞(相当于山羊那种角互相顶住,不分上下)
- 如果在某个洞,双方打平,称为Draw/顶洞.有可能发生多个洞连续"顶住"的情况,此时这个洞也被称为肉(Meat),相当于悬而未决的一个洞.
- 打平可能导致输赢点数翻倍,比如连续3个洞"顶住",第4个洞分出了胜负,则第4个洞的输赢点数是8倍,相当于所有的肉(Meat)都被赢家吃完  
- 打平可能导致输赢点数翻倍,单次翻倍,即只2倍,但是只消除第一个"顶洞",即吃一块肉(Meat) 
- 顶洞判断:输赢绝对值 x 分以内,则算平局,即顶洞
- 顶洞判断:输赢绝对值完全一样,则算平局,即顶洞

### Pot(锅),Donation(捐赠)
- 为了付球场费用,有可能规定赢家先把赚的钱捐到锅里面(Donation)



### 排序说明:

请选择排序规则
◎ 一律按得分值排序
◎ 一律按成绩排序
◎ 相同得分按输赢排序，出身看得分
◎ 相同得分按输赢排序，出身看输赢

### 最终结果

```


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
    
    ```