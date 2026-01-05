# 队内赛功能 - 数据库变更脚本

根据 `6_赛事创建-队内赛.md` 需求文档设计。

## 需求分析

根据队内赛文档，需要支持：
1. **8种赛制**：个人比杆/比洞、四人四球最好成绩比杆/比洞、四人四球最佳球位(旺波)比杆/比洞、四人两球比杆/比洞
2. **分队（Sub-team）**：临时对抗阵营，可自定义名称
3. **赛事状态流转**：报名中→报名截止→进行中→已结束/已取消
4. **分组权限**：管理员分组 / 球员自由选择
5. **报名审批**：非队员需审批

---

## Part 1: ALTER 语句 - 修改现有表

### 1.1 修改 t_game 表，增加队内赛相关字段

```sql
ALTER TABLE `t_game`
    ADD COLUMN `match_format` VARCHAR(50) DEFAULT NULL COMMENT '赛制类型: individual_stroke(个人比杆), fourball_best_stroke(四人四球最好成绩比杆), fourball_oneball_stroke(四人四球最佳球位比杆/旺波比杆), foursome_stroke(四人两球比杆), individual_match(个人比洞), fourball_best_match(四人四球最好成绩比洞), fourball_oneball_match(四人四球最佳球位比洞/旺波比洞), foursome_match(四人两球比洞)' AFTER `scoring_type`,
    ADD COLUMN `entry_fee` DECIMAL(10,2) DEFAULT 0 COMMENT '参赛费用（仅展示，不涉及支付）' AFTER `match_format`,
    ADD COLUMN `awards` TEXT DEFAULT NULL COMMENT '奖项设置（纯文本描述）' AFTER `entry_fee`,
    ADD COLUMN `grouping_permission` CHAR(10) DEFAULT 'admin' COMMENT '分组权限: admin(管理员分组), player(球员自由选择)' AFTER `awards`,
    ADD COLUMN `is_public` CHAR(1) DEFAULT 'y' COMMENT '是否公开: y(Public任意人可报名), n(Private仅队内人员)' AFTER `grouping_permission`,
    ADD COLUMN `game_status` VARCHAR(20) DEFAULT 'init' COMMENT '赛事状态: init(初始), registering(报名中), registration_closed(报名截止), playing(进行中), finished(已结束), cancelled(已取消)' AFTER `status`,
    ADD COLUMN `top_n_ranking` INT DEFAULT NULL COMMENT '取前N名成绩排行（团队赛制用）' AFTER `game_status`;
```

### 1.2 为 t_game 表添加索引

```sql
ALTER TABLE `t_game`
    ADD INDEX `idx_match_format` (`match_format`),
    ADD INDEX `idx_game_status` (`game_status`),
    ADD INDEX `idx_is_public` (`is_public`);
```

### 1.3 修改 t_team 表，增加必要字段

```sql
ALTER TABLE `t_team`
    ADD COLUMN `description` TEXT DEFAULT NULL COMMENT '球队简介' AFTER `sologan`,
    ADD COLUMN `status` CHAR(10) DEFAULT 'active' COMMENT '状态: active(活跃), inactive(停用)' AFTER `description`,
    ADD COLUMN `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `status`;
```

### 1.4 修改 t_game_group_user 表，增加分队关联

```sql
ALTER TABLE `t_game_group_user`
    ADD COLUMN `subteam_id` INT DEFAULT NULL COMMENT '所属分队ID' AFTER `groupid`,
    ADD INDEX `idx_subteam_id` (`subteam_id`);
```

---

## Part 2: CREATE 语句 - 创建新表

### 2.1 球队成员表

```sql
CREATE TABLE `t_team_member` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `team_id` INT UNSIGNED NOT NULL COMMENT '球队ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `role` VARCHAR(20) DEFAULT 'member' COMMENT '角色: owner(队长), admin(管理员), member(成员)',
    `status` VARCHAR(20) DEFAULT 'active' COMMENT '状态: active(正常), inactive(停用), pending(待审核)',
    `join_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_team_member_team` FOREIGN KEY (`team_id`) REFERENCES `t_team` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_team_member_user` FOREIGN KEY (`user_id`) REFERENCES `t_user2` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='球队成员表';
```

### 2.2 队内赛分队表 (Sub-team)

