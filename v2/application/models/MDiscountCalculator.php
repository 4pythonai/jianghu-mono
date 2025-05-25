<?php



class MDiscountCalculator extends CI_Model {


  private $id;
  private $tierid;
  private $payerid;
  private $linkid;
  private $tierRow;
  private $payerRow;
  private $linkRow;
  private $configDays;

  private $AllConfig;

  private $baseDiscountName;
  private $baseDiscountValue;
  private $techDiscountName;
  private $techDiscountValue;
  private $newCustDiscountName;
  private $newCustDiscountValue;
  private $ceiDiscountName;
  private $ceiDiscountValue;
  private $growthDiscountName;
  private $growthDiscountValue;






  public function __construct($billmonth = null, $id = null, $tierid = null, $payerid = null, $linkid = null) {

    parent::__construct();
    $this->id = $id;
    $this->billmonth = $billmonth;
    $this->tierid =  $tierid;
    $this->linkid = $linkid;
    $this->payerid = $payerid;
  }

  // 设置各个参数
  public function init() {

    $this->tierRow = $this->getTierRow();
    $this->payerRow = $this->getPayerRow();
    $this->linkRow = $this->getLinkRow();
    $this->configDays = $this->db->get('config_days')->result_array();
    // 设置配置项, 包括 link==payerid
    $this->setConfigItems();
    $this->setSettlementDays();

    // 设置强制折扣
    $tmpForcedRows  = $this->db->get('forced_link_discount')->result_array();
    $this->forcedRows = [];
    foreach ($tmpForcedRows as $row) {
      $this->forcedRows[$row['linkid']] = $row;
    }
  }

  public function calculateTotalDiscount() {


    // 国内账号,如果payer=linkid,则全为0
    if ($this->configItemValue('link_equal_payerid') == 'y') {
      if ($this->configItemValue('region') == '国内') {

        $res = [];
        $res['code'] = 200;
        $res['baseDiscountName'] = 'fixed0';
        $res['newCustDiscountName'] = 'fixed0';
        $res['techDiscountName'] = 'fixed0';
        $res['ceiDiscountName'] = 'fixed0';
        $res['growthDiscountName'] = 'fixed0';
        $res['baseDiscountValue'] =  0;
        $res['techDiscountValue'] = 0;
        $res['newCustDiscountValue'] = 0;
        $res['ceiDiscountValue'] =  0;
        $res['growthDiscountValue'] = 0;


        // 如果在强制折扣列表,以强制折扣为准
        if (in_array($this->linkid, array_column($this->forcedRows, 'linkid'))) {
          $res['totalDiscountDebug'] = "强制折扣";
          $this->totalDiscountValue = $this->forcedRows[$this->linkid]['discountValue'];
          $res['totalDiscountValue'] = $this->totalDiscountValue;
        } else {
          $res['totalDiscountDebug'] = "国内:payer==link,固定为0";
          $this->totalDiscountValue = 0;
          $res['totalDiscountValue'] = $this->totalDiscountValue;
        }



        $res['region_tag'] = $this->AllConfig['region'];
        $res['AllConfig'] = [];
        $res['tiername'] = $this->tierRow['name'];
        $res['payerid'] = $this->payerid;
        return $res;
      }
    }

    $this->calculateBaseDiscount();
    $this->calculateTechDiscount();
    $this->calculateNewCustomerDiscount();
    $this->calculateCEIDiscount();
    $this->calculateGrowthDiscount();


    $res = [];
    $res['code'] = 200;
    $res['baseDiscountDebug'] = $this->baseDiscountName . ":" . $this->baseDiscountValue;
    $res['newCustDiscountDebug'] = $this->newCustDiscountName . ":" . $this->newCustDiscountValue;
    $res['techDiscountDebug'] = $this->techDiscountName . ":" . $this->techDiscountValue;
    $res['ceiDiscountDebug'] = $this->ceiDiscountName . ":" . $this->ceiDiscountValue;
    $res['growthDiscountDebug'] = $this->growthDiscountName . ":" . $this->growthDiscountValue;

    $res['baseDiscountValue'] = $this->baseDiscountValue;
    $res['techDiscountValue'] = $this->techDiscountValue;
    $res['newCustDiscountValue'] = $this->newCustDiscountValue;
    $res['ceiDiscountValue'] = $this->ceiDiscountValue;
    $res['growthDiscountValue'] = $this->growthDiscountValue;
    $res['AllConfig'] = $this->AllConfig;


    if (in_array($this->linkid, array_column($this->forcedRows, 'linkid'))) {
      $res['totalDiscountDebug'] = "强制折扣SET";
      $res['totalDiscountValue'] = $this->forcedRows[$this->linkid]['discountValue'];
    } else {
      $res['totalDiscountDebug'] = $this->baseDiscountName . ":" . $this->baseDiscountValue . "--"
        . $this->techDiscountName . ":" . $this->techDiscountValue . "--"
        . $this->newCustDiscountName . ":" . $this->newCustDiscountValue . "--"
        . $this->ceiDiscountName . ":" . $this->ceiDiscountValue . "--"
        . $this->growthDiscountName . ":" . $this->growthDiscountValue;

      $res['totalDiscountValue'] = $this->baseDiscountValue +
        $this->techDiscountValue +
        $this->newCustDiscountValue +
        $this->ceiDiscountValue +
        $this->growthDiscountValue;
    }


    $res['region_tag'] = $this->AllConfig['region'];
    $res['tiername'] = $this->tierRow['name'];
    $res['payerid'] = $this->payerid;

    return $res;
  }





