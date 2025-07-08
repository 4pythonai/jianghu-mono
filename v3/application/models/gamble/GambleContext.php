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
    public $usefulHoles;
    public $bootStrapOrder;
    public $attenders;
    public $redBlueConfig;
    public $dutyConfig;

    public function __construct($data = []) {
        parent::__construct();
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
    }

    /**
     * 从 GamblePipeRunner 创建上下文对象
     */
    public static function fromGamblePipeRunner($runner) {
        return new self([
            'gambleSysName' => $runner->getGambleSysName(),
            'gameid' => $runner->getGameid(),
            'gambleid' => $runner->getGambleid(),
            'groupid' => $runner->getGroupid(),
            'userid' => $runner->getUserid(),
            'usefulHoles' => $runner->getUsefulHoles(),
            'bootStrapOrder' => $runner->getBootStrapOrder(),
            'attenders' => $runner->getAttenders(),
            'redBlueConfig' => $runner->getRedBlueConfig(),
            'dutyConfig' => $runner->getDutyConfig(),
        ]);
    }
}
