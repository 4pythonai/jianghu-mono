<?php

declare(strict_types=1);
set_time_limit(0);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}




class Audit extends CI_Controller {
    public function __construct() {

        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
        $this->load->model('GamblePipe');
        $this->load->model('GamblePipeRunner');
        $this->load->model('gamble/MGambleDataFactory');
        $this->load->model('gamble/MRuntimeConfig');
        $this->load->model('gamble/MStroking');
        $this->load->model('gamble/MIndicator');
        $this->load->model('gamble/MRedBlue');
        $this->load->model('gamble/MMoney');
        $this->load->model('gamble/MRanking');
        $this->load->model('gamble/GambleContext');
        $this->load->model('gamble/MRanking');
        $this->load->model('gamble/GambleContext');
        $this->load->model('gamble/MMeat');
        $this->load->model('gamble/MDonation');
    }

    public function printResult($result) {
        $this->load->view('gamble/VGambleResut', $result);
    }


    public function index() {
        $userAgent = $_SERVER['HTTP_USER_AGENT'];
        if (strpos($userAgent, 'miniProgram') !== false) {
            $debugMode = false; // 小程序
        } else {
            $debugMode = true; // 浏览器
        }

        $paras = $_GET;
        $gambleid = $paras['gambleid'];

        $final_result = $this->getGambleResult($gambleid, $debugMode);
        $this->printResult($final_result);
    }


    public function getGambleSummary() {
        $debugMode = false; // 小程序
        $paras = json_decode(file_get_contents('php://input'), true);



        $groupid = $paras['groupid'];
        $gambles = $this->db->get_where('t_gamble_x_runtime', ['groupid' => $groupid])->result_array();

        $g_results = [];
        foreach ($gambles as $gamble) {
            $gambleid = $gamble['id'];
            $complex = $this->getGambleResult($gambleid, $debugMode);
            $simple = [];
            $simple['gambleUserName'] = $complex['gambleUserName'];
            $simple['gambleSysName'] = $complex['gambleSysName'];
            $simple['useful_holes'] = $complex['useful_holes'];
            $simple['group_info'] = $complex['group_info'];
            $simple['qrcode_url'] = $complex['qrcode_url'];
            $simple['detail_url'] = $complex['detail_url'];
            $g_results[] = $simple;
        }


        $ret = [];
        $ret['code'] = 200;
        $ret['SummaryResult'] = $this->subTotal($g_results);
        $ret['gambleResults'] = $g_results;
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }


    private function subTotal($group_results) {
        // 如果 group_results 长度为0，返回 null
        if (empty($group_results)) {
            return null;
        }

        // 第一步：生成 group_info，来源于第一个项的 group_info
        $rebObj = [
            'group_info' => $group_results[0]['group_info'],
            'useful_holes' => []
        ];

        // 第二步：收集所有的 useful_holes，去重并按 hindex 排序
        $all_holes = [];
        foreach ($group_results as $result) {
            if (isset($result['useful_holes']) && is_array($result['useful_holes'])) {
                foreach ($result['useful_holes'] as $hole) {
                    $hindex = $hole['hindex'];
                    $tmphole = [];
                    $tmphole['hindex'] = $hole['hindex'];
                    $tmphole['par'] = $hole['par'];
                    $tmphole['holename'] = $hole['holename'];
                    $all_holes[$hindex] = $tmphole;
                }
            }
        }

        // 按 hindex 排序
        ksort($all_holes);

        // 第三步：为每个洞生成正确的 players_detail 结构
        foreach ($all_holes as $hindex => $hole) {
            // 为每个用户初始化 players_detail
            $players_detail = [];
            foreach ($rebObj['group_info'] as $player) {
                $players_detail[] = [
                    'userid' => $player['userid'],
                    'final_points' => 0,
                    'pointsDonated' => 0
                ];
            }

            // 添加到结果中
            $hole_data = $hole;
            $hole_data['players_detail'] = $players_detail;
            $rebObj['useful_holes'][] = $hole_data;
        }

        // 从这开始,汇总
        foreach ($rebObj['useful_holes'] as &$hole) {
            $hindex = $hole['hindex'];

            // 遍历所有赌球结果，汇总该洞的数据
            foreach ($group_results as $result) {
                if (!isset($result['useful_holes']) || !is_array($result['useful_holes'])) {
                    continue;
                }

                // 找到对应的洞
                foreach ($result['useful_holes'] as $result_hole) {
                    if ($result_hole['hindex'] == $hindex) {
                        // 处理 winner_detail
                        if (isset($result_hole['winner_detail']) && is_array($result_hole['winner_detail'])) {
                            foreach ($result_hole['winner_detail'] as $winner) {
                                $userid = $winner['userid'];
                                // 找到对应的玩家并累加分数
                                foreach ($hole['players_detail'] as &$player) {
                                    if ($player['userid'] == $userid) {
                                        $player['final_points'] += isset($winner['final_points']) ? $winner['final_points'] : 0;
                                        $player['pointsDonated'] += isset($winner['pointsDonated']) ? $winner['pointsDonated'] : 0;
                                        break;
                                    }
                                }
                            }
                        }

                        // 处理 failer_detail
                        if (isset($result_hole['failer_detail']) && is_array($result_hole['failer_detail'])) {
                            foreach ($result_hole['failer_detail'] as $failer) {
                                $userid = $failer['userid'];
                                // 找到对应的玩家并累加分数
                                foreach ($hole['players_detail'] as &$player) {
                                    if ($player['userid'] == $userid) {
                                        $player['final_points'] += isset($failer['final_points']) ? $failer['final_points'] : 0;
                                        $player['pointsDonated'] += isset($failer['pointsDonated']) ? $failer['pointsDonated'] : 0;
                                        break;
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }

        return $rebObj;
    }

    /**
     * 获取单个赌博结果
     * @param int $gambleid 赌博ID
     * @param bool $debugMode 是否开启调试模式
     * @return array 赌博结果
     */
    private function getGambleResult($gambleid, $debugMode = false) {
        $row = $this->db->get_where('t_gamble_x_runtime', ['id' => $gambleid])->row_array();

        $cfg = [
            'gambleSysName' => $row['gambleSysName'],
            'gambleUserName' => $row['gambleUserName'],
            'userRuleId' => $row['userRuleId'],
            'gameid' => $row['gameid'],
            'gambleid' => $gambleid,
            'groupid' => $row['groupid'],
            'userid' => $row['creator_id']
        ];

        $web_url = config_item('web_url');
        $detail_url = "{$web_url}/v3/index.php/Audit/index?gambleid={$gambleid}";

        // 生成二维码图片
        $qrcode_url = generate_qrcode($detail_url, "gamble_result_{$gambleid}.png");
        $final_result = $this->GamblePipe->GetGambleResult($cfg);
        if ($debugMode) {
            debug($final_result);
        }

        $final_result['qrcode_url'] = $qrcode_url;
        $final_result['detail_url'] = $detail_url;
        return $final_result;
    }


    public function getSingleGambleResult() {

        $debugMode = false; // 小程序
        $paras = json_decode(file_get_contents('php://input'), true);
        $gambleid = $paras['gambleid'];
        $result = $this->getGambleResult($gambleid, $debugMode);

        $ret = [];
        $ret['code'] = 200;
        $ret['gambleResult'] = $result;
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }
}
