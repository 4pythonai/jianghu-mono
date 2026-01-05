
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_course` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `courseid` int DEFAULT '0' COMMENT '球场ID',
  `totalCount` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL COMMENT '球场名',
  `holeNumber` int DEFAULT '0' COMMENT '球洞编号',
  `totalPar` int DEFAULT '0',
  `totalYard` int DEFAULT '0',
  `icon150PictureID` int DEFAULT '0',
  `phoneNumber` int DEFAULT '0' COMMENT '电话号码',
  `dspprc` varchar(100) NOT NULL,
  `dspPrcMemo` varchar(255) DEFAULT NULL COMMENT '消费信息',
  `overallRating` int DEFAULT '0',
  `opStatus` varchar(50) DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT '球场照片缩略图',
  `lat` char(30) DEFAULT NULL,
  `lng` char(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `sLat` varchar(400) DEFAULT NULL,
  `sLgt` varchar(400) DEFAULT NULL,
  `tnum` int DEFAULT '0' COMMENT 'T台数量',
  `courtnum` int NOT NULL COMMENT '半场数量',
  `status` int DEFAULT '0' COMMENT '1为停用',
  PRIMARY KEY (`id`),
  KEY `courseID` (`courseid`,`name`),
  KEY `idx_lat` (`lat`),
  KEY `idx_lgt` (`lng`),
  KEY `idx_courseid` (`courseid`),
  FULLTEXT KEY `ind_cname` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=37527 DEFAULT CHARSET=utf8mb3 COMMENT='球场';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_course_court` (
  `id` int NOT NULL AUTO_INCREMENT,
  `courseid` int DEFAULT '0' COMMENT '球场ID',
  `courtid` int DEFAULT '0' COMMENT '半场ID',
  `courtname` varchar(400) DEFAULT NULL COMMENT '半场名称',
  `bak_field` varchar(400) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courtid` (`courtid`)
) ENGINE=InnoDB AUTO_INCREMENT=67350 DEFAULT CHARSET=utf8mb3 COMMENT='球场对应半场';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_court_hole` (
  `holeid` int NOT NULL AUTO_INCREMENT,
  `courseid` int DEFAULT '0' COMMENT '球场ID',
  `coursename` varchar(400) DEFAULT NULL COMMENT '球场名称',
  `courtid` int DEFAULT '0' COMMENT '半场ID',
  `court_name` varchar(400) DEFAULT NULL,
  `hole_num` int DEFAULT '0',
  `fairwayid` int DEFAULT '0' COMMENT '球道ID',
  `holeno` int DEFAULT '0',
  `holename` varchar(10) DEFAULT NULL COMMENT '球洞标识',
  `par` int DEFAULT '0' COMMENT '标准杆',
  `black` int DEFAULT '0' COMMENT '黑T台',
  `gold` int DEFAULT '0' COMMENT '黄T台',
  `blue` int DEFAULT '0' COMMENT '蓝T台',
  `white` int DEFAULT '0' COMMENT '白T台',
  `red` int DEFAULT '0' COMMENT '红T台',
  `Tnum` int DEFAULT '0' COMMENT 'T台数目',
  `diffindex` int DEFAULT '0',
  `picid` int DEFAULT '0',
  `tips` varchar(4000) DEFAULT NULL,
  PRIMARY KEY (`holeid`),
  KEY `idx_courseid` (`courseid`),
  KEY `idx_holeid` (`holeid`),
  KEY `idx_courtid` (`courtid`)
) ENGINE=InnoDB AUTO_INCREMENT=606130 DEFAULT CHARSET=utf8mb3 COMMENT='半场对应球洞';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_friend` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userid` int DEFAULT '0' COMMENT '用户id',
  `fuserid` int DEFAULT '0' COMMENT '对方id',
  `nickname` varchar(200) DEFAULT NULL COMMENT '备注昵称',
  `ifstar` char(1) NOT NULL DEFAULT 'n' COMMENT '星标好友',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unq_userid_fuserid` (`userid`,`fuserid`),
  UNIQUE KEY `userid` (`userid`,`fuserid`),
  KEY `idx_userid` (`userid`),
  KEY `idx_fuserid` (`fuserid`)
) ENGINE=InnoDB AUTO_INCREMENT=24026540 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_gamble_data_adjust` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `gambleid` int DEFAULT NULL,
  `pid` int DEFAULT NULL,
  `holeid` int DEFAULT NULL,
  `court_key` int DEFAULT NULL,
  `holename` char(20) DEFAULT NULL,
  `uid` int DEFAULT NULL,
  `title` char(10) DEFAULT NULL,
  `valid` tinyint(1) DEFAULT NULL,
  `money_hole` double DEFAULT NULL,
  `money_meat` double DEFAULT NULL,
  `money_guo` double DEFAULT NULL,
  `money` double DEFAULT NULL,
  `score_order` char(10) DEFAULT NULL,
  `debug` char(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_gambleid` (`gambleid`)
) ENGINE=InnoDB AUTO_INCREMENT=783317 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_gamble_game_holeorder` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `gameid` int DEFAULT NULL,
  `groupid` int DEFAULT NULL,
  `holePlayList` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idex-gg` (`gameid`,`groupid`)
) ENGINE=InnoDB AUTO_INCREMENT=348058 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_gamble_rules_user` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键自增长',
  `badScoreBaseLine` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Par+4' COMMENT '8421扣分配置，格式：Par+X、DoublePar+X、NoSub',
  `kpis` json DEFAULT NULL,
  `gambleUserName` char(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '起定义名称',
  `eatingRange` json DEFAULT NULL COMMENT '吃肉范围配置JSON，格式：{"BetterThanBirdie":2,"Birdie":2,"Par":1,"WorseThanPar":0}',
  `RewardConfig` json DEFAULT NULL COMMENT '奖励规则_lasi',
  `creator_id` int DEFAULT NULL COMMENT '创建者ID',
  `gambleSysName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '赌博系统名称',
  `meatValueConfig` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'MEAT_AS_2' COMMENT '肉分值配置，格式：MEAT_AS_X、SINGLE_DOUBLE、CONTINUE_DOUBLE',
  `meatMaxValue` int DEFAULT '1000000' COMMENT '吃肉封顶值',
  `PartnerDutyCondition` char(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '包赋分条件_伙伴的成绩',
  `badScoreMaxLost` int DEFAULT '10000000' COMMENT '最差成绩导致的最大扣分',
  `playersNumber` int NOT NULL DEFAULT '4' COMMENT '参数人数',
  `drawConfig` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Diff_2' COMMENT '8421顶洞配置，格式：NoDraw、Diff_X,  DrawEqual',
  `dutyConfig` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'DUTY_CODITIONAL' COMMENT '包负分配置，格式：NODUTY、DUTY_NEGATIVE、DUTY_CODITIONAL',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `softdeleted` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'n' COMMENT '是否删除',
  PRIMARY KEY (`id`),
  KEY `idx_gambleSysName` (`gambleSysName`)
) ENGINE=InnoDB AUTO_INCREMENT=1344764 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='赌博配置表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_gamble_x_runtime` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键自增长',
  `gameid` int DEFAULT NULL COMMENT 'gameid',
  `userRuleId` int NOT NULL DEFAULT '1' COMMENT 'UserRuleID',
  `bootstrap_order` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '出发顺序JSON，格式：[185,93,160,67]',
  `startHoleindex` int NOT NULL COMMENT '起点',
  `endHoleindex` int NOT NULL COMMENT '终点',
  `roadLength` int DEFAULT NULL COMMENT '起点后几个',
  `holePlayList` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '实际打球顺序',
  `stroking_config` json DEFAULT NULL COMMENT '让杆配置JSON，格式：{"userid":{"对手userid":{"PAR3":1,"PAR4":0.5,"PAR5":0.5}}}',
  `playerIndicatorConfig` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '8421用户加分配置JSON，格式：{"userid":{"Par+2":1,"Par+1":2,"Par":4,"Birdie":8}}',
  `gambleSysName` char(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '规则TAG',
  `gambleUserName` char(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户起名',
  `donationCfg` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '捐锅',
  `ifShow` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'y' COMMENT '是否显示',
  `abstract` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '赌球摘要',
  `groupid` int NOT NULL DEFAULT '1' COMMENT 'group',
  `creator_id` int NOT NULL COMMENT '创建人',
  `playersNumber` int NOT NULL DEFAULT '4' COMMENT '参数人数',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `red_blue_config` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分组配置',
  `attenders` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '参与者JSON，格式：[185,93,160,67]',
  `ranking_tie_resolve_config` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'score.win_loss.reverse_score' COMMENT '排名冲突解决配置',
  `kickConfig` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '踢一脚',
  `bigWind` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'n' COMMENT '大风吹',
  PRIMARY KEY (`id`),
  KEY `fk_gamble_runtime_user_rule` (`userRuleId`)
) ENGINE=InnoDB AUTO_INCREMENT=1344977 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='赌博配置表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `private` char(1) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'n' COMMENT '是否公开 参数为：y/n',
  `is_team_game` char(1) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'n' COMMENT '是否为球队比赛',
  `holeList` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci COMMENT '球序号',
  `creatorid` int NOT NULL DEFAULT '0' COMMENT '创建人',
  `name` varchar(400) DEFAULT NULL COMMENT '比赛名称',
  `courseid` int DEFAULT NULL COMMENT '球场id',
  `teamid` int DEFAULT NULL COMMENT '球队id',
  `privacy_password` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT '' COMMENT '隐私口令',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `scoring_type` char(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'hole' COMMENT '是否 OneBall 赛',
  `match_format` varchar(50) DEFAULT NULL COMMENT '赛制类型: individual_stroke(个人比杆), fourball_best_stroke(四人四球最好成绩比杆), fourball_oneball_stroke(四人四球最佳球位比杆/旺波比杆), foursome_stroke(四人两球比杆), individual_match(个人比洞), fourball_best_match(四人四球最好成绩比洞), fourball_oneball_match(四人四球最佳球位比洞/旺波比洞), foursome_match(四人两球比洞)',
  `entry_fee` decimal(10,2) DEFAULT '0.00' COMMENT '参赛费用（仅展示，不涉及支付）',
  `awards` text COMMENT '奖项设置（纯文本描述）',
  `grouping_permission` char(10) DEFAULT 'admin' COMMENT '分组权限: admin(管理员分组), player(球员自由选择)',
  `is_public` char(1) DEFAULT 'y' COMMENT '是否公开: y(Public任意人可报名), n(Private仅队内人员)',
  `uuid` char(40) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'uuid',
  `open_time` datetime DEFAULT NULL COMMENT '开球时间',
  `status` char(40) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'init' COMMENT '状态',
  `game_status` varchar(20) DEFAULT 'init' COMMENT '赛事状态: init(初始), registering(报名中), registration_closed(报名截止), playing(进行中), finished(已结束), cancelled(已取消)',
  `top_n_ranking` int DEFAULT NULL COMMENT '取前N名成绩排行（团队赛制用）',
  `remark` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT '' COMMENT '备注',
  `team_game_title` char(200) DEFAULT NULL COMMENT '比赛标题',
  `team_id` int DEFAULT NULL COMMENT '球队ID',
  PRIMARY KEY (`id`),
  KEY `idx_addid` (`creatorid`),
  KEY `idx_gamestate_privacy` (`private`),
  KEY `idx_name` (`name`(255)),
  KEY `idx_courseid` (`courseid`),
  KEY `idx_teamid` (`teamid`),
  KEY `idx_courseid_gamestate` (`courseid`),
  KEY `idx_courseid_gamestate_createtime` (`courseid`,`create_time`),
  KEY `idx_courseid_gamestate_gameid` (`courseid`,`id`),
  KEY `idx_match_format` (`match_format`),
  KEY `idx_game_status` (`game_status`),
  KEY `idx_is_public` (`is_public`),
  FULLTEXT KEY `fulltext_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1339184 DEFAULT CHARSET=utf8mb3 COMMENT='比赛表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_court` (
  `id` int NOT NULL AUTO_INCREMENT,
  `gameid` int DEFAULT '0' COMMENT '比赛id',
  `courtid` int DEFAULT NULL COMMENT '半场id',
  `court_key` int DEFAULT NULL COMMENT '半场标识',
  `uuid` char(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_gameid` (`gameid`),
  KEY `idx_courtid` (`courtid`)
) ENGINE=InnoDB AUTO_INCREMENT=475 DEFAULT CHARSET=utf8mb3 COMMENT='比赛半场表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_group` (
  `groupid` int NOT NULL AUTO_INCREMENT,
  `gameid` int NOT NULL DEFAULT '0',
  `group_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `group_create_time` datetime DEFAULT NULL,
  `group_start_status` char(30) NOT NULL DEFAULT '0',
  `group_all_confirmed` int DEFAULT NULL,
  `firstholeindex` int DEFAULT NULL,
  `first_record_hole_index` int DEFAULT NULL,
  `first_record_court_index` int DEFAULT NULL,
  PRIMARY KEY (`groupid`),
  KEY `idx_gameid` (`gameid`),
  KEY `idx_groupid` (`groupid`)
) ENGINE=InnoDB AUTO_INCREMENT=846 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_group_user` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `gameid` int DEFAULT '0' COMMENT '比赛id',
  `groupid` int DEFAULT '0' COMMENT '分组id',
  `subteam_id` int DEFAULT NULL COMMENT '所属分队ID',
  `userid` int DEFAULT '0' COMMENT '人员id',
  `tee` char(5) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT 'T台 参数为：BLACK,GOLD,BLUE,WHITE,RED',
  `confirmed` int DEFAULT NULL COMMENT '是否确认 参数：0,1',
  `confirmed_time` datetime DEFAULT NULL COMMENT '确认时间',
  `addtime` datetime DEFAULT NULL,
  `join_type` char(40) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT '加入方式',
  PRIMARY KEY (`id`),
  UNIQUE KEY `gameid` (`gameid`,`userid`),
  KEY `idx_gameid` (`gameid`),
  KEY `idx_grpid` (`groupid`),
  KEY `idx_userid` (`userid`),
  KEY `idx_userid_gameid` (`userid`,`gameid`),
  KEY `idx_subteam_id` (`subteam_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1010 DEFAULT CHARSET=utf8mb3 COMMENT='比赛人员表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_interaction` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `game_id` int unsigned NOT NULL,
  `user_id` int NOT NULL,
  `type` tinyint NOT NULL COMMENT '1=点赞 2=评论',
  `content` varchar(1000) DEFAULT NULL COMMENT '评论内容',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '1=正常 0=删除',
  PRIMARY KEY (`id`),
  KEY `idx_game` (`game_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_interaction_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_interaction_user` FOREIGN KEY (`user_id`) REFERENCES `t_user2` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='比赛互动';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_match_hole_detail` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `match_result_id` int unsigned NOT NULL COMMENT '对抗结果ID',
  `game_id` int unsigned NOT NULL COMMENT '比赛ID',
  `group_id` int NOT NULL COMMENT '分组ID',
  `hole_id` int NOT NULL COMMENT '洞ID',
  `hole_index` int NOT NULL COMMENT '洞序号(1-18)',
  `up_score` int DEFAULT NULL COMMENT '计分卡上方成绩（团队赛为团队成绩）',
  `down_score` int DEFAULT NULL COMMENT '计分卡下方成绩（团队赛为团队成绩）',
  `hole_winner` varchar(10) DEFAULT NULL COMMENT '本洞获胜方: up/down/halved(平)',
  `running_status` varchar(10) DEFAULT NULL COMMENT '累计状态: AS/1UP/2UP.../1DN/2DN...',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_match_hole` (`match_result_id`,`hole_index`),
  KEY `idx_match_result_id` (`match_result_id`),
  KEY `idx_game_id` (`game_id`),
  KEY `idx_hole_id` (`hole_id`),
  CONSTRAINT `fk_hole_detail_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_hole_detail_hole` FOREIGN KEY (`hole_id`) REFERENCES `t_court_hole` (`holeid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_hole_detail_match` FOREIGN KEY (`match_result_id`) REFERENCES `t_game_match_result` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='比洞赛每洞对抗详情表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_match_result` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `game_id` int unsigned NOT NULL COMMENT '比赛ID',
  `group_id` int NOT NULL COMMENT '分组ID',
  `hole_id` int DEFAULT NULL COMMENT '当前洞ID（记录进度）',
  `holes_played` int DEFAULT '0' COMMENT '已完成洞数',
  `holes_remaining` int DEFAULT '18' COMMENT '剩余洞数',
  `up_side` varchar(10) DEFAULT NULL COMMENT '领先方: up(计分卡上方), down(计分卡下方), null(平局)',
  `lead_holes` int DEFAULT '0' COMMENT '领先洞数',
  `result_code` varchar(10) DEFAULT NULL COMMENT '比赛结果代码: AS(平局), 1UP/2UP...(上方胜), 1DN/2DN...(下方胜), 3&2(提前结束格式)',
  `status` varchar(20) DEFAULT 'playing' COMMENT '状态: playing(进行中), finished(已结束)',
  `winner_side` varchar(10) DEFAULT NULL COMMENT '获胜方: up/down/draw',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_game_group` (`game_id`,`group_id`),
  KEY `idx_game_id` (`game_id`),
  KEY `idx_group_id` (`group_id`),
  CONSTRAINT `fk_match_result_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_match_result_group` FOREIGN KEY (`group_id`) REFERENCES `t_game_group` (`groupid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='比洞赛对抗结果表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_registration` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `game_id` int unsigned NOT NULL COMMENT '比赛ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `subteam_id` int unsigned DEFAULT NULL COMMENT '选择的分队ID（团队赛制时）',
  `status` varchar(20) DEFAULT 'pending' COMMENT '报名状态: pending(待审核), approved(已通过), rejected(已拒绝), cancelled(已取消)',
  `is_team_member` char(1) DEFAULT 'n' COMMENT '是否球队成员: y/n',
  `apply_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
  `review_time` datetime DEFAULT NULL COMMENT '审核时间',
  `reviewer_id` int DEFAULT NULL COMMENT '审核人ID',
  `reject_reason` varchar(200) DEFAULT NULL COMMENT '拒绝原因',
  `remark` varchar(500) DEFAULT NULL COMMENT '报名备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_game_user` (`game_id`,`user_id`),
  KEY `idx_game_id` (`game_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_subteam_id` (`subteam_id`),
  CONSTRAINT `fk_registration_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_registration_subteam` FOREIGN KEY (`subteam_id`) REFERENCES `t_game_subteam` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_registration_user` FOREIGN KEY (`user_id`) REFERENCES `t_user2` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='赛事报名表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_score` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `gameid` int unsigned NOT NULL,
  `user_id` int NOT NULL,
  `group_id` int DEFAULT NULL,
  `hole_id` int NOT NULL,
  `court_key` int DEFAULT NULL COMMENT '半场序',
  `hindex` int DEFAULT NULL COMMENT 'hindex',
  `userid` int DEFAULT NULL COMMENT 'userid',
  `score` tinyint NOT NULL COMMENT '杆数',
  `putts` tinyint DEFAULT NULL COMMENT '推杆数',
  `penalty_strokes` tinyint DEFAULT NULL COMMENT '罚杆',
  `sand_save` tinyint DEFAULT NULL COMMENT '沙坑救球 1/0',
  `gir` tinyint DEFAULT NULL COMMENT '标准杆上果岭 1/0',
  `fairway_hit` tinyint DEFAULT NULL COMMENT '球道命中 1/0',
  `tee_shot_direction` char(10) DEFAULT NULL COMMENT '开球方向: center(上球道)/left(拉左)/right(拉右)/long(打穿)/short(打短)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `recorder_type` char(10) DEFAULT NULL COMMENT '记录者类型',
  `gross` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gameid` (`gameid`,`user_id`,`hole_id`,`hindex`),
  KEY `idx_game_user` (`gameid`,`user_id`),
  KEY `fk_score_user` (`user_id`),
  KEY `fk_score_hole` (`hole_id`),
  KEY `fk_score_userid` (`userid`),
  CONSTRAINT `fk_score_game` FOREIGN KEY (`gameid`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_score_hole` FOREIGN KEY (`hole_id`) REFERENCES `t_court_hole` (`holeid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_score_userid` FOREIGN KEY (`userid`) REFERENCES `t_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=420 DEFAULT CHARSET=utf8mb3 COMMENT='比赛每洞成绩';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_subteam` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `game_id` int unsigned NOT NULL COMMENT '比赛ID',
  `subteam_name` varchar(100) NOT NULL COMMENT '分队名称（如：东邪队、西毒队）',
  `subteam_order` int DEFAULT '1' COMMENT '分队排序',
  `color` varchar(20) DEFAULT NULL COMMENT '分队颜色标识',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_game_id` (`game_id`),
  CONSTRAINT `fk_subteam_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='队内赛分队表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_subteam_member` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `subteam_id` int unsigned NOT NULL COMMENT '分队ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `game_id` int unsigned NOT NULL COMMENT '比赛ID（冗余，便于查询）',
  `join_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subteam_user` (`subteam_id`,`user_id`),
  UNIQUE KEY `uk_game_user` (`game_id`,`user_id`),
  KEY `idx_subteam_id` (`subteam_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_game_id` (`game_id`),
  CONSTRAINT `fk_subteam_member_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_subteam_member_subteam` FOREIGN KEY (`subteam_id`) REFERENCES `t_game_subteam` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_subteam_member_user` FOREIGN KEY (`user_id`) REFERENCES `t_user2` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='分队成员表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_subteam_score` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `game_id` int unsigned NOT NULL COMMENT '比赛ID',
  `subteam_id` int unsigned NOT NULL COMMENT '分队ID',
  `total_stroke` int DEFAULT '0' COMMENT '总杆数（比杆赛）',
  `total_net_stroke` int DEFAULT '0' COMMENT '总净杆数',
  `match_wins` int DEFAULT '0' COMMENT '赢洞数（比洞赛）',
  `match_losses` int DEFAULT '0' COMMENT '输洞数（比洞赛）',
  `match_halves` int DEFAULT '0' COMMENT '平洞数（比洞赛）',
  `ranking` int DEFAULT NULL COMMENT '排名',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_game_subteam` (`game_id`,`subteam_id`),
  KEY `idx_game_id` (`game_id`),
  KEY `idx_subteam_id` (`subteam_id`),
  CONSTRAINT `fk_subteam_score_game` FOREIGN KEY (`game_id`) REFERENCES `t_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_subteam_score_subteam` FOREIGN KEY (`subteam_id`) REFERENCES `t_game_subteam` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='队内赛分队总成绩表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_watchlist` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `gameid` int DEFAULT NULL,
  `userid` int DEFAULT NULL,
  `addtime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_my_stared_games` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `userid` int NOT NULL,
  `gameid` int NOT NULL,
  `addtime` datetime DEFAULT NULL,
  `memo` char(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_private_white_list` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `gameid` int DEFAULT NULL COMMENT '球局id',
  `userid` int DEFAULT NULL COMMENT '用户id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_team` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `team_name` char(200) DEFAULT NULL COMMENT '球队名称',
  `team_avatar` varchar(255) DEFAULT NULL COMMENT '球队logo',
  `create_date` datetime DEFAULT NULL COMMENT '创建时间',
  `creator` int DEFAULT NULL COMMENT '创建者',
  `sologan` text COMMENT '口号',
  `description` text COMMENT '球队简介',
  `status` char(10) DEFAULT 'active' COMMENT '状态: active(活跃), inactive(停用)',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_team_member` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `team_id` int unsigned NOT NULL COMMENT '球队ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `role` varchar(20) DEFAULT 'member' COMMENT '角色: owner(队长), admin(管理员), member(成员)',
  `status` varchar(20) DEFAULT 'active' COMMENT '状态: active(正常), inactive(停用), pending(待审核)',
  `join_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_user` (`team_id`,`user_id`),
  KEY `idx_team_id` (`team_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_team_member_team` FOREIGN KEY (`team_id`) REFERENCES `t_team` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_team_member_user` FOREIGN KEY (`user_id`) REFERENCES `t_user2` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='球队成员表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openid` char(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `unionid` char(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `mobile` varchar(40) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT '' COMMENT '手机号',
  `wx_nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '微信昵称',
  `nickname` char(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '昵称',
  `reg_type` char(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'weixin' COMMENT 'weixin,remark,remarkwithmobile,jhtransfer',
  `addtime` datetime DEFAULT NULL COMMENT '添加时间',
  `handicap` double(10,1) DEFAULT NULL COMMENT '差点',
  `helper_id` int DEFAULT NULL COMMENT '添加人的ID',
  `can_mobile_search` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'y' COMMENT '手机号是否可以被搜索',
  `access_token` char(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `avatar` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '个人头像路径',
  `sex` char(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'man' COMMENT '性别',
  PRIMARY KEY (`id`),
  KEY `idx_telephone` (`mobile`),
  KEY `index_nickname` (`wx_nickname`)
) ENGINE=InnoDB AUTO_INCREMENT=837778 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_user2` (
  `id` int NOT NULL AUTO_INCREMENT,
  `avatar` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '个人头像路径',
  `mobile` varchar(40) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT '' COMMENT '手机号',
  `wx_nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '微信昵称',
  `openid` char(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `unionid` char(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `reg_type` char(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'weixin' COMMENT 'weixin,remark,remarkwithmobile,jhtransfer',
  `nickname` char(100) DEFAULT NULL COMMENT '昵称',
  `addtime` datetime DEFAULT NULL COMMENT '添加时间',
  `handicap` double(10,1) DEFAULT NULL COMMENT '差点',
  `helper_id` int DEFAULT NULL COMMENT '添加人的ID',
  `can_mobile_search` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'y' COMMENT '手机号是否可以被搜索',
  `access_token` char(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `sex` char(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'man' COMMENT '性别',
  PRIMARY KEY (`id`),
  UNIQUE KEY `openid` (`openid`),
  KEY `idx_telephone` (`mobile`),
  KEY `index_nickname` (`wx_nickname`)
) ENGINE=InnoDB AUTO_INCREMENT=837823 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

