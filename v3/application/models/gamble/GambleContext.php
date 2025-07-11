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
    public $gameid;
    public $gambleid;
    public $groupid;
    public $userid;
    public $holes;
    public $firstHoleindex;
    public $lastHoleindex;
    public $scores;
    public $group_info;
    public $usefulHoles;
    public $bootStrapOrder;
    public $attenders;
    public $redBlueConfig;
    public $dutyConfig;
    public $ranking4TieResolveConfig;
    public $meat_pool = []; // 肉池管理

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
        'gameid' => 'getGameid',
        'gambleid' => 'getGambleid',
        'groupid' => 'getGroupid',
        'userid' => 'getUserid',
        'holes' => 'getHoles',
        'firstHoleindex' => 'getFirstHoleindex',
        'lastHoleindex' => 'getLastHoleindex',
        'scores' => 'getScores',
        'group_info' => 'getGroupInfo',
        'usefulHoles' => 'getUsefulHoles',
        'bootStrapOrder' => 'getBootStrapOrder',
        'attenders' => 'getAttenders',
        'redBlueConfig' => 'getRedBlueConfig',
        'dutyConfig' => 'getDutyConfig',
        'ranking4TieResolveConfig' => 'getRanking4TieResolveConfig',
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
