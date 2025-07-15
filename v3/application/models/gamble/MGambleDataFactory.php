<?php

if (!defined('BASEPATH')) {
  exit('No direct script access allowed');
}
class MGambleDataFactory extends CI_Model {

  public function __construct() {
    $this->load->model('gamble/MGame');
    // $jh_db = $this->load->database('jh_db', true);
    // $this->db = $jh_db;
  }

  public function getGameHoles($gameid) {
    $gameid = (int)$gameid;
    $sql = "SELECT court_key, holeid, par, holename ";
    $sql .= "FROM t_game_court, t_court_hole ";
    $sql .= "WHERE t_game_court.courtid = t_court_hole.courtid AND t_game_court.gameid = $gameid ";
    $sql .= "ORDER BY court_key, t_court_hole.courtid, holename LIMIT 18";
    $holes = $this->db->query($sql)->result_array();


    $index = 1;
    foreach (array_keys($holes) as $key) {
      $holes[$key]['hindex'] = $index;
      $holes[$key]['id'] = '#' . $index;
      $index++;
    }
    return $holes;
  }


  public function getOneGambleHoleData($gameid, $groupid, $startHoleindex, $endHoleindex) {
    $public_hole_data = $this->get_public_holedata($gameid, $groupid);
    $realused_holes = $this->choose($public_hole_data, $startHoleindex, $endHoleindex);
    return $realused_holes;
  }




  // //以 t_gamble_game_holeorder 里面的洞序为基准,如果没有,则补齐.
  public function fixHoleOrderString($groupid) {

    $holecounter = $this->game_9_or_18($groupid);
    $sql = "select holeorder from t_gamble_game_holeorder  where groupid=$groupid ";
    $row = $this->db->query($sql)->row_array();
    if (empty($row)) {
      if ($holecounter == 9) {
        $holeorderString = '1,2,3,4,5,6,7,8,9';
      } else {
        $holeorderString = '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18';
      }

      $gameid = $this->getGameid($groupid);
      $this->db->insert('t_gamble_game_holeorder', array('gameid' => $gameid, 'groupid' => $groupid, 'holeorder' => $holeorderString));
    }
  }


  public function getGameid($groupid) {
    $sql = "select gameid from t_game_group where groupid=$groupid";
    $row = $this->db->query($sql)->row_array();
    return $row['gameid'];
  }





  public function getHoleOrderArray($groupid) {
    $this->fixHoleOrderString($groupid);
    $holeorder = $this->getHoleOrderString($groupid);
    $holderarr = explode(",", $holeorder);
    $complex_holeorder = array();
    foreach ($holderarr as $one_value) {
      $complex_holeorder[] = array('hindex' => $one_value);
    }
    return $complex_holeorder;
  }

  public function getHoleOrderString($groupid) {
    $sql = "select holeorder from t_gamble_game_holeorder  where groupid=$groupid ";
    $row = $this->db->query($sql)->row_array();
    $holeorder = $row['holeorder'];
    return $holeorder;
  }



  public function getHoleScore($gameid) {

    $holes = $this->getGameHoles($gameid);
    $holedata       = array();
    $index       = 0;
    foreach ($holes as $one_hole) {
      $holedata[$index]['id']     = '#' . ($index + 1);
      $holedata[$index]['hindex'] = $one_hole['hindex'];

      $holedata[$index]['holeid']   = $one_hole['holeid'];
      $holedata[$index]['par']      = $one_hole['par'];
      $holedata[$index]['selected'] = 'y';

      $holedata[$index]['holename']  = $one_hole['holename'];
      $holedata[$index]['court_key'] = $one_hole['court_key'];
      $court_key                  = $one_hole['court_key'];
      $holeid                     = $one_hole['holeid'];

      $sql = "select court_key,userid,score from t_game_score  where gameid=$gameid  and court_key=$court_key and hole_id=$holeid  ";
      $scores         = $this->db->query($sql)->result_array();
      $raw_holedatas = array();
      foreach ($scores as $one_value) {
        $userid              = $one_value['userid'];
        $raw_holedatas[$userid] = $one_value['score'];
      }
      $holedata[$index]['raw_scores'] = $raw_holedatas;
      $index++;
    }
    return $holedata;
  }