```sql
CREATE TABLE `t_game_subteam` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `game_id` INT UNSIGNED NOT NULL COMMENT '比赛ID',
    `subteam_name` VARCHAR(100) NOT NULL COMMENT '分队名称（如：东邪队、西毒队）',
    `subteam_order` INT DEFAULT 1 COMMENT '分队排序',
    `color` VARCHAR(20) DEFAULT NULL COMMENT '分队颜色标识',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_game_id` (`game_id`),
    CONSTRAINT `fk_subteam_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='队内赛分队表';
```

### 2.3 分队成员表

```sql
CREATE TABLE `t_game_subteam_member` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `subteam_id` INT UNSIGNED NOT NULL COMMENT '分队ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `game_id` INT UNSIGNED NOT NULL COMMENT '比赛ID（冗余，便于查询）',
    `join_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_subteam_user` (`subteam_id`, `user_id`),
    UNIQUE KEY `uk_game_user` (`game_id`, `user_id`),
    KEY `idx_subteam_id` (`subteam_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_game_id` (`game_id`),
    CONSTRAINT `fk_subteam_member_subteam` FOREIGN KEY (`subteam_id`) REFERENCES `t_game_subteam` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_subteam_member_user` FOREIGN KEY (`user_id`) REFERENCES `t_user2` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_subteam_member_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='分队成员表';
