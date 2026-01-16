<?php

class MScore  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }



  public function saveScore($game_id, $group_id, $hole_unique_key, $hindex, $scores) {
    list($court_key, $hole_id) = explode('_', $hole_unique_key);

    $success_count = 0;
    $error_count = 0;

    foreach ($scores as $score_data) {
      $save_data = $this->buildScoreData($game_id, $group_id, $hole_id, $court_key, $hindex, $score_data);
      $is_success = $this->upsertScore($game_id, $save_data['user_id'], $hole_id, $hindex, $save_data);
      $is_success ? $success_count++ : $error_count++;
    }

    return [
      'success_count' => $success_count,
      'error_count' => $error_count,
      'total_processed' => count($scores)
    ];
  }

  private function buildScoreData($game_id, $group_id, $hole_id, $court_key, $hindex, $score_data) {
    $user_id = $score_data['user_id'];

    return [
      'gameid' => $game_id,
      'user_id' => $user_id,
      'hindex' => $hindex,
      'user_id' => $user_id,
      'group_id' => $group_id,
      'hole_id' => $hole_id,
      'court_key' => $court_key,
      'score' => $score_data['score'],
      'putts' => $score_data['putts'] ?? null,
      'penalty_strokes' => $score_data['penalty_strokes'] ?? null,
      'sand_save' => $score_data['sand_save'] ?? null,
      'gir' => $score_data['gir'] ?? null,
      'fairway_hit' => $score_data['fairway_hit'] ?? null,
      'tee_shot_direction' => $score_data['tee_shot_direction'] ?? null,
      'par' => $score_data['par'] ?? null,
      'recorder_type' => 'app'
    ];
  }

  private function upsertScore($game_id, $user_id, $hole_id, $hindex, $save_data) {

    $where_conditions = [
      'gameid' => $game_id,
      'user_id' => $user_id,
      'hole_id' => $hole_id,
      'hindex' => $hindex
    ];

    $exists = $this->db->select('id')
      ->from('t_game_score')
      ->where($where_conditions)
      ->get()
      ->num_rows() > 0;

    if ($exists) {
      debug("update");
      debug($save_data);
      return $this->db->where($where_conditions)->update('t_game_score', $save_data);
    }

    return $this->db->insert('t_game_score', $save_data);
  }
}
