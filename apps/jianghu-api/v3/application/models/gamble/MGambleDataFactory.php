<?php

if (!defined('BASEPATH')) {
  exit('No direct script access allowed');
}
class MGambleDataFactory extends CI_Model {


  // 根据实际打球顺序排序

  public function getHoleOrderArrayByHolePlayList($gameid, $startHoleindex, $roadLength) {
    $holes = $this->MDetailGame->getGameHoles($gameid);

    // 使用环形结构获取指定范围的球洞
    return $this->getRangedHoles($holes, $startHoleindex, $roadLength);
  }


  public function getScoresOrderByHolePlayList($gameid, $startHoleindex, $roadLength) {
    $scores  = $this->getHoleScore($gameid);
    $holes = $this->getHoleOrderArrayByHolePlayList($gameid, $startHoleindex, $roadLength);

    $afterOrder = [];
    foreach ($holes as $one) {
      foreach ($scores as $score) {
        if ($score['hindex'] == $one['hindex']) {
          $afterOrder[] = $score;
          break;
        }
      }
    }
    return $afterOrder;
  }



  public function getGameid($groupid) {
    $sql = "select gameid from t_game_group where groupid=$groupid";
    $row = $this->db->query($sql)->row_array();
    return $row['gameid'];
  }



  public function getHoleScore($gameid) {

    $holes = $this->MDetailGame->getGameHoles($gameid);
    $holedata    = [];
    $index       = 0;
    foreach ($holes as $one_hole) {
      $holedata[$index]['id']     = '#' . ($index + 1);
      $holedata[$index]['hindex'] = $one_hole['hindex'];
      $holedata[$index]['holeid']   = $one_hole['holeid'];
      $holedata[$index]['par']      = $one_hole['par'];
      $holedata[$index]['holename']  = $one_hole['holename'];
      $holedata[$index]['court_key'] = $one_hole['court_key'];
      $court_key                  = $one_hole['court_key'];
      $holeid                     = $one_hole['holeid'];

      $sql = "select court_key,userid,score from t_game_score  where gameid=$gameid  and court_key=$court_key and hole_id=$holeid  ";
      $scores         = $this->db->query($sql)->result_array();
      $raw_holedatas = [];
      foreach ($scores as $one_value) {
        $userid              = $one_value['userid'];
        $raw_holedatas[$userid] = $one_value['score'];
      }
      $holedata[$index]['raw_scores'] = $raw_holedatas;
      $index++;
    }


    return $holedata;
  }



  // 获取已经完全记分的球洞
  public function getUsefulHoles($holes, $scores, $playerCount) {

    // debug(' holes +++++++++++++++++++++', $holes);
    // debug('scores+++++++++++++++++++++', $scores);
    // die;
    $useful_holes = [];
    // 循环所有的洞
    foreach ($holes as $hole) {
      $holeId = $hole['hindex']; // 例如: #1, #2
      // 在scores中找到对应的成绩记录
      $correspondingScore = null;
      foreach ($scores as $score) {
        if ($score['hindex'] == $holeId) {
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
      $oneHoleMeta['strokedScores'] = $correspondingScore['strokedScores'];
      $oneHoleMeta['raw_scores'] = $correspondingScore['raw_scores'];
      $useful_holes[] = $oneHoleMeta;
    }

    $realUseful_holes = $this->checkAllPlayerHasScore($useful_holes, $playerCount);

    // 如果记分的数量少于玩家数量,不能算有效洞

    return $realUseful_holes;
  }


  private function checkAllPlayerHasScore($scores, $playerCount) {
    $realUseful_holes = [];
    foreach ($scores as $score) {
      if (count($score['raw_scores']) == $playerCount) {
        $realUseful_holes[] = $score;
      }
    }
    return $realUseful_holes;
  }


  public function getRangedHoles($holes, $startHoleindex, $roadLength) {
    $ranged = [];
    $totalHoles = count($holes);

    // 首先找到起始球洞的位置
    $startIndex = -1;
    foreach ($holes as $index => $hole) {
      if ($hole['hindex'] == $startHoleindex) {
        $startIndex = $index;
        break;
      }
    }

    if ($startIndex === -1) {
      return $ranged; // 如果找不到起始球洞，返回空数组
    }

    // 从起始位置开始，收集指定数量的球洞（环形结构）
    for ($i = 0; $i < $roadLength; $i++) {
      $currentIndex = ($startIndex + $i) % $totalHoles; // 环形索引
      $ranged[] = $holes[$currentIndex];
    }

    return $ranged;
  }
}