  private function getTierRow() {
    // $this->db->reset_query();
    $this->db->where('id', $this->tierid);
    $tierRow = $this->db->get('tier2')->row_array();
    return $tierRow;
  }


  // 一个payer可能属于多个二代
  private function getPayerRow() {
    $this->db->where('tierid', $this->tierid);
    $this->db->where('payerid', $this->payerid);
    $payerRow = $this->db->get('tier2_payerid')->row_array();
    return $payerRow;
  }


  private function getLinkRow() {
    $this->db->where('id', $this->id);
    $row = $this->db->get('tier2_cust_linkid')->row_array();
    $linkid = $row['linkid'];
    // oldest linkrow

    // 获取最早的一条linkrow
    $this->db->where('linkid', $linkid);
    $this->db->order_by('id', 'ASC');
    $ancestorRow = $this->db->get('tier2_cust_linkid')->row_array();
    $row['firstlinkdate'] = $ancestorRow['firstlinkdate'];
    return $row;
  }



  private function configItemValue($key) {
    return isset($this->AllConfig[$key]) ? $this->AllConfig[$key]['value'] : null;
  }

  private function setConfigItems() {

    // 判断 link==payerid
    if ($this->payerid == $this->linkid) {
      $this->AllConfig['link_equal_payerid'] = ['title' => 'link==payerid', 'value' => 'y'];
    } else {
      $this->AllConfig['link_equal_payerid'] = ['title' => 'link==payerid', 'value' => 'n'];
    }


    $this->AllConfig['firstlinkdate'] =  ['title' => '关联日期', 'value' => $this->linkRow['firstlinkdate']];
    $this->AllConfig['suspenddate'] =  ['title' => '暂停日期', 'value' => $this->linkRow['suspenddate']];

    // 如果暂停日期大于 billmonth 最后一天(不是第一天 ),则设置为空
    $lastDayOfMonth = date('Y-m-d', strtotime($this->billmonth . '-01 +1 month -1 day'));
    if (strtotime($this->linkRow['suspenddate']) >= strtotime($lastDayOfMonth)) {
      $this->AllConfig['suspenddate'] =  ['title' => '暂停日期', 'value' => null];
      $this->AllConfig['suspendCrossMonth'] =  ['title' => '暂停日期跨月', 'value' => 'y'];
    }


    $this->AllConfig['partner_type'] =  ['title' => '合作伙伴类型TP/CP', 'value' => strtolower($this->tierRow['partner_type'])];
    $this->AllConfig['EURDate'] = ['title' => 'EUR完成日期', 'value' => $this->linkRow['EURDate']];
    $this->AllConfig['ifShareShift'] =  ['title' => '是否完成shareshift审批', 'value' => strtolower($this->linkRow['ifShareShift'])];
    $this->AllConfig['ifGreenfield'] =  ['title' => '是否 Greenfield', 'value' => strtolower($this->linkRow['ifGreenfield'])];

    $this->AllConfig['ifCEI'] = [
      'title' => '是否有 CEI',
      'value' => strtolower(substr($this->linkRow['ifCEI'], 0, 1))
    ];




    $this->AllConfig['ceiStart'] = ['title' => 'CEI 开始日期', 'value' => $this->linkRow['ceiStart']];
    $this->AllConfig['ceiEnd'] = ['title' => 'CEI 结束日期', 'value' => $this->linkRow['ceiEnd']];
    $this->AllConfig['ifIncrease'] =  ['title' => '是否有增长折扣', 'value' => $this->linkRow['ifIncrease']];
    $this->AllConfig['increaseStart'] = ['title' => '增长折扣开始日期', 'value' => $this->linkRow['increaseStart']];
    $this->AllConfig['increaseEnd'] =  ['title' => '增长折扣结束日期', 'value' => $this->linkRow['increaseEnd']];
    $this->AllConfig['premonthUsageBigThen50k'] = ['title' => '账号用量超过50K', 'value' => strtolower($this->linkRow['premonthUsageBigThen50k'])];;
    $this->AllConfig['pre6monthUsageSmallThen1K'] = ['title' => '前六个月使用量小于1K', 'value' => strtolower($this->linkRow['pre6monthUsageSmallThen1K'])];;
    $this->AllConfig['usageLessThen5KBeforeCloseChance'] = ['title' => '商机结束前1个月使用量小于5K', 'value' => $this->linkRow['usageLessThen5KBeforeCloseChance']];;
    $this->AllConfig['newcustStart'] = ['title' => '新客有效期开始', 'value' => $this->linkRow['newcustStart']];
    $this->AllConfig['newcustEnd'] = ['title' => '新客有效期结束', 'value' => $this->linkRow['newcustEnd']];
    $this->AllConfig['ifCompetence'] = ['title' => '二代是否有 ifCompetence ', 'value' => strtolower($this->tierRow['ifCompetence'])];
    $this->AllConfig['disconnectDate'] = ['title' => '解绑日期', 'value' => $this->linkRow['disconnectDate']];




    if (substr($this->payerRow['region'], 0, 3) === "cn-") {
      $this->AllConfig['region'] = ['title' => '账号类型', 'value' => '国内'];
    } else {
      $this->AllConfig['region'] = ['title' => '账号类型', 'value' => '海外'];
    }



    $changeRelated = $this->getChangeRelated();

    $this->AllConfig['hasSalesChance'] = $changeRelated['hasSalesChance'];
    $this->AllConfig['sfdc'] = $changeRelated['sfdc'];
    $this->AllConfig['apn_launched'] = $changeRelated['apn_launched'];
    $this->AllConfig['chanceSource'] = $changeRelated['chanceSource'];


    $if_in_newcust_period = $this->getIfInNewcustPeriod();
    $this->AllConfig['if_in_newcust_period'] = $if_in_newcust_period;
  }

