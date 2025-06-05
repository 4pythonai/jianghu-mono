<?php

declare(strict_types=1);
require_once APPPATH . 'third_party/aws/aws-autoloader.php';

use Aws\Organizations\OrganizationsClient;
use Aws\Sts\StsClient;
use Aws\Exception\AwsException;

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class MCrontable extends CI_Model {

    public function cleaTodayData() {
        $today = date('Y-m-d');
        // Use TRUNCATE instead of DELETE for better performance
        $this->db->query('TRUNCATE TABLE tmp_daily_org_info');
        $error = $this->db->error();
        if ($error['code'] != 0) {
            $errmsg = $error['message'];
            logtext('error', 'Failed to truncate tmp_daily_org_info: ' . $errmsg);
        }

        $this->db->where('date', $today);
        $this->db->delete('org_differences');

        $this->db->where('date', $today);
        $this->db->delete('daily_org_info');
    }

    // 写"日快照"
    public function saveTodayPayersSnapshot() {

        $sql = "select  distinct tierid, payerid,region,ak,sk  from tier2_payerid where payerid not in ('408280744142','466359625393','713212641044','551894331156','552642948131','496406325676','809115248586','181792686765','768785564164','827601820786')";
        $payerids = $this->db->query($sql)->result_array();


        foreach ($payerids as $payerInfo) {
            // 写"日快照"
            $this->saveTodayOnePayerSnapshot($payerInfo);
        }
        $this->transTmpToOrginfo();
    }


    public function saveTodayOnePayerSnapshot($payer) {

        $today = date('Y-m-d');
        $tierid = $payer['tierid'];
        $payerid = $payer['payerid'];
        $region = $payer['region'];
        $ak = $payer['ak'];
        $sk = $payer['sk'];
        $awsConfig = [
            'version' => 'latest',
            'region'  => $region,
            'credentials' => [
                'key'    => $ak,
                'secret' => $sk
            ],
        ];
        $organizationsClient = new OrganizationsClient($awsConfig);
        try {
            $accounts = $this->MCloudLevel->getAllAccounts($organizationsClient);
            foreach ($accounts as $account) {
                $data = [
                    'date' => $today,
                    'tierid' => $tierid,
                    'payerid' => $payerid,
                    'linkid' => $account['Id'],
                    'name' => $account['Name'],
                    'arn' => $account['Arn'],
                    'status' => $account['Status'],
                    'created_timestamp' => $account['JoinedTimestamp']->format('Y-m-d H:i:s'),
                    'adddate'   => date('Y-m-d H:i:s', time())
                ];

                $this->db->insert('tmp_daily_org_info', $data);
            }
        } catch (Aws\Exception\AwsException $e) {
            logtext('error', 'Error fetching AWS organization info: ' . $e->getMessage());
        }
    }

    // 将今天的快照补入 daily_org_info
    public function transTmpToOrginfo() {
        $sql = " insert into daily_org_info ( date,
                    tierid,
                    payerid,
                    linkid,
                    name,
                    arn,
                    status,
                    created_timestamp,
                    adddate )

                    select date,
                    tierid,
                    payerid,
                    linkid,
                    name,
                    arn,
                    status,
                    created_timestamp,
                    adddate
                    from tmp_daily_org_info ";
        $this->db->query($sql);
    }
}
