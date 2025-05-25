<?php

declare(strict_types=1);
set_time_limit(0);

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


/**
 * 规则1  payerid exists
 * 规则2  linkid exists
 * 规则3  r_Others 费用情况
 * 规则4  cfg_monthly_discount 中 linkid 的完整性
 * 信息: payerid+记录条数
 * 
 * 
 * 
 * 
 */

class Audit extends MY_Controller {
    public function __construct() {

        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
    }


    public function index() {

        $para = (array) json_decode(file_get_contents('php://input'), true);
        $billmonth = $para['billmonth']; // Get the billmonth from the parameters
        $linkcheck = $this->CheckLinkid($billmonth);
        $newPayers = [];
        $rawNumberReport = $this->rawNumberReport($billmonth);
        $jumpLogs = $this->getJumpLogs($billmonth); // 跳槽
        $monthlyMissingLinkids = $this->CheckMonthlyMissinglinkid($billmonth);
        $missingCfgLinkDiscount = $this->CheckLinkidMissingConfig($billmonth);
        $missingProdDiscount = $this->ChecMissingProdDiscount($billmonth);



        $response = array(
            'code' => 200,
            'status' => '检查结束',
            'newLinkids' => $linkcheck,
            'newPayers' => $newPayers,
            'jumpLogs' => $jumpLogs,
            'monthlyMissingLinkids' => $monthlyMissingLinkids,
            'rawNumberReport' => $rawNumberReport,
            'missingCfgLinkDiscount' => $missingCfgLinkDiscount,
            'missingProdDiscount' => $missingProdDiscount,
        );

        // Send the JSON response  

        $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode($response));
    }



    // 跳槽

    public function getJumpLogs($billmonth) {
        // 子查询：选择出现次数大于1的linkid
        $this->db->select('linkid');
        $this->db->from('s3_global_cur_month_pivot');
        $this->db->group_by('linkid');
        $this->db->where('billmonth', $billmonth);
        $this->db->having('COUNT(DISTINCT payerid) > 1');
        $subquery = $this->db->get_compiled_select();

        // 主查询：获取这些linkid的详细信息
        $this->db->select('linkid, GROUP_CONCAT(DISTINCT payerid) as payerids');
        $this->db->from('s3_global_cur_month_pivot');
        $this->db->where("linkid IN ($subquery)", null, false);
        $this->db->group_by('linkid');
        $this->db->order_by('linkid');
        $query = $this->db->get();
        $results = $query->result_array();
        $serialno = 1;
        foreach ($results as &$row) {
            $row['serialno'] = $serialno++;
            $row['Payer/link丢失'] = $this->checkLinkExistsUnderPayerid($row['linkid'], $row['payerids']);
        }
        logtext("跳槽检查sql" . $this->db->last_query());
        return $results;
    }

    // 检查 linkid 是否存在于每一个 payerid 中
    private function checkLinkExistsUnderPayerid($linkid, $payerids) {
        $payerids = explode(',', $payerids);
        foreach ($payerids as $payerid) {
            $this->db->select('linkid')->from('tier2_cust_linkid')->where('payerid', $payerid)->where('linkid', $linkid);
            $query = $this->db->get();
            $results = $query->result_array();
            if (count($results) == 0) {
                return  "payer: " . $payerid . " 下缺失link: " . $linkid;
            }
        }
        return "检查通过";
    }



    /*
      聚合报告s3_global_cur_month_pivot中 出现 未配置的 linkid    
    */

    public function CheckLinkid($billmonth) {
        $subquery = $this->db->select('linkid')->from('tier2_cust_linkid')->get_compiled_select();
        $this->db->distinct();
        $this->db->select('s.payerid,s.linkid')
            ->from('s3_global_cur_month_pivot s')
            ->where('s.billmonth', $billmonth)
            ->where("s.linkid NOT IN ($subquery)", null, false)
            ->order_by("'s.payerid' ", "asc");

        $query = $this->db->get();
        $results = $query->result_array();
        clog($this->db->last_query());
        $serialno = 1;
        foreach ($results as &$row) {
            $row['serialno'] = $serialno++;
        }
        return $results;
    }




    /*
      聚合报告s3_global_cur_month_pivot中 的 linkid 未进行 月度折扣配置 
    */

    public function CheckMonthlyMissinglinkid($billmonth) {
        $subquery = $this->db->select('linkid')
            ->from('cfg_monthly_discount')
            ->where('billmonth', $billmonth)
            ->get_compiled_select();

        $this->db->distinct();
        $this->db->select('t2.name as tier_name, s.payerid, s.linkid')
            ->from('s3_global_cur_month_pivot s')
            ->join('tier2 t2', 't2.id = s.tierid', 'left')
            ->where('s.billmonth', $billmonth)
            ->where("s.linkid NOT IN ($subquery)", null, false)
            ->order_by("t2.name", "asc");

        $query = $this->db->get();
        $results = $query->result_array();
        clog("月度折扣配置检查:" . $this->db->last_query());
        $serialno = 1;
        foreach ($results as &$row) {
            $row['serialno'] = $serialno++;
        }
        return $results;
    }


    public function CheckLinkidMissingConfig($billmonth) {
        // 查询 cfg_link_discount 表中的数据
        $subquery = $this->db->select('CONCAT(tierid, "|", payerid, "|", linkid) as combination')
            ->from('cfg_link_discount')
            ->where('billmonth', $billmonth)
            ->get_compiled_select();

        // 查询 s3_global_cur_month_pivot 表中的数据，并检查是否存在于 cfg_link_discount 中
        $this->db->distinct();
        $this->db->select('t2.name as tier_name, s.tierid, s.payerid, s.linkid')
            ->from('s3_global_cur_month_pivot s')
            ->join('tier2 t2', 't2.id = s.tierid', 'left')
            ->where('s.billmonth', $billmonth)
            ->where("CONCAT(s.tierid, '|', s.payerid, '|', s.linkid) NOT IN ($subquery)", null, false)
            ->order_by("t2.name", "asc");

        $query = $this->db->get();
        $results = $query->result_array();

        // 记录查询日志
        clog($this->db->last_query());

        // 添加序列号
        $serialno = 1;
        foreach ($results as &$row) {
            $row['serialno'] = $serialno++;
        }

        return $results;
    }


    public function ChecMissingProdDiscount($billmonth) {
        // 查询 cfg_link_discount 表中的数据
        $subquery = $this->db->select('CONCAT(payerid, "|", linkid) as combination')
            ->from('cfg_link_prod_discount')
            ->where('billmonth', $billmonth)
            ->get_compiled_select();

        // 查询 s3_global_cur_month_pivot 表中的数据，并检查是否存在于 cfg_link_discount 中
        $this->db->select('s.tierid, s.payerid, s.linkid')
            ->from('s3_global_cur_month_pivot s')
            ->where('s.billmonth', $billmonth)
            ->where("CONCAT( s.payerid, '|', s.linkid) NOT IN ($subquery)", null, false)
            ->order_by("s.payerid", "asc");

        $query = $this->db->get();
        $results = $query->result_array();

        // 记录查询日志
        clog($this->db->last_query());

        // 添加序列号
        $serialno = 1;
        foreach ($results as &$row) {
            $row['serialno'] = $serialno++;
        }

        return $results;
    }


    public function  rawNumberReport($billmonth) {
        $sql1 = " select tierid,payerid,count(id) as counter from s3_global_cur_raw
                where billmonth = '{$billmonth}'
                GROUP BY tierid,payerid 
                ORDER by tierid, payerid ";
        $set1 = $this->db->query($sql1)->result_array();
        $sql2 = " select  name,tierid ,payerid, 0 as counter from tier2 join tier2_payerid on tier2.id=tier2_payerid.tierid ";
        $set2 = $this->db->query($sql2)->result_array();
        foreach ($set2 as &$row2) {
            // 在 $set1 中查找匹配的记录
            foreach ($set1 as $row1) {
                if ($row1['tierid'] == $row2['tierid'] && $row1['payerid'] == $row2['payerid']) {
                    // 如果找到匹配的记录，更新 counter 字段
                    $row2['counter'] = $row1['counter'];
                    break; // 跳出内层循环
                }
            }
            // 如果在 $set1 中没有找到匹配的记录，counter 保持为0
        }

        $serialno = 1;
        foreach ($set2 as &$row) {
            $row['serialno'] = $serialno++;
        }
        return $set2;
    }


    public function AkSkCheck() {

        $para = (array) json_decode(file_get_contents('php://input'), true);
        $billmonth = $para['billmonth']; // Get the billmonth from the parameters
        $s3ConfigChecks = $this->s3ConfigCheckHandler($billmonth);



        $response = array(
            'code' => 200,
            'status' => '检查结束',
            's3ConfigChecks' => $s3ConfigChecks
        );

        // Send the JSON response  

        $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode($response));
    }


    public function s3ConfigCheckHandler($billmonth) {

        $payers = $this->db->get('tier2_payerid')->result_array();

        // $sql = "select * from tier2_payerid where id in(1,2,3,4)";
        // $payers = $this->db->query($sql)->result_array();

        $bad_payers = [];
        $serialno = 1;
        $total = count($payers);
        $index = 1;

        foreach ($payers as $onepayer) {
            clog("检查Payer ak/sk: " . $index . "/" . $total);
            $cfg = [
                'ak' => $onepayer['ak'],
                'sk' => $onepayer['sk'],
                'region' => $onepayer['region'],
                'month' => $billmonth,
                'payerid' => $onepayer['payerid'],
                'curtype' => 'months'
            ];

            $s3Result =  $this->CURPipe->ListObjects($cfg);
            if (!$s3Result['s3Success']) {

                $tmperr = [];
                $tmperr['serialno'] = $serialno;
                $tmperr['payerid'] =  $onepayer['payerid'];
                $tmperr['s3Success'] = $s3Result['s3Success'];
                $tmperr['s3ErrosMsg'] = $s3Result['s3ErrosMsg'];
                $bad_payers[] = $tmperr;
                $serialno++;
            }
            $index++;
        }
        return $bad_payers;
    }
}
