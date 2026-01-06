-- ============================================
-- 迁移脚本: is_team_game -> game_type
-- 日期: 2026-01-06
-- 说明: 将 is_team_game(y/n) 改为 game_type(common/single_team/cross_teams)
-- ============================================

-- 1. 添加 game_type 字段
ALTER TABLE t_game ADD COLUMN game_type VARCHAR(20) DEFAULT 'common' 
  COMMENT '比赛类型: common(普通比赛), single_team(队内赛), cross_teams(队际赛)';

-- 2. 迁移现有数据
UPDATE t_game SET game_type = 'single_team' WHERE is_team_game = 'y';
UPDATE t_game SET game_type = 'common' WHERE is_team_game = 'n' OR is_team_game IS NULL;

-- 3. 添加索引
CREATE INDEX idx_game_type ON t_game(game_type);

-- 4. 删除旧字段 (确认数据迁移完成后执行)
ALTER TABLE t_game DROP COLUMN is_team_game;

-- 验证迁移结果
-- SELECT game_type, COUNT(*) FROM t_game GROUP BY game_type;