  private function getIfInNewcustPeriod() {

    $newcustStart = $this->configItemValue('newcustStart');
    $newcustEnd =  $this->configItemValue('newcustEnd');
    $billing_middle_date = $this->billmonth . '-25';

    $if_in_period = 'y';
    if (empty($newcustStart) || empty($newcustEnd)) {
      $if_in_period = 'n';
    } else {
      $if_in_period = strtotime($billing_middle_date) >= strtotime($newcustStart) && strtotime($billing_middle_date) <= strtotime($newcustEnd) ? 'y' : 'n';
    }

    return ['title' => '是否在新客有效期内', 'value' => $if_in_period];
  }




  private function setSettlementDays() {

    // debug($this->billmonth);
    $date = new DateTime($this->billmonth . '-01');
    $year = intval($date->format('Y'));
    $month = intval($date->format('m'));
    $this->db->where('year', $year);
    $this->db->where('month', $month);
    $row = $this->db->get('config_days')->row_array();

    if ($row) {
      $this->AllConfig['red_day'] = ['title' => "红色日期", 'value' => $row['red_day']];
      $this->AllConfig['yellow_day'] = ['title' => '黄色日期', 'value' => $row['yellow_day']];
    } else {
      $error = ['code' => 500, 'message' => '检查结算日期设置'];
      echo json_encode($error, JSON_UNESCAPED_UNICODE);
      die;
    }
  }


