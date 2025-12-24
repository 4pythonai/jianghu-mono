-- 为 t_game_score 表添加开球方向字段
-- 执行时间: 2024
-- 说明: 用于存储开球方向信息（center/left/right/up/down）

ALTER TABLE `t_game_score` 
ADD COLUMN `tee_shot_direction` char(10) DEFAULT NULL COMMENT '开球方向: center(上球道)/left(拉左)/right(拉右)/up(打穿)/down(打短)' 
AFTER `fairway_hit`;

