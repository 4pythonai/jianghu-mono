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



    public function addGambleRule() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();


        try {
            // 获取必需参数
            $gamblesysname = $json_paras['gamblesysname'] ?? null;


            // 准备插入数据
            $insert_data = [
                'creator_id' => $userid,
                'gambleSysName' => $gamblesysname,
                'gambleUserName' => $json_paras['gambleUserName'] ?? $json_paras['user_rulename'] ?? null,
                'playersNumber' => $json_paras['playersNumber'] ?? 4,
                'sub8421_config_string' => $json_paras['sub8421_config_string'] ?? 'Par+4',
                'max8421_sub_value' => $json_paras['max8421_sub_value'] ?? 10000000,
                'draw8421_config' => $json_paras['draw8421_config'] ?? 'Diff_2',
                'eating_range' => isset($json_paras['eating_range']) ? json_encode($json_paras['eating_range'], JSON_UNESCAPED_UNICODE) : null,
                'meat_value_config_string' => $json_paras['meat_value_config_string'] ?? 'MEAT_AS_2',
                'meat_max_value' => $json_paras['meat_max_value'] ?? 1000000,
                'duty_config' => $json_paras['duty_config'] ?? 'DUTY_CODITIONAL'
            ];

            // 插入数据
            $this->db->insert('t_gamble_rule_user', $insert_data);
            $insert_id = $this->db->insert_id();

            if ($insert_id) {
                $ret = [];
                $ret['code'] = 200;
                $ret['message'] = '赌球规则创建成功';
                $ret['data'] = [
                    'rule_id' => $insert_id,
                    'userRuleId' => $insert_id,
                    'gambleSysName' => $gamblesysname,
                    'gambleUserName' => $json_paras['gambleUserName'] ?? $json_paras['user_rulename'] ?? null,
                    'playersNumber' => $json_paras['playersNumber'] ?? 4,
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

    /**
     * 根据参与人数分组获取赌球规则
     * 返回两人游戏、三人游戏、四人游戏的分组数据
     */
    public function getUserGambleRules() {
        $userid = $this->getUser();

        try {
            // 查询用户创建的所有赌球规则，只获取需要的字段
            $query = "SELECT id as userRuleId, gambleSysName, gambleUserName, playersNumber 
                     FROM t_gamble_rule_user 
                     WHERE creator_id = ? 
                     ORDER BY create_time DESC";

            $rules = $this->db->query($query, [$userid])->result_array();

            // 按人数分组
            $twoPlayers = [];
            $threePlayers = [];
            $fourPlayers = [];

            foreach ($rules as $rule) {
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
                    'overall' => count($rules)
                ]
            ];

            echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([
                'code' => 500,
                'message' => '服务器内部错误：' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    public function deleteGambleRule() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();
        $userRuleId = $json_paras['userRuleId'];
        $this->db->delete('t_gamble_rule_user', ['id' => $userRuleId, 'creator_id' => $userid]);
        echo json_encode(['code' => 200, 'message' => '删除成功'], JSON_UNESCAPED_UNICODE);
    }


    public function addRuntimeConfig() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $userid = $this->getUser();

        try {
            // 获取必需参数
            $gameid = $json_paras['gameid'] ?? null;
            $userRuleId = $json_paras['userRuleId'] ?? null;

            if (!$gameid || !$userRuleId) {
                echo json_encode([
                    'code' => 400,
                    'message' => '缺少必要参数：gameid和userRuleId'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // 准备插入数据
            $insert_data = [
                'creator_id' => $userid,
                'firstHoleindex' => intval($json_paras['firstHoleindex']),
                'lastHoleindex' => intval($json_paras['lastHoleindex']),
                'gameid' => $gameid,
                'groupid' => $json_paras['groupid'] ?? 1,
                'val8421_config' => isset($json_paras['val8421_config']) ? json_encode($json_paras['val8421_config'], JSON_UNESCAPED_UNICODE) : null,
                'userRuleId' => $userRuleId,
                'gambleSysName' => $json_paras['gambleSysName'] ?? null,
                'gambleUserName' => $json_paras['gambleUserName'] ?? null,
                'playersNumber' => $json_paras['playersNumber'] ?? 4,
                'red_blue_config' => $json_paras['red_blue_config'] ?? null,
                'all_players' => isset($json_paras['all_players']) ? json_encode($json_paras['all_players'], JSON_UNESCAPED_UNICODE) : null,
                'bootstrap_order' => isset($json_paras['bootstrap_order']) ? json_encode($json_paras['bootstrap_order'], JSON_UNESCAPED_UNICODE) : null,
                'attenders' =>   isset($json_paras['bootstrap_order']) ? json_encode($json_paras['bootstrap_order'], JSON_UNESCAPED_UNICODE) : null,
                'ranking_tie_resolve_config' => $json_paras['ranking_tie_resolve_config'] ?? 'score.win_loss.reverse_score'
            ];

            // 插入数据
            $this->db->insert('t_gamble_runtime', $insert_data);
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

    public function listRuntimeConfig() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameid = $json_paras['gameid'];
        $this->db->select('*');
        $this->db->from('t_gamble_runtime');
        $this->db->where('gameid', $gameid);
        $gambles = $this->db->get()->result_array();
        foreach ($gambles as &$gamble) {
            $gamble['attenders'] = $this->setGambleAttenders($gamble);
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
        $gamble['all_players'] = $attenders_info;
        return $gamble;
    }
}