  private function getChangeRelated() {


    $this->db->where('chance_id', $this->linkRow['chanceid']);
    $chanceRow = $this->db->get('saleschance')->row_array();

    if ($chanceRow) {

      if ($chanceRow['sfdc']  == 'Prospect'  || $chanceRow['sfdc']  == 'Closed Lost') {
        $_sfdc = 'n';
      } else {
        $_sfdc = 'y';
      }


      $sfdc = ['title' => 'SFDC商机状态', 'value' => $_sfdc];
      if ($chanceRow['apn_step'] == 'Launched') {
        $_launched = 'y';
      } else {
        $_launched = 'n';
      }

      $launched = ['title' => 'APN商机状态', 'value' => $_launched];

      if (empty($chanceRow['source'])) {
        $_chance_source = '光环';
      } else {
        $_chance_source = '二代';
      }

      $chanceSource = ['title' => '商机来源', 'value' => $_chance_source];
      return [
        'hasSalesChance' => ['title' => '有无商机', 'value' => 'y'],
        'sfdc' => $sfdc,
        'apn_launched' => $launched,
        'chanceSource' => $chanceSource
      ];
    } else {

      $sfdc = ['title' => 'SFDC商机状态', 'value' => null];
      $launched = ['title' => 'APN商机状态', 'value' => null];
      $chanceSource = ['title' => '商机来源', 'value' => null];
      return [
        'hasSalesChance' =>  ['title' => '有无商机', 'value' => 'n'],
        'sfdc' => $sfdc,
        'apn_launched' => $launched,
        'chanceSource' => $chanceSource,
      ];
    }
  }





  public function calculateBaseDiscount() {

    if ($this->configItemValue('region') == '国内') {
      $this->_BaseDiscount_Domestic();
    }

    if ($this->configItemValue('region') == '海外') {
      $this->_BaseDiscount_International();
    }
  }


  private function getEarliestDate() {
    $disconnectDate = $this->configItemValue('disconnectDate');
    $suspendDate = $this->configItemValue('suspenddate');
    // 获取较早的日期
    $earliestDate = null;



    // 两个都不为空
    if (!empty($disconnectDate) && !empty($suspendDate)) {
      clog("两个都不为空", 'red');
      $earliestDate = min(strtotime($disconnectDate), strtotime($suspendDate));
      return $earliestDate;
    }


    // 其中1个为空
    if (empty($disconnectDate)) {
      clog("disconnectDate为空,以suspendDate为准", 'red');
      $earliestDate = strtotime($suspendDate);
      return $earliestDate;
    }

    if (empty($suspendDate)) {
      clog("suspendDate为空,以disconnectDate为准", 'red');
      $earliestDate = strtotime($disconnectDate);
      return $earliestDate;
    }
  }



  private function _BaseDiscount_Domestic() {
    // Check if usage > 50K
    if ($this->configItemValue('premonthUsageBigThen50k') == 'y') {
      // Check if Shareshift approval is completed
      if ($this->configItemValue('ifShareShift') == 'y') {
        $this->baseDiscountName = 'base1';
        $this->baseDiscountValue = $this->tierRow['base1'];
        return;
      } else {
        $this->baseDiscountName = 'base3.3';
        $this->baseDiscountValue = $this->tierRow['base3'];
        return;
      }
    }

    // Usage <= 50K path
    if (empty($this->configItemValue('EURDate'))) {
      // EUR is empty
      $this->baseDiscountName = 'base3.1';
      $this->baseDiscountValue = $this->tierRow['base3'];
      return;
    }

    // 是否需要检查 EUR
    if (!$this->ifNeedCheckEUR()) {
      $this->baseDiscountName = 'base3.4';
      $this->baseDiscountValue = $this->tierRow['base3'];
      return;
    }

    // Need to check EUR
    if ($this->configItemValue('pre6monthUsageSmallThen1K') == 'y') {
      $this->baseDiscountName = 'base4.1';
      $this->baseDiscountValue = $this->tierRow['base4'];
      return;
    }

    // Usage in last 6 months >= 1K
    if ($this->configItemValue('ifShareShift') == 'y') {
      $this->baseDiscountName = 'base4.2';
      $this->baseDiscountValue = $this->tierRow['base4'];
    } else {
      $this->baseDiscountName = 'base3.2';
      $this->baseDiscountValue = $this->tierRow['base3'];
    }
  }


