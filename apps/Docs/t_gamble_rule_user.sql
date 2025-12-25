CREATE TABLE `t_gamble_rule_user` (
    `id` int NOT NULL AUTO_INCREMENT COMMENT '主键自增长',
    `creator_id` int DEFAULT NULL COMMENT '创建者ID',
    `gambleSysName` varchar(50) NOT NULL COMMENT '赌博系统名称',
    `gambleUserName` char(200) DEFAULT NULL COMMENT '起定义名称',
    `playersNumber` int NOT NULL DEFAULT '4' COMMENT '参数人数',
    `sub8421_config_string` varchar(50) DEFAULT 'Par+4' COMMENT '8421扣分配置，格式：Par+X、DoublePar+X、NoSub',
    `max8421_sub_value` int DEFAULT '10000000' COMMENT '8421扣分封顶值',
    `draw8421_config` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Diff_2' COMMENT '8421顶洞配置，格式：NoDraw、Diff_X,  DrawEqual',
    `eating_range` text COMMENT '吃肉范围配置JSON，格式：{"BetterThanBirdie":2,"Birdie":2,"Par":1,"WorseThanPar":0}',
    `meat_value_config_string` varchar(50) DEFAULT 'MEAT_AS_2' COMMENT '肉分值配置，格式：MEAT_AS_X、SINGLE_DOUBLE、CONTINUE_DOUBLE',
    `meat_max_value` int DEFAULT '1000000' COMMENT '吃肉封顶值',
    `duty_config` varchar(50) DEFAULT 'DUTY_CODITIONAL' COMMENT '包负分配置，格式：NODUTY、DUTY_NEGATIVE、DUTY_CODITIONAL',
    `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `softdeleted` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'n' COMMENT '是否删除',
    PRIMARY KEY (`id`),
    KEY `idx_gambleSysName` (`gambleSysName`)
) ENGINE = InnoDB AUTO_INCREMENT = 1344534 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '赌博配置表';