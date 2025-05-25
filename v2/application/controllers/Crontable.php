<?php

/***
 * 
 * 
 * 
 *  检查 一个 linkid 属于多个 二代
 * 
 * 
 *       
            SELECT 
                a.linkid,
                GROUP_CONCAT(DISTINCT a.tierid) as tierids,
                COUNT(DISTINCT a.tierid) as tier_count
            FROM 
                tier2_cust_linkid a
            GROUP BY 
                a.linkid
            HAVING 
                COUNT(DISTINCT a.tierid) > 1
            ORDER BY 
                tier_count DESC;
 * 
 * 以下payerid 不参与检查(因为这些payerid 属于多个二代)
 * 
 * '408280744142',
 * '466359625393',
 * '713212641044',
 * '551894331156',
 * '552642948131',
 * '496406325676',
 * '809115248586',
 * '181792686765',
 * '768785564164',
 * '827601820786'

 * 
 */





declare(strict_types=1);
require_once APPPATH . 'third_party/aws/aws-autoloader.php';


if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class Crontable extends CI_Controller {
    public function __construct() {

        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
    }

    public function save_and_check() {


        logtext("每日link检查开始" . date('Y-m-d H:i:s', time()));
        $this->load->model('MCrontable');

        // 首先清理数据
        $this->MCrontable->cleaTodayData();

        $this->MCrontable->saveTodayPayersSnapshot();

        $this->compare();

        $now = date('Y-m-d H:i:s', time());
        logtext("检查完毕" . $now);
    }


    public function compare() {

        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));


        // Get today's and yesterday's data
        $today_data = $this->db->where('date', $today)->get('daily_org_info')->result_array();
        $yesterday_data = $this->db->where('date', $yesterday)->get('daily_org_info')->result_array();
        if (count($yesterday_data) == 0) {
            //前一天没有数据,则退出,可能前一天crontab 未执行
            return;
        }

        // Create maps for easier comparison
        $today_map = array_column($today_data, null, 'linkid');
        $yesterday_map = array_column($yesterday_data, null, 'linkid');


        $this->DoAddNewCheck($today, $today_map, $yesterday_map);
        $this->DoRemoveCheck($today, $today_map, $yesterday_map);
        $this->DoModifyCheck($today, $today_map, $yesterday_map);
    }

    public function DoAddNewCheck($today, $today_map, $yesterday_map) {

        foreach ($today_map as $linkid => $today_record) {
            if (!isset($yesterday_map[$linkid])) {
                // New record added
                $this->processNewAddLink($today, $today_record);
            }
        }
    }

    public function DoRemoveCheck($today, $today_map, $yesterday_map) {
        foreach ($yesterday_map as $linkid => $yesterday_record) {
            if (!isset($today_map[$linkid])) {
                // Record removed
                $this->processRemovedLink($today, $yesterday_record);
            }
        }
    }

    public function DoModifyCheck($today, $today_map, $yesterday_map) {
        foreach ($today_map as $linkid => $today_record) {
            if (isset($yesterday_map[$linkid])) {
                $yesterday_record = $yesterday_map[$linkid];
                foreach ($today_record as $field => $value) {
                    if ($field != 'id' && $field != 'date' && $field != 'adddate' && $value != $yesterday_record[$field]) {
                        $this->processChanged($today, $today_record, $field, $yesterday_record[$field], $value);
                    }
                }
            }
        }
    }


    public function processNewAddLink($today, $item) {


        // 检查记录是否存在
        $this->db->where('tierid', $item['tierid']);
        $this->db->where('payerid', $item['payerid']);
        $this->db->where('linkid', $item['linkid']);
        $query = $this->db->get('tier2_cust_linkid');

        if ($query->num_rows() == 0) {
            // 记录不存在，插入新记录

            $region = $this->MCloudLevel->getRegion($item['payerid']);

            if (substr($region, 0, 3) === "cn-") {
                $region_tag = '国内';
            } else {
                $region_tag = '海外';
            }

            $data = array(
                'tierid' => $item['tierid'],
                'payerid' => $item['payerid'],
                'linkid' => $item['linkid'],
                'status' => $item['status'],
                'linkname' => $item['name'],
                'firstlinkdate' => $item['created_timestamp'],
                'region_tag' => $region_tag,
                'premonthUsageBigThen50k' => 'n',
                'pre6monthUsageSmallThen1K' => 'n',
                'usageLessThen5KBeforeCloseChance' => 'y',
                'ifCEI' => 'N',
                'ifShareShift' => 'n',
                'ifGreenfield' => 'n',
                'ifIncrease' => 'n',
                'bossadddate' => date('Y-m-d H:i:s', time()),
                'author' => $this->MCloudLevel->getAuthorByTierid($item['tierid'])
            );

            $this->db->insert('tier2_cust_linkid', $data);
        } else {
            // 记录已存在
            logtext("处理新增,但是数据库已经存在link?,link=" . $item['linkid']);
        }


        $diff = [
            'date' => $today,
            'tierid' => $item['tierid'],
            'payerid' => $item['payerid'],
            'linkid' => $item['linkid'],
            'change_type' => '新增LINK',
            'adddate'   => date('Y-m-d H:i:s', time())

        ];
        $this->db->insert('org_differences', $diff);
    }


    private function  processRemovedLink($today, $item) {
        debug("删除的");
        debug($item);

        $this->db->where('tierid', $item['tierid']);
        $this->db->where('payerid', $item['payerid']);
        $this->db->where('linkid', $item['linkid']);
        $query = $this->db->get('tier2_cust_linkid');

        if ($query->num_rows() == 0) {
            logtext("处理删除,但是数据库不存在link?,tier/payer/link=" . $item['tierid'] . "/" . $item['payerid'] . "/" . $item['linkid']);
        } else {

            // 记录存在,修改状态
            $where = ['tierid' => $item['tierid'], 'payerid' => $item['payerid'], 'linkid' => $item['linkid']];
            $this->db->where($where);
            // 解绑日期为当时 解绑日期
            $updateData = ['disconnectDate' => date('Y-m-d H:i:s', time()), 'status' => 'CRON_DEACTIVE'];
            $this->db->update('tier2_cust_linkid', $updateData);
            // return FALSE;
        }

        $diff = [
            'date' => $today,
            'tierid' => $item['tierid'],
            'payerid' => $item['payerid'],
            'linkid' => $item['linkid'],
            'change_type' => '移除的数据',
            'adddate'   => date('Y-m-d H:i:s', time())

        ];
        $this->db->insert('org_differences', $diff);
    }

    private function  processChanged($today, $item, $field, $old, $new) {

        if ($field == 'status') {
            $this->statusChangeHandler($today, $item, $field, $old, $new);
        }


        if ($field == 'name') {
            $this->linknameChangeHandler($today, $item, $field, $old, $new);
        }

        // payer 跳槽
        if ($field == 'payerid') {
            $this->payeridChangeHandler($today, $item, $field, $old, $new);
        }
    }




    private function statusChangeHandler($today, $item, $field, $old, $new) {
        $this->db->where('tierid', $item['tierid']);
        $this->db->where('payerid', $item['payerid']);
        $this->db->where('linkid', $item['linkid']);
        $query = $this->db->get('tier2_cust_linkid');

        if ($query->num_rows() == 0) {
            logtext("处理字段变化,但是数据库不存在link?,tier/payer/link=" . $item['tierid'] . "/" . $item['payerid'] . "/" . $item['linkid']);

            $diff = [
                'date' => $today,
                'tierid' => $item['tierid'],
                'payerid' => $item['payerid'],
                'linkid' => $item['linkid'],
                'change_type' => '异常:字段变化',
                'field_name' => $field,
                'old_value' => $old,
                'new_value' => $new,
                'adddate'   => date('Y-m-d H:i:s', time()),
                'memo' => 'statusChangeHandler:' . "处理字段变化,但是数据库不存在link?,tier/payer/link=" . $item['tierid'] . "/" . $item['payerid'] . "/" . $item['linkid']
            ];

            $this->db->insert('org_differences', $diff);
        } else {

            $where = ['tierid' => $item['tierid'], 'payerid' => $item['payerid'], 'linkid' => $item['linkid']];
            $this->db->where($where);
            $updateData = ['status' => $new];

            // 从激活变 暂停,设置暂停日期
            if ($old == 'ACTIVE' && $new == 'SUSPENDED') {
                $updateData['suspenddate'] = date('Y-m-d H:i:s', time());
            }

            // 从暂停变激活,设置暂停日期为空
            if ($old == 'SUSPENDED' && $new == 'ACTIVE') {
                $updateData['suspenddate'] = null;
            }

            $this->db->update('tier2_cust_linkid', $updateData);
            $diff = [
                'date' => $today,
                'tierid' => $item['tierid'],
                'payerid' => $item['payerid'],
                'linkid' => $item['linkid'],
                'change_type' => '字段变化',
                'field_name' => $field,
                'old_value' => $old,
                'new_value' => $new,
                'adddate'   => date('Y-m-d H:i:s', time())
            ];

            $this->db->insert('org_differences', $diff);
        }
    }

    private function  linknameChangeHandler($today, $item, $field, $old, $new) {

        $this->db->where('tierid', $item['tierid']);
        $this->db->where('payerid', $item['payerid']);
        $this->db->where('linkid', $item['linkid']);
        $query = $this->db->get('tier2_cust_linkid');

        if ($query->num_rows() == 0) {
            logtext("处理字段变化,但是数据库不存在link?,tier/payer/link=" . $item['tierid'] . "/" . $item['payerid'] . "/" . $item['linkid']);
            $diff = [
                'date' => $today,
                'tierid' => $item['tierid'],
                'payerid' => $item['payerid'],
                'linkid' => $item['linkid'],
                'change_type' => '异常:字段变化',
                'field_name' => $field,
                'old_value' => $old,
                'new_value' => $new,
                'adddate'   => date('Y-m-d H:i:s', time()),
                'memo' => 'linknameChangeHandler:' . "处理字段变化,但是数据库不存在link?,tier/payer/link=" . $item['tierid'] . "/" . $item['payerid'] . "/" . $item['linkid']
            ];

            $this->db->insert('org_differences', $diff);
        } else {

            $where = ['tierid' => $item['tierid'], 'payerid' => $item['payerid'], 'linkid' => $item['linkid']];
            $this->db->where($where);
            $updateData = ['linkname' => $new];
            $this->db->update('tier2_cust_linkid', $updateData);
            $diff = [
                'date' => $today,
                'tierid' => $item['tierid'],
                'payerid' => $item['payerid'],
                'linkid' => $item['linkid'],
                'change_type' => '字段变化',
                'field_name' => $field,
                'old_value' => $old,
                'new_value' => $new,
                'adddate'   => date('Y-m-d H:i:s', time())
            ];

            $this->db->insert('org_differences', $diff);
        }
    }


    // 跳槽处理
    private function  payeridChangeHandler($today, $item, $field, $old, $new) {

        $fromPayer = $old;
        $toPayer = $new;

        $this->db->where('tierid', $item['tierid']);
        $this->db->where('payerid',  $fromPayer);
        $this->db->where('linkid', $item['linkid']);
        $query = $this->db->get('tier2_cust_linkid');
        $old_row = $query->row_array();

        if (empty($old_row)) {
            $diff = [
                'date' => $today,
                'tierid' => $item['tierid'],
                'payerid' => $item['payerid'],
                'linkid' => $item['linkid'],
                'change_type' => '异常:字段变化',
                'field_name' => $field,
                'old_value' => $old,
                'new_value' => $new,
                'adddate'   => date('Y-m-d H:i:s', time()),
                'memo' => 'payeridChangeHandler:' . "跳槽处理,但未找到跳槽前数据,tier/payer/link=" . $item['tierid'] . "/" . $item['payerid'] . "/" . $item['linkid']

            ];

            $this->db->insert('org_differences', $diff);
        } else {

            $where = ['tierid' => $item['tierid'], 'payerid' => $fromPayer, 'linkid' => $item['linkid']];
            $this->db->where($where);
            // 跳槽时候,解绑日期为当前时间
            $updateData = ['disconnectDate' => date('Y-m-d H:i:s', time())];
            $this->db->update('tier2_cust_linkid', $updateData);


            // 添加跳槽后的记录
            $this->db->where('tierid', $item['tierid']);
            $this->db->where('payerid',  $toPayer);
            $this->db->where('linkid', $item['linkid']);
            $query = $this->db->get('tier2_cust_linkid');

            if ($query->num_rows() == 0) {
                $linkdata = [
                    'tierid' => $item['tierid'],
                    'payerid' => $toPayer,
                    'linkid' => $item['linkid'],
                    'status' => $item['status'],
                    'linkname' => $item['name'],
                    'firstlinkdate' => $old_row['firstlinkdate'],
                    'region_tag' => $old_row['region_tag'],
                    'premonthUsageBigThen50k' => $old_row['premonthUsageBigThen50k'],
                    'pre6monthUsageSmallThen1K' => $old_row['pre6monthUsageSmallThen1K'],
                    'usageLessThen5KBeforeCloseChance' => $old_row['usageLessThen5KBeforeCloseChance'],
                    'ifCEI' => $old_row['ifCEI'],
                    'chanceid' => $old_row['chanceid'],
                    'EURDate' => $old_row['EURDate'],
                    'ifShareShift' => $old_row['ifShareShift'],
                    'ifGreenfield' => $old_row['ifGreenfield'],
                    'ifIncrease' => $old_row['ifIncrease'],
                    'ceiStart' => $old_row['ceiStart'],
                    'ceiEnd' => $old_row['ceiEnd'],
                    'increaseStart' => $old_row['increaseStart'],
                    'increaseEnd' => $old_row['increaseEnd'],
                    'newcustStart' => $old_row['newcustStart'],
                    'newcustEnd' => $old_row['newcustEnd'],
                    'bossadddate' => date('Y-m-d H:i:s', time())
                ];


                $this->db->insert('tier2_cust_linkid', $linkdata);

                $diff = [
                    'date' => $today,
                    'tierid' => $item['tierid'],
                    'payerid' => $item['payerid'],
                    'linkid' => $item['linkid'],
                    'change_type' => '字段变化',
                    'field_name' => $field,
                    'old_value' => $old,
                    'new_value' => $new,
                    'adddate'   => date('Y-m-d H:i:s', time()),
                ];

                $this->db->insert('org_differences', $diff);
            }
        }
    }
}