  private function ifNeedCheckEUR() {
    $disconnectDate = $this->configItemValue('disconnectDate');
    $suspendDate = $this->configItemValue('suspenddate');
    $billingStart = strtotime($this->billmonth . '-01');

    // 解绑日期和暂停日期是不是都为空
    if (empty($disconnectDate) && empty($suspendDate)) {
      clog("都是空", 'red');
      return true;
    }

    // 至此,至少一个日期不为空.

    $earliestDate = $this->getEarliestDate();
    if ($earliestDate >= $billingStart) {
      clog("有1个不为空,且大于 billStart", 'red');
      return true;
    }
    clog("返回false", 'red');
    return false; // 不需要检查 EUR
  }


  /**  国外折扣算法
   
  ```mermaid
  flowchart TD
      %% 第一部分 - payer判断
      A[Start] --> B{payer=link?}
      B -->|是| AD[Base11]
      B -->|否| C{用量>50K?}
  
      %% 第二部分 - 用量检查
      C -->|是| D{完成Shareshiftp审批?}
      D -->|是| E[BASE9]
      D -->|否| F[BASE10]
      C -->|否| G{ifNeedCheckEUR?}
      
      %% 第三部分 - 解绑日期和暂停日期检查
      G -->|是| H{"EUR为空?"}
      G -->|否| K[BASE5.1]
  
      %% 第四部分 - EUR报告为空判断
      H -->|是| M{"关联日期>=当月黄色"}
      H -->|否| N{"EUR日期<=当月红色"}
  
      %% 第五部分 - EUR日期判断
      N -->|是| O{"判断CP/TP"}
      N -->|否| P{"EUR>=当月黄色"}
      O -->|TP| Q[BASE6]
      O -->|CP| R[BASE7]
      P -->|否| S[BASE8.1]
      P -->|是| T{"关联日期+2<=当月红色"}
      T -->|否| U[Base5.2]
      T -->|是| V[BASE8.2]
  
      %% 第六部分 - 关联日期判断
      M -->|是| W[Base5.3]
      M -->|否| X{"关联日期<=当月红色"}
      X -->|是| Y{"关联日期+2<=当月红色"}
      Y -->|是| Z[BASE8.3]
      Y -->|否| AA["关联日期+2>=当月黄色"]
      AA -->|是| AB[BASE5.4]
      AA -->|否| AC[BASE8.4]
      X -->|否| AE{"关联日期+2>=当月黄色"}
      AE -->|是| AF[Base5.5]
      AE -->|否| AG[Base8.5]
  ```
   **/