  public function get_public_holedata($gameid, $groupid) {
    $all_holes  = $this->getHoleScore($gameid);
    $holeorder_arr = $this->getHoleOrderArray($groupid);
    $all_holes_sort_by_holeorder = $this->orderArraybyArray($holeorder_arr, 'hindex', $all_holes, 'hindex');
    return $all_holes_sort_by_holeorder;
  }


  public function choose($public_hole_data, $startHoleindex, $endHoleindex) {
    $real_holes = array();
    foreach ($public_hole_data as $array_pointer => $one_hole) {
      $hole_pointer = $array_pointer + 1;
      if (($hole_pointer >= $startHoleindex) && ($hole_pointer <= $endHoleindex)) {
        $one_hole['selected'] = 'y';
      } else {
        $one_hole['selected'] = 'n';
      }
      $real_holes[] = $one_hole;
    }
    return $real_holes;
  }


  function game_9_or_18($groupid) {
    $sql  = "select * from  t_game_court where  gameid in ( select gameid from   t_game_group  where groupid=$groupid)";
    $rows = $this->db->query($sql)->result_array();
    if (count($rows) == 1) {
      return 9;
    } else {
      return 18;
    }
  }


  function orderArraybyArray($base, $basekey, $unsortdata, $datakey) {
    $ret = array();
    foreach ($base as $one_base) {
      foreach ($unsortdata as $one_data) {
        if ($one_data[$datakey] == $one_base[$basekey]) {
          $ret[] = $one_data;
          continue;
        }
      }
    }
    return $ret;
  }

  public function m_get_group_info($groupid) {

    $web_url = config_item('web_url');
    $sql_group_user = "";
    $sql_group_user = "select  userid,wx_nickname as username,wx_nickname as nickname, ";
    $sql_group_user .= "concat('$web_url',t_user.avatar) as cover  ";
    $sql_group_user .= " from t_game_group_user,t_user";
    $sql_group_user .= " where  t_game_group_user.groupid=$groupid";
    $sql_group_user .= "   and t_user.id=t_game_group_user.userid";
    $group_user = $this->db->query($sql_group_user)->result_array();
    return $group_user;
  }


  // 获取已经完全记分的球洞
  public function getFinishedHoles($holes, $scores) {

    $useful_holes = [];

    // 循环所有的洞
    foreach ($holes as $hole) {
      $holeId = $hole['id']; // 例如: #1, #2

      // 在scores中找到对应的成绩记录
      $correspondingScore = null;
      foreach ($scores as $score) {
        if ($score['id'] == $holeId) {
          $correspondingScore = $score;
          break;
        }
      }

      // 如果没有找到对应的成绩记录，跳过这个洞
      if ($correspondingScore === null) {
        continue;
      }

      // 检查 raw_scores 是否为空数组（表示记分未完成）
      if (empty($correspondingScore['raw_scores'])) {
        break; // 如果原始成绩为空，退出循环
      }

      // 新增：检查是否有球手积分为0（使用intval）
      $hasInvalidScore = false;
      foreach ($correspondingScore['raw_scores'] as $score) {
        if (intval($score) === 0) {
          $hasInvalidScore = true;
          break;
        }
      }
      if ($hasInvalidScore) {
        break; // 有球手未记分，退出循环
      }

      // 组装 hole 和 score 的组合
      $oneHoleMeta =  $hole;
      $oneHoleMeta['computedScores'] = $correspondingScore['computedScores'];
      $oneHoleMeta['raw_scores'] = $correspondingScore['raw_scores'];
      $useful_holes[] = $oneHoleMeta;
    }

    return $useful_holes;
  }

  public function getRangedHoles($holes, $startHoleindex, $endHoleindex) {
    $ranged = [];
    foreach ($holes as $hole) {
      // hindex 是数字，startHoleindex/endHoleindex 也是数字
      if ($hole['hindex'] >= $startHoleindex && $hole['hindex'] <= $endHoleindex) {
        $ranged[] = $hole;
      }
    }
    return $ranged;
  }
}
