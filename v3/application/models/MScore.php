<?php

class MScore  extends CI_Model {

  public function __construct() {
    parent::__construct();
  }



  // gameId: "1338043"
  // groupId: "108"
  // holeUniqueKey: "1_19"
  // scores: Array(4)
  // 0:
  // userid:10,
  // penalty_strokes: 0
  // putts: 2
  // sand_save: 0
  // score: 4

  /**
   * 
  CREATE TABLE `t_game_score` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `game_id` int unsigned NOT NULL,
  `user_id` int NOT NULL,
  `group_id` int DEFAULT NULL,
  `hole_id` int NOT NULL,
  `score` tinyint NOT NULL COMMENT '杆数',
  `putts` tinyint DEFAULT NULL COMMENT '推杆数',
  `penalty_strokes` tinyint DEFAULT NULL COMMENT '罚杆',
  `sand_save` tinyint DEFAULT NULL COMMENT '沙坑救球 1/0',
  `gir` tinyint DEFAULT NULL COMMENT '标准杆上果岭 1/0',
  `fairway_hit` tinyint DEFAULT NULL COMMENT '球道命中 1/0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `recorder_type` char(10) DEFAULT NULL COMMENT '记录者类型',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_game_user_hole` (`game_id`,`user_id`,`hole_id`),
  KEY `idx_game_user` (`game_id`,`user_id`),
  KEY `fk_score_user` (`user_id`),
  KEY `fk_score_hole` (`hole_id`),
  CONSTRAINT `fk_score_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_score_hole` FOREIGN KEY (`hole_id`) REFERENCES `t_court_hole` (`holeid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_score_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='比赛每洞成绩';
   */









  public function saveScore($game_id, $group_id, $hole_unique_key, $scores) {
    // 从 holeUniqueKey 中解析出 hole_id (格式: "1_19" -> 19)
    $hole_id = explode('_', $hole_unique_key)[1];

    $success_count = 0;
    $error_count = 0;

    // 遍历每个用户的成绩
    foreach ($scores as $score_data) {
      $user_id = $score_data['userid'];

      // 准备要保存的数据
      $save_data = [
        'game_id' => $game_id,
        'user_id' => $user_id,
        'group_id' => $group_id,
        'hole_id' => $hole_id,
        'score' => $score_data['score'],
        'putts' => isset($score_data['putts']) ? $score_data['putts'] : null,
        'penalty_strokes' => isset($score_data['penalty_strokes']) ? $score_data['penalty_strokes'] : null,
        'sand_save' => isset($score_data['sand_save']) ? $score_data['sand_save'] : null,
        'gir' => isset($score_data['gir']) ? $score_data['gir'] : null,
        'fairway_hit' => isset($score_data['fairway_hit']) ? $score_data['fairway_hit'] : null,
        'recorder_type' => 'app'
      ];

      // 检查是否已存在记录（基于唯一约束：game_id, user_id, hole_id）
      $existing = $this->db->select('id')
        ->from('t_game_score')
        ->where('game_id', $game_id)
        ->where('user_id', $user_id)
        ->where('hole_id', $hole_id)
        ->get();

      if ($existing->num_rows() > 0) {
        // 存在记录，执行更新
        $this->db->where('game_id', $game_id)
          ->where('user_id', $user_id)
          ->where('hole_id', $hole_id);

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