  private function _BaseDiscount_International() {
    // 保留现有的 Base11 逻辑
    if ($this->configItemValue('link_equal_payerid') == 'y') {
      $this->baseDiscountName = '海外/payer==linkid';
      $this->baseDiscountValue = $this->tierRow['base11'];
      clog('BASE11', 'red');
      return;
    }

    // 用量>50K判断
    if ($this->configItemValue('premonthUsageBigThen50k') == 'y') {
      if ($this->configItemValue('ifShareShift') == 'y') {
        $this->baseDiscountName = 'base9';
        $this->baseDiscountValue = $this->tierRow['base9'];
        return;
      } else {
        $this->baseDiscountName = 'base10';
        $this->baseDiscountValue = $this->tierRow['base10'];
        return;
      }
    }

    // 用量<=50K路径
    if (!$this->ifNeedCheckEUR()) {
      $this->baseDiscountName = 'base5.1';
      $this->baseDiscountValue = $this->tierRow['base5'];
      return;
    }

    // 需要检查EUR
    if (empty($this->configItemValue('EURDate'))) {
      // EUR为空
      if (strtotime($this->configItemValue('firstlinkdate')) >= strtotime($this->configItemValue('yellow_day'))) {
        $this->baseDiscountName = 'base5.3';
        $this->baseDiscountValue = $this->tierRow['base5'];
        return;
      }


      $firstLinkDate = strtotime($this->configItemValue('firstlinkdate'));
      $twoAfterLink = strtotime('+2 days', $firstLinkDate);


      // 关联日期判断
      if (strtotime($this->configItemValue('firstlinkdate')) <= strtotime($this->configItemValue('red_day'))) {

        if ($twoAfterLink <= strtotime($this->configItemValue('red_day'))) {
          clog("关联日期+2<=当月红色", 'red');
          $this->baseDiscountName = 'base8.3';
          $this->baseDiscountValue = $this->tierRow['base8'];
        } else if ($twoAfterLink >= strtotime($this->configItemValue('yellow_day'))) {
          clog("关联日期+2>=当月黄色", 'red');
          $this->baseDiscountName = 'base5.4';
          $this->baseDiscountValue = $this->tierRow['base5'];
        } else {
          $this->baseDiscountName = 'base8.4';
          $this->baseDiscountValue = $this->tierRow['base8'];
        }
      } else {
        if ($twoAfterLink >= strtotime($this->configItemValue('yellow_day'))) {
          clog("关联日期+2>=当月黄色", 'red');
          $this->baseDiscountName = 'base5.5';
          $this->baseDiscountValue = $this->tierRow['base5'];
        } else {
          $this->baseDiscountName = 'base8.5';
          $this->baseDiscountValue = $this->tierRow['base8'];
        }
      }
      return;
    }

    // EUR不为空
    if (strtotime($this->configItemValue('EURDate')) <= strtotime($this->configItemValue('red_day'))) {
      // 判断CP/TP
      if ($this->configItemValue('partner_type') == 'tp') {
        $this->baseDiscountName = 'base6';
        $this->baseDiscountValue = $this->tierRow['base6'];
      } else {
        $this->baseDiscountName = 'base7';
        $this->baseDiscountValue = $this->tierRow['base7'];
      }
    } else {
      if (strtotime($this->configItemValue('EURDate')) >= strtotime($this->configItemValue('yellow_day'))) {
        $linkDatePlus2 = strtotime('+2 months', strtotime($this->configItemValue('firstlinkdate')));
        if ($linkDatePlus2 <= strtotime($this->configItemValue('red_day'))) {
          $this->baseDiscountName = 'base8.2';
          $this->baseDiscountValue = $this->tierRow['base8'];
        } else {
          $this->baseDiscountName = 'base5.2';
          $this->baseDiscountValue = $this->tierRow['base5'];
        }
      } else {
        $this->baseDiscountName = 'base8.1';
        $this->baseDiscountValue = $this->tierRow['base8'];
      }
    }
  }




  public function calculateTechDiscount() {

    $isCompetence = $this->configItemValue('ifCompetence');
    $baseValue = $this->baseDiscountValue;
    $premonthUsageBigThen50k = $this->configItemValue('premonthUsageBigThen50k');

    if ($isCompetence == 'n') {
      $this->techDiscountName = 'tech1';
      $this->techDiscountValue = $this->tierRow['tech1'];
      clog('TECH1', 'red');
      return;
    }

    if ($premonthUsageBigThen50k == 'y' || $baseValue <= 2) {
      $this->techDiscountName = 'tech5';
      $this->techDiscountValue = $this->tierRow['tech5'];
      clog('TECH5', 'red');
      return;
    }


    if ($this->configItemValue('region')  == '国内') {
      $this->techDiscountName = 'tech2';
      $this->techDiscountValue = $this->tierRow['tech2'];
      clog('TECH2', 'red');
      return;
    }

    $partner_type = $this->configItemValue('partner_type');
    // debug($partnerType);

    if ($partner_type == 'cp') {
      $this->techDiscountName = 'tech3';
      $this->techDiscountValue = $this->tierRow['tech3'];
      clog('TECH3', 'red');
    }

    if ($partner_type == 'tp') {
      $this->techDiscountName = 'tech4';
      $this->techDiscountValue = $this->tierRow['tech4'];
      clog('TECH4', 'red');
    }
  }


