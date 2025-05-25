<?php

declare(strict_types=1);

require_once APPPATH . 'third_party/aws/aws-autoloader.php';

use Aws\Organizations\OrganizationsClient;
use Aws\Sts\StsClient;
use Aws\Exception\AwsException;

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class AWS extends MY_Controller {
    public function __construct() {

        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
    }

    public function GetTierInfo() {
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $ak = $para['ak'];
        $sk = $para['sk'];
        $region = $para['region'];

        $awsConfig = [
            'version' => 'latest',
            'region'  => $region,
            'credentials' => [
                'key'    =>  $ak,
                'secret' =>  $sk
            ],
        ];
        $stsClient = new StsClient($awsConfig);
        $payload = [];
        try {
            $result = $stsClient->getCallerIdentity();
            $payload['Account'] = $result['Account'];
            $payload['UserId'] = $result['UserId'];
            $payload['Arn'] = $result['Arn'];
        } catch (Aws\Exception\AwsException $e) {
            echo $e->getMessage();
            echo "\n";
        }

        $res = [];
        $res['code'] = 200;
        $res['payload'] =  $payload;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }












    public function getAwsLinkids($_tmp = null) {
        if ($_tmp) {
            $args = $_tmp;
        } else {
            $args = (array) json_decode(file_get_contents("php://input"));
        }

        $client = new OrganizationsClient([
            'region' => $args['region'],
            'version' => 'latest',
            'credentials' => [
                'key' => $args['ak'],
                'secret' => $args['sk']
            ],
        ]);


        $accounts = $this->MCloudLevel->getAllAccounts($client);

        if ($args['flag'] == 'save') {
            $this->add_linkid_info($args['payer'], $accounts);
        }

        // add key property to accounts, start from 1
        foreach ($accounts as $key => $account) {
            $accounts[$key]['key'] = $key + 1;
        }

        $ret = [
            'code' => 200,
            'message' => 'success',
            'data' => $accounts
        ];

        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }






    public function batch_load_link() {
        $rows = $this->db->query("select * from tier2_payerid")->result_array();
        foreach ($rows as $row) {
            clog($row['payerid'], 'red');
            $this->getAwsLinkids(['ak' => $row['ak'], 'payer' => $row['payerid'], 'sk' => $row['sk'], 'region' => $row['region'], 'flag' => 'save']);
        }
    }


    public function add_linkid_info($payer, $aws_linkids) {

        // 补齐到 payer 下面去
        // $this->PayerAlignment($payer, $aws_linkids);
        return ['code' => 500, 'status' => 'success', 'message' => '已经禁止手工添加link'];
    }


    // 补齐一个payer下面的link
    public function PayerAlignment($payer, $aws_linkids) {

        $query = $this->db->get_where('tier2_payerid', array('payerid' => $payer));
        $payer_info = $query->row();
        if (!$payer_info) {
            return array('status' => 'error', 'message' => '未找到对应的 payer 信息');
        }



        $tierid = $payer_info->tierid;
        foreach ($aws_linkids as $aws_info) {
            $linkname = $aws_info['Name'];
            $linkid = $aws_info['Id'];
            $email = $aws_info['Email'];
            // 检查 linkid 是否已存在
            $exist_linkid = $this->db->get_where('tier2_cust_linkid', array(
                'tierid' => $tierid,
                'payerid' => $payer,
                'linkid' => $linkid
            ))->row();

            if (!$exist_linkid) {
                // 插入新的 linkid
                $linkid_data = [
                    'tierid' => $tierid,
                    'payerid' => $payer,
                    'linkname' => $linkname,
                    'linkid' => $linkid,
                    'email' => $email,
                    'JoinedMethod' =>  $aws_info['JoinedMethod'],
                    'JoinedTimestamp' => $aws_info['JoinedTimestamp'],
                    'Status' => $aws_info['Status'],
                    'memo' => '对齐'
                ];
                $this->db->insert('tier2_cust_linkid', $linkid_data);
            }
        }
    }


    public function getLinkTimelineDiff() {
        $today = date('Y-m-d');
        $threeDaysAgo = date('Y-m-d', strtotime('-2 days'));

        $this->db->select('orgdiff.id, orgdiff.adddate, orgdiff.payerid, orgdiff.linkid, orgdiff.field_name,orgdiff.old_value,orgdiff.new_value,tp.name, orgdiff.change_type');
        $this->db->from('org_differences orgdiff');
        $this->db->join('tier2 tp', 'tp.id = orgdiff.tierid', 'left');
        $this->db->where('date >=', $threeDaysAgo);
        $this->db->where('date <=', $today);
        $this->db->order_by('orgdiff.id  desc ,tierid, payerid, linkid, change_type');

        $query = $this->db->get();
        $rows = $query->result_array();

        $res = [
            'code' => 200,
            'rows' => $rows
        ];

        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }
}
