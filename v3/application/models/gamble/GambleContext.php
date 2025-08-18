<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

/**
 * 赌球上下文对象
 * 用于封装赌球计算过程中需要的共享数据，避免参数过多的问题
 */
class GambleContext extends CI_Model {
    public $gambleSysName;
    public $gambleUserName;
    public $gameid;
    public $gambleid;
    public $groupid;
    public $userid;
    public $holes;
    public $startHoleindex;
    public $scores;
    public $group_info;
    public $usefulHoles;
    public $bootStrapOrder;
    public $attenders;
    public $redBlueConfig;
    public $dutyConfig;
    public $ranking4TieResolveConfig;
    public $drawConfig;
    public $playerIndicatorConfig;
    public $badScoreBaseLine;
    public $badScoreMaxLost;
    public $eatingRange;
    public $stroking_config;
    public $meatValueConfig;
    public $meatMaxValue;
    public $holePlayList;
    public $kickConfig;
    public $donationCfg;
    public $bigWind;
    public $roadLength;
    public $kpis;
    public $RewardConfig;
    public $kpiBranches; // 添加 kpiBranches 属性


    public $meat_pool = []; // 肉池管理
    public $donation_pool = []; // 捐赠池管理


    public function __construct($data = []) {
        parent::__construct();
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
    }

    /**
     * 属性映射配置：定义 GambleContext 属性和 GamblePipeRunner getter 方法的对应关系
     */
    private static $propertyMapping = [
        'gambleSysName' => 'getGambleSysName',
        'gambleUserName' => 'getGambleUserName',
        'gameid' => 'getGameid',
        'gambleid' => 'getGambleid',
        'groupid' => 'getGroupid',
        'userid' => 'getUserid',
        'holes' => 'getHoles',
        'startHoleindex' => 'getStartHoleindex',
        'scores' => 'getScores',
        'group_info' => 'getGroupInfo',
        'usefulHoles' => 'getUsefulHoles',
        'bootStrapOrder' => 'getBootStrapOrder',
        'attenders' => 'getAttenders',
        'redBlueConfig' => 'getRedBlueConfig',
        'dutyConfig' => 'getDutyConfig',
        'ranking4TieResolveConfig' => 'getRanking4TieResolveConfig',
        'drawConfig' => 'getDrawConfig',
        'playerIndicatorConfig' => 'getPlayerIndicatorConfig',
        'badScoreBaseLine' => 'getDeductionConfig',
        'badScoreMaxLost' => 'getDeductionMaxValue',
        'eatingRange' => 'getEatingRange',
        'stroking_config' => 'getStrokingConfig',
        'meatValueConfig' => 'getMeatValueConfig',
        'meatMaxValue' => 'getMeatMaxValue',
        'holePlayList' => 'getHolePlayList',
        'kickConfig' => 'getKickConfig',
        'donationCfg' => 'getDonationCfg',
        'bigWind' => 'getBigWind',
        'roadLength' => 'getRoadLength',
        'kpis' => 'getKpis',
        'RewardConfig' => 'getRewardConfig',
    ];

    /**
     * 从 GamblePipeRunner 创建上下文对象
     * 只需要在 $propertyMapping 中添加新属性即可自动同步
     */
    public static function fromGamblePipeRunner($runner) {
        $data = [];

        foreach (self::$propertyMapping as $property => $getterMethod) {
            if (method_exists($runner, $getterMethod)) {
                $data[$property] = $runner->$getterMethod();
            }
        }

        return new self($data);
    }
}