  // ���绑日期不为空,并且解绑日期<当月红色
  // 暂停日期不为空,并且暂停日期<当月红色
  private function _ConditionNewBranchToZero() {

    $ifDisconnectDateEmpty = empty($this->configItemValue('disconnectDate'));
    $ifSuspendDateEmpty = empty($this->configItemValue('suspenddate'));

    $disconnectDate = strtotime($this->configItemValue('disconnectDate'));
    $suspendDate = strtotime($this->configItemValue('suspenddate'));
    $redDay = strtotime($this->configItemValue('red_day'));

    if (!($ifDisconnectDateEmpty) && ($disconnectDate < $redDay)) {
      return true;
    }

    if (!($ifSuspendDateEmpty) && ($suspendDate < $redDay)) {
      return true;
    }
    return false;
  }

  public function calculateNewCustomerDiscount() {

    $this->newCustDiscountName = 'new_x'; //0;  // New1

    $if_in_newcust_period = $this->configItemValue('if_in_newcust_period');
    if ($if_in_newcust_period == 'n') {
      clog('New12', 'red');
      $this->newCustDiscountName = 'new12';
      $this->newCustDiscountValue =  $this->tierRow['new12'];
      return;
    }



    // 解绑日期不为空,并且解绑日期<当月红色
    // 暂停日期不为空,并且暂停日期<当月红色

    if ($this->_ConditionNewBranchToZero()) {
      clog('New1', 'red');
      $this->newCustDiscountName = 'new1'; //0;  // New1
      $this->newCustDiscountValue =  $this->tierRow['new1'];
      return;
    }



    if ($this->configItemValue('region')  == '国内') {

      if ($this->configItemValue('pre6monthUsageSmallThen1K') == 'n') {
        clog('New2', 'red');
        $this->newCustDiscountName = 'new2'; // 0; // New2
        $this->newCustDiscountValue =  $this->tierRow['new2'];
        return;
      }


      if ($this->configItemValue('hasSalesChance') == 'n') {
        clog('New9', 'red');
        $this->newCustDiscountName = 'new9';
        $this->newCustDiscountValue =  $this->tierRow['new9'];
        return;
      }



      if ($this->configItemValue('sfdc') == 'n') {
        clog('New3', 'red');
        $this->newCustDiscountName = 'new3';
        $this->newCustDiscountValue =  $this->tierRow['new3'];
        return;
      }


      // 有新客开始日期
      if (!empty($this->configItemValue('newcustStart'))) {
        clog('New4', 'red');
        $this->newCustDiscountName = 'new4';
        $this->newCustDiscountValue =  $this->tierRow['new4'];
        return;
      }

      // 没有新客开始日期
      clog('New5', 'red');
      $this->newCustDiscountName = 'new5';
      $this->newCustDiscountValue =  $this->tierRow['new5'];
      return;
    } else { // 海外


      if ($this->configItemValue('hasSalesChance') == 'n') {
        clog('New10', 'red');
        $this->newCustDiscountName = 'new10';
        $this->newCustDiscountValue =  $this->tierRow['new10'];
        return;
      }


      if ($this->configItemValue('usageLessThen5KBeforeCloseChance') == 'n') {
        clog('New8', 'red');
        $this->newCustDiscountName = 'new8';
        $this->newCustDiscountValue =  $this->tierRow['new8'];
        return;
      }



      if ($this->configItemValue('usageLessThen5KBeforeCloseChance') == 'y') {
        if ($this->configItemValue('apn_launched') == 'y') {
          $partner_type = $this->configItemValue('partner_type');
          if ($partner_type == 'tp') {
            clog('New6', 'red');
            $this->newCustDiscountName = 'new6';
            $this->newCustDiscountValue =  $this->tierRow['new6'];
            return;
          } else {
            clog('New11', 'red');
            $this->newCustDiscountName = 'new11';
            $this->newCustDiscountValue =  $this->tierRow['new11'];
            return;
          }
        }

        if ($this->configItemValue('apn_launched') == 'n') {
          clog('New7', 'red');
          $this->newCustDiscountName = 'new7';
          $this->newCustDiscountValue =  $this->tierRow['new7'];
          return;
        }
      }
    }
  }


