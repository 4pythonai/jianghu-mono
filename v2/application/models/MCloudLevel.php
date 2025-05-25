<?php

use Aws\Exception\AwsException;


class MCloudLevel extends CI_Model {
  public function __construct() {
    parent::__construct();
  }



  public function getPayeridsByTierid($tierid) {

    $this->db->select('tierid,payerid,ak,sk,region,"months" as curtype');
    $this->db->from('tier2_payerid');
    $this->db->where('tierid', $tierid);
    $rows = $this->db->get()->result_array();
    return $rows;
  }



  public function getTieridByPayerid($payerid) {
    $this->db->select('tierid');
    $this->db->from('tier2_payerid');
    $this->db->where('payerid', $payerid);

    $query = $this->db->get();

    if ($query->num_rows() == 0) {
      return "NOT_FOUND_ZERO";
    }

    if ($query->num_rows() == 1) {
      return $query->row()->tierid;
    }

    if ($query->num_rows() > 1) {
      return "NOT_FOUND_DUPLICATE";
    }
  }

  public function getRegion($payerid) {

    $this->db->select('region');
    $this->db->from('tier2_payerid');
    $this->db->where('payerid', $payerid);

    $query = $this->db->get();

    if ($query->num_rows() > 0) {
      return $query->row()->region;
    } else {
      return null;
    }
  }



  public function getLinkIdsByTierid($tierid) {
    $this->db->select('id,linkid');
    $this->db->from('tier2_cust_linkid');
    $this->db->where('tierid', $tierid);
    $query = $this->db->get()->result_array();
    return $query;
  }


  public function getLinkIdsByPayerId($payerid) {
    $this->db->select('id,linkid');
    $this->db->from('tier2_cust_linkid');
    $this->db->where('payerid', $payerid);
    $query = $this->db->get()->result_array();
    return $query;
  }






  public function getPayerIDByLinkId($linkid) {
    $this->db->select('payerid');
    $this->db->from('tier2_cust_linkid');
    $this->db->where('id', $linkid);
    $query = $this->db->get();
    if ($query->num_rows() > 0) {
      return $query->row()->payerid;
    } else {
      return null;
    }
  }


  public function getTierIDByLinkId($linkid) {
    $this->db->select('tierid');
    $this->db->from('tier2_cust_linkid');
    $this->db->where('linkid', $linkid);
    $query = $this->db->get();
    if ($query->num_rows() > 0) {
      return $query->row()->tierid;
    } else {
      return null;
    }
  }


  public function getPayerIDByPayeridString($payeridString) {
    $this->db->select('id');
    $this->db->from('tier2_payerid');
    $this->db->where('payerid', $payeridString);
    $query = $this->db->get();
    if ($query->num_rows() > 0) {
      return $query->row()->id;
    } else {
      return null;
    }
  }


  public function getTierNameByTierid($tierid) {
    $this->db->select('name');
    $this->db->from('tier2');
    $this->db->where('id', $tierid);

    $query = $this->db->get();

    if ($query->num_rows() > 0) {
      return $query->row()->name;
    } else {
      return null;
    }
  }


  public function getLinkNameByLinkId($linkid) {
    $this->db->select('linkname');
    $this->db->from('tier2_cust_linkid');
    $this->db->where('linkid', $linkid);
    $query = $this->db->get();
    return $query->row()->linkname;
  }





  // AWS api 获取 accounts 可能要分页,完全获取需要轮询
  public function getAllAccounts($client) {


    $accounts = [];
    $nextToken = null;

    do {
      try {
        $params = [];
        if ($nextToken) {
          $params['NextToken'] = $nextToken;
        }

        $result = $client->listAccounts($params);

        $accounts = array_merge($accounts, $result['Accounts']);

        // 检查是否有更多分页
        $nextToken = isset($result['NextToken']) ? $result['NextToken'] : null;
      } catch (AwsException $e) {
        echo "Error: " . $e->getMessage() . "\n";
        return;
      }
    } while ($nextToken);

    return $accounts;
  }


  public function getInvoiceMetaByTierid($tierid) {
    $this->db->select('invoiceMeta');
    $this->db->from('tier2');
    $this->db->where('id', $tierid);
    $query = $this->db->get();

    if ($query->num_rows() > 0) {
      return $query->row()->invoiceMeta;
    } else {
      return '';
    }
  }

  public function getAuthorByTierid($tierid) {
    $this->db->select('author');
    $this->db->from('tier2');
    $this->db->where('id', $tierid);
    $query = $this->db->get();

    if ($query->num_rows() > 0) {
      return $query->row()->author;
    } else {
      return '';
    }
  }
}
