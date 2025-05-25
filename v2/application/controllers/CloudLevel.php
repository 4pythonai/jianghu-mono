<?php

declare(strict_types=1);

use League\Pipeline\Pipeline;
use League\Pipeline\StageInterface;

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

/**
 * 云数据相关层级关系管理
 * 
 */







class CloudLevel extends MY_Controller {
    public function __construct() {

        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept,authorization,Cache-Control');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            exit();
        }
    }


    public function GetTierTreeData() {
        // Fetch Tier2 data
        $args = (array) json_decode(file_get_contents("php://input"));
        if (array_key_exists('tierid', $args)) {
            $this->db->where('id', $args['tierid']);
        }

        $tier2Data = $this->db->get('tier2')->result_array();

        // Initialize tree structure
        $tree = [];

        foreach ($tier2Data as $tier2) {
            $tier2Node = [
                'title' => $tier2['name'],
                'key' => 'tier2_' . $tier2['id'],
                'treeData' => []
            ];

            // Fetch PayerID data for each Tier2
            $this->db->where('tierid', $tier2['id']);
            $tier2PayerData = $this->db->get('tier2_payerid')->result_array();

            foreach ($tier2PayerData as $payer) {
                $payerNode = [
                    'title' => $payer['payerid'],
                    'key' => 'payerid_' . $payer['id'],
                    'treeData' => []
                ];

                // Fetch Link data for each Payer
                $this->db->where('tierid', $tier2['id']);
                $this->db->where('payerid', $payer['payerid']);

                $linkData = $this->db->get('tier2_cust_linkid')->result_array();

                foreach ($linkData as $link) {

                    if (empty($link['linkname'])) {
                        $linkNode = [
                            'title' => $link['linkid'],
                            'key' => 'link_' . $link['id']
                        ];
                    } else {

                        $linkNode = [
                            'title' => $link['linkid'] . "/" . $link['linkname'],  // Assuming 'custname' is now used for the link name
                            'key' => 'link_' . $link['id']
                        ];
                    }
                    $payerNode['treeData'][] = $linkNode;
                }

                $tier2Node['treeData'][] = $payerNode;
            }

            $tree[] = $tier2Node;
        }

        // Output the tree structure as JSON
        header('Content-Type: application/json');
        echo json_encode(['code' => 200, 'tree' => $tree]);
    }




    public function GetPayerTreeData() {
        // Fetch PayerID data
        $args = (array) json_decode(file_get_contents("php://input"));
        if (array_key_exists('payerid', $args)) {
            $this->db->where('id', $args['payerid']);
        }

        $payerData = $this->db->get('tier2_payerid')->result_array();

        $tree = [];
        foreach ($payerData as $payer) {
            $payerNode = [
                'title' => $payer['payerid'],
                'key' => 'payerid_' . $payer['id'],
                'treeData' => []
            ];

            // debug($payer);
            $tierid = $payer['tierid'];
            $this->db->where('tierid', $tierid);  // Use payer['id'] instead of payer['payerid']
            $this->db->where('payerid', $payer['payerid']);  // Use payer['id'] instead of payer['payerid']
            $linkData = $this->db->get('tier2_cust_linkid')->result_array();


            foreach ($linkData as $link) {
                if (empty($link['linkname'])) {
                    $linkNode = [
                        'title' => $link['linkid'],
                        'key' => 'link_' . $link['id']
                    ];
                } else {
                    $linkNode = [
                        'title' => $link['linkid'] . "/" . $link['linkname'],
                        'key' => 'link_' . $link['id']
                    ];
                }
                $payerNode['treeData'][] = $linkNode;  // Add to payerNode, not payerData
            }

            $tree[] = $payerNode;  // Add payerNode directly to tree
        }

        // Output the tree structure as JSON
        header('Content-Type: application/json');
        echo json_encode(['code' => 200, 'tree' => $tree]);
    }


    public function GetAllPairID() {

        $this->db->select("  payerid ");
        $this->db->from('tier2_payerid');
        $payerids = $this->db->get()->result_array();
        $ret = [
            'code' => 200,
            'payerids' => $payerids
        ];
        echo json_encode($ret);
    }


    public function GetTierLists() {
        $query = $this->db->select('id,name')
            ->from('tier2')
            ->get();

        $tiers = $query->result_array();
        $res = [];
        $res['code'] = 200;
        $res['tiers'] = $tiers;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }


    // 获取二代下面所有的Payerids
    public function GetPayerIDSByTierid() {
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $tierid = $para['tierid'];
        $query = $this->db->select('id,payerid')
            ->from('tier2_payerid')
            ->where('tierid', $tierid)
            ->get();

        $payerids = $query->result_array();
        $res = [];
        $res['code'] = 200;
        $res['payerids'] = $payerids;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }






    /* 获取二代下面所有的Linkids
       注意: 一个二代下面的linkids可能
       会不同时期属于不同的payerid
     */
    public function GetLinkidsByTierid() {
        $para = (array) json_decode(file_get_contents('php://input'), true);
        $tierid = $para['tierid'];

        $sql = "select distinct linkid,linkid as id from tier2_cust_linkid where tierid=$tierid order by linkid asc";
        $linkids = $this->db->query($sql)->result_array();
        $res = [];
        $res['code'] = 200;
        $res['linkids'] = $linkids;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }


    public function GetPayerRegion() {
        $para =  (array) json_decode(file_get_contents('php://input'), true);
        $payerid = $para['payerid'];
        $region = $this->MCloudLevel->getRegion($payerid);
        $res = [];
        $res['code'] = 200;
        $res['region'] = $region;
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }
}