  // ���否不能享受CEI
  public function ifCanNotHaveCEI() {

    $disconnectDate = $this->configItemValue('disconnectDate') ? strtotime($this->configItemValue('disconnectDate')) : null;
    $suspendDate = $this->configItemValue('suspenddate') ? strtotime($this->configItemValue('suspenddate')) : null;
    $redDay = strtotime($this->configItemValue('red_day'));

    if ($disconnectDate !== null && $disconnectDate < $redDay) {
      return true;
    }

    if ($suspendDate !== null && $suspendDate < $redDay) {
      return true;
    }

    return false;
  }

  public function calculateCEIDiscount() {
    if ($this->configItemValue('ifGreenfield') == 'n') {
      clog('CEI1', 'red');
      $this->ceiDiscountName = 'cei1';
      $this->ceiDiscountValue =  $this->tierRow['cei1'];
      return;
    }


    $CanNotHaveCEI = $this->ifCanNotHaveCEI();

    if ($CanNotHaveCEI) {
      clog('CEI5', 'red');
      $this->ceiDiscountName = 'cei5';
      $this->ceiDiscountValue =  $this->tierRow['cei5'];
      return;
    }

    if ($this->configItemValue('ifCEI') != 'y') {
      clog('CEI6', 'red');
      $this->ceiDiscountName = 'cei6';
      $this->ceiDiscountValue =  $this->tierRow['cei6'];
      return;
    }


    $fiveDaysInbillmonth = strtotime('+5 days', strtotime($this->billmonth . '-01'));
    $ceiStart = strtotime($this->configItemValue('ceiStart'));
    $ceiEnd = strtotime($this->configItemValue('ceiEnd'));

    if ($fiveDaysInbillmonth < $ceiStart || $fiveDaysInbillmonth >  $ceiEnd) {
      clog('CEI4', 'red');
      $this->ceiDiscountName = 'cei4';
      $this->ceiDiscountValue =  $this->tierRow['cei4'];
      return;
    }


    if ($this->configItemValue('hasSalesChance') == 'n') {
      clog('CEI7', 'red');
      $this->ceiDiscountName = 'cei7';
      $this->ceiDiscountValue =  $this->tierRow['cei7'];
      return;
    }


    if ($this->configItemValue('chanceSource') == '二代') {
      // 商机来源 二代
      clog('CEI2', 'red');
      $this->ceiDiscountName = 'cei2';
      $this->ceiDiscountValue =  $this->tierRow['cei2'];
      return;
    } else {
      // 商机来源 光环云
      clog('CEI3', 'red');
      $this->ceiDiscountName = 'cei3';
      $this->ceiDiscountValue =  $this->tierRow['cei3'];
      return;
    }
  }

  public function calculateGrowthDiscount() {
    if ($this->configItemValue('ifIncrease') != 'y') {
      clog('Growth1', 'red');
      $this->growthDiscountName = 'growth1';
      $this->growthDiscountValue =  $this->tierRow['growth1'];
      return;
    }

    $currentDate = new DateTime();
    $increaseStart = new DateTime($this->configItemValue('increaseStart'));
    $increaseEnd = new DateTime($this->configItemValue('increaseEnd'));

    if ($currentDate >= $increaseStart && $currentDate <= $increaseEnd) {
      clog('Growth3', 'red');
      $this->growthDiscountName =  'growth3';
      $this->growthDiscountValue =  $this->tierRow['growth3'];
      return;
    }

    clog('Growth2', 'red');
    $this->growthDiscountName = 'growth2';
    $this->growthDiscountValue =  $this->tierRow['growth2'];
    return;
  }
}
