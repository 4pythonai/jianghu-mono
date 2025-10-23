<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Gamble extends MY_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }



    public function addRuntimeConfig() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();

        $startHoleindex = $json_paras['startHoleindex'];

        try {
            // 获取必需参数
            $gameid = $json_paras['gameid'] ?? null;
            $groupid = $json_paras['groupid'] ?? 1;
            $userRuleId = $json_paras['userRuleId'] ?? null;

            if (!$gameid || !$userRuleId) {
                echo json_encode([
                    'code' => 400,
                    'message' => '缺少必要参数: gameid or  userRuleId'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }


            if (isset($json_paras['stroking_config']) && !empty($json_paras['stroking_config'])) {
                $stroking_config = json_encode($json_paras['stroking_config'], JSON_UNESCAPED_UNICODE);
            } else {
                $stroking_config = null;
            }


            $this->load->model('MAbstract');
            $abstract = $this->MAbstract->createAbstract($json_paras['gambleSysName'], $json_paras['red_blue_config']);
            $insert_data = [
                'creator_id' => $userid,
                'gameid' => $gameid,
                'abstract' => $abstract,
                'groupid' => $groupid,
                'playerIndicatorConfig' => isset($json_paras['playerIndicatorConfig']) ? json_encode($json_paras['playerIndicatorConfig'], JSON_UNESCAPED_UNICODE) : null,
                'userRuleId' => $userRuleId,
                'gambleSysName' => $json_paras['gambleSysName'] ?? null,
                'gambleUserName' => $json_paras['gambleUserName'] ?? null,
                'playersNumber' => $json_paras['playersNumber'] ?? 4,
                'red_blue_config' => $json_paras['red_blue_config'] ?? null,
                'bootstrap_order' => isset($json_paras['bootstrap_order']) ? json_encode($json_paras['bootstrap_order'], JSON_UNESCAPED_UNICODE) : null,
                'attenders' =>   isset($json_paras['bootstrap_order']) ? json_encode($json_paras['bootstrap_order'], JSON_UNESCAPED_UNICODE) : null,
                'ranking_tie_resolve_config' => $json_paras['ranking_tie_resolve_config'] ?? 'score.win_loss.reverse_score',
                'startHoleindex' => $startHoleindex,
                'roadLength' => $json_paras['roadLength'],
                'stroking_config' => $stroking_config
            ];

            // 插入数据

            $this->db->insert('t_gamble_x_runtime', $insert_data);
            $insert_id = $this->db->insert_id();



            if ($insert_id) {
                $ret = [];
                $ret['code'] = 200;
                $ret['message'] = '运行时配置创建成功';
                echo json_encode($ret, JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode([
                    'code' => 500,
                    'message' => '数据库插入失败'
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误：' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    public function updateRuntimeConfig() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        unset($json_paras['holeList']);

        // stroking_config
        if (isset($json_paras['stroking_config']) && is_array($json_paras['stroking_config'])) {
            $stroking_config = json_encode($json_paras['stroking_config'], JSON_UNESCAPED_UNICODE);
        } else {
            $stroking_config = $json_paras['stroking_config'] ?? null;
        }

        if (isset($json_paras['bootstrap_order']) && is_array($json_paras['bootstrap_order'])) {
            $bootstrap_order = '[' . implode(',', $json_paras['bootstrap_order']) . ']';
        } else {
            $bootstrap_order = $json_paras['bootstrap_order'] ?? null;
        }

        $json_paras['bootstrap_order'] = $bootstrap_order;
        if (isset($json_paras['playerIndicatorConfig']) && is_array($json_paras['playerIndicatorConfig'])) {
            $playerIndicatorConfig = json_encode($json_paras['playerIndicatorConfig'], JSON_UNESCAPED_UNICODE);
        } else {
            $playerIndicatorConfig = $json_paras['playerIndicatorConfig'] ?? null;
        }
        $json_paras['playerIndicatorConfig'] = $playerIndicatorConfig;


        $startHoleindex = $json_paras['startHoleindex'];
        $roadLength = intval($json_paras['roadLength']);


        $json_paras['bootstrap_order'] = $bootstrap_order;


        $json_paras['creator_id'] = $userid;
        unset($json_paras['rangeHolePlayList']);

        // 准备更新数据
        $update_data = [
            'gameid' => $json_paras['gameid'],
            'groupid' => $json_paras['groupid'],
            'userRuleId' => $json_paras['userRuleId'],
            'gambleSysName' => $json_paras['gambleSysName'],
            'gambleUserName' => $json_paras['gambleUserName'],
            'red_blue_config' => $json_paras['red_blue_config'],
            'bootstrap_order' => $json_paras['bootstrap_order'],
            'ranking_tie_resolve_config' => $json_paras['ranking_tie_resolve_config'],
            'playerIndicatorConfig' => $json_paras['playerIndicatorConfig'],
            'startHoleindex' => $startHoleindex,
            'roadLength' => $roadLength,
            'stroking_config' => $stroking_config,
            'creator_id' => $json_paras['creator_id']
        ];


        // 更新数据库
        $this->db->where('id', $json_paras['id']);
        $result = $this->db->update('t_gamble_x_runtime', $update_data);

        if ($result) {
            $ret = [];
            $ret['code'] = 200;
            $ret['message'] = '运行时配置更新成功';
            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'code' => 500,
                'message' => '数据库更新失败'
            ], JSON_UNESCAPED_UNICODE);
        }
    }


    public function addGambleRule() {

        $this->load->model('sysrule/G4P8421Parser');
        $this->load->model('sysrule/G4PlasiParser');
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $config = $json_paras;


        $userid = $this->getUser();

        $gambleSysName = $json_paras['gambleSysName'];
        if ($gambleSysName == '4p-8421') {
            $insert_data = $this->G4P8421Parser->parserRawData($userid, $config);
        }

        if ($gambleSysName == '4p-lasi') {
            $insert_data = $this->G4PlasiParser->parserRawData($userid, $config);
        }


        try {

            // 插入数据
            $this->db->insert('t_gamble_rules_user', $insert_data);
            $insert_id = $this->db->insert_id();

            if ($insert_id) {
                $ret = [];
                $ret['code'] = 200;
                $ret['message'] = '赌球规则创建成功';
                $ret['data'] = [
                    'rule_id' => $insert_id,
                    'userRuleId' => $insert_id,
                    'gambleSysName' => $gambleSysName,
                    'gambleUserName' => $json_paras['gambleUserName'] ?? $json_paras['user_rulename'] ?? null,
                    'creator_id' => $userid
                ];

                echo json_encode($ret, JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode([
                    'code' => 500,
                    'message' => '数据库插入失败'
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误：' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    public function updateGambleRule() {

        $this->load->model('sysrule/G4P8421Parser');
        $this->load->model('sysrule/G4PlasiParser');
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $id = $json_paras['id'];
        $config = $json_paras;


        $userid = $this->getUser();

        $gambleSysName = $json_paras['gambleSysName'];
        if ($gambleSysName == '4p-8421') {
            $udpate_data = $this->G4P8421Parser->parserRawData($userid, $config);
        }

        if ($gambleSysName == '4p-lasi') {
            $udpate_data = $this->G4PlasiParser->parserRawData($userid, $config);
        }




        // 插入数据
        $this->db->where('id', $id)->update('t_gamble_rules_user', $udpate_data);

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '修改规则成功';
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }


    /**
     * 根据参与人数分组获取赌球规则
     * 返回两人游戏、三人游戏、四人游戏的分组数据
     */
    public function getUserGambleRules() {
        $userid = $this->getUser();
        $query = "SELECT id as userRuleId, 
                     create_time,
                     kpis,
                     RewardConfig,
                     drawConfig,
                     dutyConfig,
                     eatingRange,
                     gambleSysName,
                     gambleUserName,
                     badScoreMaxLost,
                     CAST(meatMaxValue AS UNSIGNED) as meatMaxValue,
                     PartnerDutyCondition,
                     meatValueConfig,
                     badScoreBaseLine,
                     playersNumber,
                     CAST(badScoreMaxLost AS SIGNED) as badScoreMaxLost,
                     update_time
                     FROM t_gamble_rules_user 
                     WHERE creator_id = ? and softdeleted='n'
                     ORDER BY create_time DESC";

        $rules = $this->db->query($query, [$userid])->result_array();

        // 添加调试信息
        logtext("getUserGambleRules - User ID: " . $userid);
        logtext("getUserGambleRules - Raw rules count: " . count($rules));
        foreach ($rules as $index => $rule) {
            logtext("getUserGambleRules - Rule " . $index . " ID: " . $rule['userRuleId'] . ", Name: " . $rule['gambleUserName']);
        }

        // 修复：使用新的数组而不是引用，避免数据污染
        $processedRules = [];
        foreach ($rules as $rule) {
            $processedRule = $rule; // 创建副本

            if (!empty($processedRule['kpis'])) {
                $processedRule['kpis'] = json_decode($processedRule['kpis'], true);
            }

            if (!empty($processedRule['eatingRange'])) {
                $processedRule['eatingRange'] = json_decode($processedRule['eatingRange'], true);
            }

            if (!empty($processedRule['RewardConfig'])) {
                $processedRule['RewardConfig'] = json_decode($processedRule['RewardConfig'], true);
            }

            // 转换整数型字段
            if (isset($processedRule['meatMaxValue'])) {
                $processedRule['meatMaxValue'] = (int)$processedRule['meatMaxValue'];
            }
            if (isset($processedRule['badScoreMaxLost'])) {
                $processedRule['badScoreMaxLost'] = (int)$processedRule['badScoreMaxLost'];
            }
            if (isset($processedRule['playersNumber'])) {
                $processedRule['playersNumber'] = (int)$processedRule['playersNumber'];
            }

            $processedRules[] = $processedRule;
        }

        // 按人数分组
        $twoPlayers = [];
        $threePlayers = [];
        $fourPlayers = [];

        foreach ($processedRules as $rule) {
            switch ($rule['playersNumber']) {
                case 2:
                    $twoPlayers[] = $rule;
                    break;
                case 3:
                    $threePlayers[] = $rule;
                    break;
                case 4:
                    $fourPlayers[] = $rule;
                    break;
            }
        }

        // 添加分组后的调试信息
        logtext("getUserGambleRules - Two players count: " . count($twoPlayers));
        logtext("getUserGambleRules - Three players count: " . count($threePlayers));
        logtext("getUserGambleRules - Four players count: " . count($fourPlayers));

        foreach ($fourPlayers as $index => $rule) {
            logtext("getUserGambleRules - Four players rule " . $index . " ID: " . $rule['userRuleId'] . ", Name: " . $rule['gambleUserName']);
        }

        // 构建返回数据
        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '获取成功';
        $ret['userRules'] = [
            'user_id' => $userid,
            'twoPlayers' => $twoPlayers,
            'threePlayers' => $threePlayers,
            'fourPlayers' => $fourPlayers,
            'total' => [
                'twoPlayers' => count($twoPlayers),
                'threePlayers' => count($threePlayers),
                'fourPlayers' => count($fourPlayers),
                'overall' => count($processedRules)
            ]
        ];

        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }






    /**
     * 根据参与人数分组获取赌球规则
     * 返回两人游戏、三人游戏、四人游戏的分组数据
     */
    public function getUserGambleRule() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $ruleId = $json_paras['ruleId'];



        // 查询用户创建的所有赌球规则，只获取需要的字段
        $query = "SELECT id as userRuleId, 
                     create_time,
                     RewardConfig,
                     kpis,
                     drawConfig,
                     dutyConfig,
                     eatingRange,
                     gambleSysName,
                     gambleUserName,
                     badScoreMaxLost,
                     meatMaxValue,
                     meatValueConfig,
                     playersNumber,
                     badScoreBaseLine,
                     update_time
                     FROM t_gamble_rules_user 
                     WHERE id = ? and softdeleted='n'
                     ORDER BY create_time DESC";

        $rule = $this->db->query($query, [$ruleId])->row_array();

        // 构建返回数据
        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '获取成功';
        $ret['data'] = $rule;
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }


    public function deleteGambleRule() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $userRuleId = $json_paras['userRuleId'];
        // using softdelete to  'y' 
        $this->db->where('id', $userRuleId)->update('t_gamble_rules_user', ['softdeleted' => 'y']);
        // $this->db->delete('t_gamble_rules_user', ['id' => $userRuleId, 'creator_id' => $userid]);
        echo json_encode(['code' => 200, 'message' => '删除成功'], JSON_UNESCAPED_UNICODE);
    }




    public function listRuntimeConfig() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $groupid = $json_paras['groupid'];
        $this->db->select('*');
        $this->db->from('t_gamble_x_runtime');
        $this->db->where('groupid', $groupid);
        $gambles = $this->db->get()->result_array();
        foreach ($gambles as &$gamble) {
            $stroking_config = json_decode($gamble['stroking_config'], true);
            $gamble['stroking_config'] = is_array($stroking_config) ? $stroking_config : [];
            $gamble['attenders'] = $this->setGambleAttenders($gamble);
            $gamble['holePlayListStr'] =  $gamble['holePlayList'];
            unset($gamble['holePlayList']);
            $userRuleId = $gamble['userRuleId'];
            $specRow = $this->db->where('id', $userRuleId)->get('t_gamble_rules_user')->row_array();
            $gamble['spec'] = $specRow;
        }


        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '获取成功';
        $ret['gambles'] = $gambles;
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    private function setGambleAttenders($gamble) {
        $attenders = json_decode($gamble['attenders'], true);
        $attenders_info = [];
        foreach ($attenders as $attender) {
            $attender_info = $this->MUser->getPlayerInfo($attender);
            $attenders_info[] = $attender_info;
        }
        return $attenders_info;
    }





    public function deleteRuntimeConfig() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $id = $json_paras['id'];
        $this->db->delete('t_gamble_x_runtime', ['id' => $id]);
        echo json_encode(['code' => 200, 'message' => '删除成功'], JSON_UNESCAPED_UNICODE);
    }

    public function updateKickOffMultiplier() {


        $json_paras = json_decode(file_get_contents('php://input'), true);
        $id = $json_paras['configId'];
        $kickConfig = $json_paras['multipliers'];
        $this->db->where('id', $id)->update('t_gamble_x_runtime', ['kickConfig' => json_encode($kickConfig, JSON_UNESCAPED_UNICODE)]);
        echo json_encode(['code' => 200, 'message' => '更新成功'], JSON_UNESCAPED_UNICODE);
    }


    public function updateDonation() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        // debug($json_paras);
        // 获取参数
        $allRuntimeIDs = $json_paras['allRuntimeIDs'] ?? [];
        $selectedIds = $json_paras['selectedIds'] ?? [];
        $donationType = $json_paras['donationType'] ?? '';

        // 第一步：清空所有 allRuntimeIDs 对应的 donationCfg 字段
        if (!empty($allRuntimeIDs)) {
            $this->db->where_in('id', $allRuntimeIDs);

            $donationCfg = json_encode([
                'donationType' => 'none',
            ], JSON_UNESCAPED_UNICODE);


            $this->db->update('t_gamble_x_runtime', ['donationCfg' => $donationCfg]);
        }

        // 第二步：根据 donationType 构建 donationCfg 配置
        $donationCfg = [];

        switch ($donationType) {
            case 'bigpot':
                $donationCfg = [
                    'donationType' => 'bigpot',
                    'totalFee' => $json_paras['totalFee'] ?? 0
                ];
                break;

            case 'normal':
                $donationCfg = [
                    'donationType' => 'normal',
                    'donationPoints' => $json_paras['donationPoints'] ?? 0,
                    'maxDonationPoints' => $json_paras['maxDonationPoints'] ?? 0
                ];
                break;

            case 'all':
                $donationCfg = [
                    'donationType' => 'all',
                    'maxDonationPoints' => $json_paras['maxDonationPoints'] ?? 0
                ];
                break;

            case "none":
                $donationCfg = [
                    'donationType' => 'none',
                ];
                break;

            default:
                echo json_encode([
                    'code' => 400,
                    'message' => '无效的 donationType'
                ], JSON_UNESCAPED_UNICODE);
                return;
        }

        // 第三步：更新 selectedIds 对应的 donationCfg 字段
        if (!empty($selectedIds)) {
            $this->db->where_in('id', $selectedIds);
            $this->db->update('t_gamble_x_runtime', [
                'donationCfg' => json_encode($donationCfg, JSON_UNESCAPED_UNICODE)
            ]);
        }

        $ret = [];
        $ret['code'] = 200;
        $ret['message'] = '捐赠配置更新成功';
        $ret['data'] = [
            'clearedCount' => count($allRuntimeIDs),
            'updatedCount' => count($selectedIds),
            'donationCfg' => $donationCfg
        ];

        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    public function setGambleVisible() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $allRuntimeIDs = $json_paras['allRuntimeIDs'] ?? [];
        $ifShow = $json_paras['ifShow'];
        $this->db->where_in('id', $allRuntimeIDs)->update('t_gamble_x_runtime', ['ifShow' => $ifShow]);
        echo json_encode(['code' => 200, 'message' => '更新成功'], JSON_UNESCAPED_UNICODE);
    }


    public function updateBigWind() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $allRuntimeIDs = $json_paras['allRuntimeIDs'] ?? [];
        $bigWind = $json_paras['bigWind'];
        $this->db->where_in('id', $allRuntimeIDs)->update('t_gamble_x_runtime', ['bigWind' => $bigWind]);
        echo json_encode(['code' => 200, 'message' => '更新成功'], JSON_UNESCAPED_UNICODE);
    }


    public function changeStartHole() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        // debug($json_paras);
        $gameid = $json_paras['gameid'];
        $holeList = $json_paras['holeList'];
        $this->db->where('id', $gameid)->update('t_game', ['holeList' => json_encode($holeList, JSON_UNESCAPED_UNICODE)]);
        echo json_encode(['code' => 200, 'message' => '更新成功'], JSON_UNESCAPED_UNICODE);
    }
}