```

### 2.4 赛事报名表

```sql
CREATE TABLE `t_game_registration` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `game_id` INT UNSIGNED NOT NULL COMMENT '比赛ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `subteam_id` INT UNSIGNED DEFAULT NULL COMMENT '选择的分队ID（团队赛制时）',
    `status` VARCHAR(20) DEFAULT 'pending' COMMENT '报名状态: pending(待审核), approved(已通过), rejected(已拒绝), cancelled(已取消)',
    `is_team_member` CHAR(1) DEFAULT 'n' COMMENT '是否球队成员: y/n',
    `apply_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    `review_time` DATETIME DEFAULT NULL COMMENT '审核时间',
    `reviewer_id` INT DEFAULT NULL COMMENT '审核人ID',
    `reject_reason` VARCHAR(200) DEFAULT NULL COMMENT '拒绝原因',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '报名备注',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_game_user` (`game_id`, `user_id`),
    KEY `idx_game_id` (`game_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_subteam_id` (`subteam_id`),
    CONSTRAINT `fk_registration_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_registration_user` FOREIGN KEY (`user_id`) REFERENCES `t_user2` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_registration_subteam` FOREIGN KEY (`subteam_id`) REFERENCES `t_game_subteam` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='赛事报名表';
```

### 2.5 比洞赛对抗结果表（组内对抗）

```sql
CREATE TABLE `t_game_match_result` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `game_id` INT UNSIGNED NOT NULL COMMENT '比赛ID',
    `group_id` INT NOT NULL COMMENT '分组ID',
    `hole_id` INT DEFAULT NULL COMMENT '当前洞ID（记录进度）',
    `holes_played` INT DEFAULT 0 COMMENT '已完成洞数',
    `holes_remaining` INT DEFAULT 18 COMMENT '剩余洞数',
    `up_side` VARCHAR(10) DEFAULT NULL COMMENT '领先方: up(计分卡上方), down(计分卡下方), null(平局)',
    `lead_holes` INT DEFAULT 0 COMMENT '领先洞数',
    `result_code` VARCHAR(10) DEFAULT NULL COMMENT '比赛结果代码: AS(平局), 1UP/2UP...(上方胜), 1DN/2DN...(下方胜), 3&2(提前结束格式)',
    `status` VARCHAR(20) DEFAULT 'playing' COMMENT '状态: playing(进行中), finished(已结束)',
    `winner_side` VARCHAR(10) DEFAULT NULL COMMENT '获胜方: up/down/draw',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_game_group` (`game_id`, `group_id`),
    KEY `idx_game_id` (`game_id`),
    KEY `idx_group_id` (`group_id`),
    CONSTRAINT `fk_match_result_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_match_result_group` FOREIGN KEY (`group_id`) REFERENCES `t_game_group` (`groupid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='比洞赛对抗结果表';
```

### 2.6 比洞赛每洞对抗详情表

```sql
CREATE TABLE `t_game_match_hole_detail` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `match_result_id` INT UNSIGNED NOT NULL COMMENT '对抗结果ID',
    `game_id` INT UNSIGNED NOT NULL COMMENT '比赛ID',
    `group_id` INT NOT NULL COMMENT '分组ID',
    `hole_id` INT NOT NULL COMMENT '洞ID',
    `hole_index` INT NOT NULL COMMENT '洞序号(1-18)',
    `up_score` INT DEFAULT NULL COMMENT '计分卡上方成绩（团队赛为团队成绩）',
    `down_score` INT DEFAULT NULL COMMENT '计分卡下方成绩（团队赛为团队成绩）',
    `hole_winner` VARCHAR(10) DEFAULT NULL COMMENT '本洞获胜方: up/down/halved(平)',
    `running_status` VARCHAR(10) DEFAULT NULL COMMENT '累计状态: AS/1UP/2UP.../1DN/2DN...',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_match_hole` (`match_result_id`, `hole_index`),
    KEY `idx_match_result_id` (`match_result_id`),
    KEY `idx_game_id` (`game_id`),
    KEY `idx_hole_id` (`hole_id`),
    CONSTRAINT `fk_hole_detail_match` FOREIGN KEY (`match_result_id`) REFERENCES `t_game_match_result` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_hole_detail_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_hole_detail_hole` FOREIGN KEY (`hole_id`) REFERENCES `t_court_hole` (`holeid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='比洞赛每洞对抗详情表';
```

### 2.7 队内赛分队总成绩表

```sql
CREATE TABLE `t_game_subteam_score` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `game_id` INT UNSIGNED NOT NULL COMMENT '比赛ID',
    `subteam_id` INT UNSIGNED NOT NULL COMMENT '分队ID',
    `total_stroke` INT DEFAULT 0 COMMENT '总杆数（比杆赛）',
    `total_net_stroke` INT DEFAULT 0 COMMENT '总净杆数',
    `match_wins` INT DEFAULT 0 COMMENT '赢洞数（比洞赛）',
    `match_losses` INT DEFAULT 0 COMMENT '输洞数（比洞赛）',
    `match_halves` INT DEFAULT 0 COMMENT '平洞数（比洞赛）',
    `ranking` INT DEFAULT NULL COMMENT '排名',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_game_subteam` (`game_id`, `subteam_id`),
    KEY `idx_game_id` (`game_id`),
    KEY `idx_subteam_id` (`subteam_id`),
    CONSTRAINT `fk_subteam_score_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_subteam_score_subteam` FOREIGN KEY (`subteam_id`) REFERENCES `t_game_subteam` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='队内赛分队总成绩表';
```

---

## Part 3: 枚举值参考

### match_format 赛制类型

| 值 | 中文名称 | 大类 | 分队要求 | 分组规则 |
|---|---|---|---|---|
| individual_stroke | 个人比杆赛 | 比杆赛 | 可选 | 随意安排 |
| fourball_best_stroke | 四人四球最好成绩比杆赛 | 比杆赛 | 必须 | 1v1/1v2/2v1/2v2 |
| fourball_oneball_stroke | 四人四球最佳球位比杆赛(旺波比杆) | 比杆赛 | 必须 | 1v1/1v2/2v1/2v2 |
| foursome_stroke | 四人两球比杆赛 | 比杆赛 | 必须 | 必须2v2 |
| individual_match | 个人比洞赛 | 比洞赛 | 可选 | 每组2人1v1 |
| fourball_best_match | 四人四球最好成绩比洞赛 | 比洞赛 | 必须 | 1v1/1v2/2v1/2v2 |
| fourball_oneball_match | 四人四球最佳球位比洞赛(旺波比洞) | 比洞赛 | 必须 | 1v1/1v2/2v1/2v2 |
| foursome_match | 四人两球比洞赛 | 比洞赛 | 必须 | 必须2v2 |

### game_status 赛事状态

| 值 | 中文名称 |
|---|---|
| init | 初始 |
| registering | 报名中 |
| registration_closed | 报名截止 |
| playing | 进行中 |
| finished | 已结束 |
| cancelled | 已取消 |

---

## Part 4: 表结构关系图

```
t_team (球队)
    ↓ 1:N
t_team_member (球队成员)
    ↓
t_user2 (用户)

t_game (比赛/赛事)
    ├── 1:N → t_game_subteam (分队)
    │              ↓ 1:N
    │         t_game_subteam_member (分队成员)
    │              ↓ 1:1
    │         t_game_subteam_score (分队成绩)
    │
    ├── 1:N → t_game_registration (报名)
    │
    ├── 1:N → t_game_group (分组)
    │              ↓ 1:N
    │         t_game_group_user (分组成员，已增加subteam_id)
    │
    └── 1:N → t_game_match_result (比洞赛对抗结果)
                   ↓ 1:N
              t_game_match_hole_detail (每洞对抗详情)
```
