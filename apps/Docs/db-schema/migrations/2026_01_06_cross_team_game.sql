-- 队际赛功能数据库迁移
-- 执行日期: 2026-01-06

-- ============================================================
-- 1. 创建队际赛参赛球队表
-- ============================================================
CREATE TABLE IF NOT EXISTS `t_game_cross_team` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `game_id` INT UNSIGNED NOT NULL COMMENT '赛事ID',
    `team_id` INT UNSIGNED NOT NULL COMMENT '球队ID',
    `team_alias` VARCHAR(100) DEFAULT NULL COMMENT '球队简称（本赛事中显示，默认为球队全称）',
    `team_order` INT DEFAULT 1 COMMENT '球队排序',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_game_team` (`game_id`, `team_id`),
    KEY `idx_game_id` (`game_id`),
    KEY `idx_team_id` (`team_id`),
    CONSTRAINT `fk_cross_team_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_cross_team_team` FOREIGN KEY (`team_id`) REFERENCES `t_team` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='队际赛参赛球队表';

-- ============================================================
-- 2. 修改 t_game_registration 表，添加 cross_team_id 字段
-- ============================================================
ALTER TABLE `t_game_registration`
    ADD COLUMN `cross_team_id` INT UNSIGNED DEFAULT NULL COMMENT '队际赛报名球队ID（选择代表哪个球队）' AFTER `tag_id`,
    ADD KEY `idx_cross_team_id` (`cross_team_id`);

-- ============================================================
-- 3. 修改 t_game_group_user 表，添加 cross_team_id 字段
-- ============================================================
ALTER TABLE `t_game_group_user`
    ADD COLUMN `cross_team_id` INT UNSIGNED DEFAULT NULL COMMENT '队际赛所属球队ID' AFTER `tag_id`,
    ADD KEY `idx_cross_team_id` (`cross_team_id`);

-- ============================================================
-- 验证迁移结果
-- ============================================================
-- SELECT * FROM information_schema.tables WHERE table_name = 't_game_cross_team';
-- DESCRIBE t_game_registration;
-- DESCRIBE t_game_group_user;
