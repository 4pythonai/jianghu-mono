<?php

class MScore  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }



  public function saveScore($game_id, $group_id, $hole_unique_key, $hindex, $scores) {
    // 从 holeUniqueKey 中解析出 hole_id (格式: "1_19" -> 19)
    $court_key = explode('_', $hole_unique_key)[0];
    $hole_id = explode('_', $hole_unique_key)[1];

    $success_count = 0;
    $error_count = 0;

    // 遍历每个用户的成绩
    foreach ($scores as $score_data) {
      $user_id = $score_data['userid'];

      // 准备要保存的数据
      $save_data = [
        'gameid' => $game_id,
        'user_id' => $user_id,
        'hindex' => $hindex,
        'userid' => $user_id,
        'group_id' => $group_id,
        'hole_id' => $hole_id,
        'court_key' => $court_key,
        'score' => $score_data['score'],
        'putts' => isset($score_data['putts']) ? $score_data['putts'] : null,
        'penalty_strokes' => isset($score_data['penalty_strokes']) ? $score_data['penalty_strokes'] : null,
        'sand_save' => isset($score_data['sand_save']) ? $score_data['sand_save'] : null,
        'gir' => isset($score_data['gir']) ? $score_data['gir'] : null,
        'fairway_hit' => isset($score_data['fairway_hit']) ? $score_data['fairway_hit'] : null,
        'tee_shot_direction' => isset($score_data['tee_shot_direction']) ? $score_data['tee_shot_direction'] : null,
        'recorder_type' => 'app'
      ];

      // 检查是否已存在记录（基于唯一约束：game_id, user_id, hole_id）
      $existing = $this->db->select('id')
        ->from('t_game_score')
        ->where('gameid', $game_id)
        ->where('user_id', $user_id)
        ->where('hole_id', $hole_id)
        ->where('hindex', $hindex)
        ->get();

      if ($existing->num_rows() > 0) {
        // 存在记录，执行更新
        $this->db->where('gameid', $game_id)
          ->where('user_id', $user_id)
          ->where('hole_id', $hole_id)
          ->where('hindex', $hindex);

        if ($this->db->update('t_game_score', $save_data)) {
          $success_count++;
        } else {
          $error_count++;
        }
      } else {
        // 不存在记录，执行插入
        if ($this->db->insert('t_game_score', $save_data)) {
          $success_count++;
        } else {
          $error_count++;
        }
      }
    }

    return [
      'success_count' => $success_count,
      'error_count' => $error_count,
      'total_processed' => count($scores)
    ];
  }
}
