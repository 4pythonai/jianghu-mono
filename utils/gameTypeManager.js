/**
 * 游戏类型管理器
 * 统一管理所有游戏类型的配置逻辑
 */
const { GAME_TYPE_MAP, GameConstantsUtils } = require('./gameConstants.js');

const GameTypeManager = {
    // 游戏类型定义 - 现在引用统一配置
    get GAME_TYPES() {
        return GAME_TYPE_MAP;
    },

    /**
     * 获取游戏类型配置
     * @param {string} gambleSysName 游戏类型名称
     * @returns {Object} 游戏类型配置
     */
    getGameTypeConfig(gambleSysName) {
        return GameConstantsUtils.getGameTypeConfig(gambleSysName);
    },

    /**
     * 获取游戏类型显示名称
     * @param {string} gambleSysName 游戏类型名称
     * @returns {string} 显示名称
     */
    getGameTypeName(gambleSysName) {
        return GameConstantsUtils.getGameTypeName(gambleSysName);
    },

    /**
     * 获取游戏类型需要的组件
     * @param {string} gambleSysName 游戏类型名称
     * @returns {Array} 组件名称数组
     */
    getRequiredComponents(gambleSysName) {
        return GameConstantsUtils.getRequiredComponents(gambleSysName);
    },

    /**
     * 检查是否需要球员配置
     * @param {string} gambleSysName 游戏类型名称
     * @returns {boolean}
     */
    needsPlayerConfig(gambleSysName) {
        return GameConstantsUtils.needsPlayerConfig(gambleSysName);
    },

    /**
     * 检查是否需要分组配置
     * @param {string} gambleSysName 游戏类型名称
     * @returns {boolean}
     */
    needsGrouping(gambleSysName) {
        return GameConstantsUtils.needsGrouping(gambleSysName);
    },

    /**
     * 获取默认配置
     * @param {string} gambleSysName 游戏类型名称
     * @param {Array} players 玩家数组
     * @returns {Object} 默认配置
     */
    getDefaultConfig(gambleSysName, players = []) {
        console.log('[GameTypeManager] 获取默认配置:', { gambleSysName, playerCount: players.length });

        // 详细调试玩家数据
        if (players.length > 0) {
            console.log('[GameTypeManager] 玩家数据详情:');
            players.forEach((player, index) => {
                console.log(`  玩家${index + 1}:`, {
                    userid: player.userid,
                    nickname: player.nickname,
                    wx_nickname: player.wx_nickname,
                });
            });
        }

        // 使用与 normalizePlayer 一致的字段名处理
        const playerIds = players.map(player => Number.parseInt(player.userid));
        console.log('[GameTypeManager] 玩家ID列表:', playerIds);

        const defaultConfig = {
            red_blue_config: '4_固拉',
            bootstrap_order: playerIds,
            ranking_tie_resolve_config: 'indicator.reverse',
            playerIndicatorConfig: {}
        };

        // 如果是8421游戏，设置默认的球员配置
        const needsConfig = this.needsPlayerConfig(gambleSysName);
        console.log(`[GameTypeManager] 检查是否需要球员配置: ${needsConfig} (gambleSysName: ${gambleSysName})`);

        if (needsConfig && players.length > 0) {
            console.log('[GameTypeManager] 检测到8421游戏，开始设置默认球员配置');

            const default8421Config = {
                "Birdie": 8,
                "Par": 4,
                "Par+1": 2,
                "Par+2": 1
            };

            for (const player of players) {
                // 使用与 normalizePlayer 一致的字段名处理
                const userid = String(player.userid);

                // 确保 userid 有效
                if (!userid || userid === 'undefined' || userid === 'null') {
                    console.warn(`[GameTypeManager] 玩家 ${player.nickname || player.wx_nickname} 的 userid 无效:`, userid);
                    continue;
                }

                defaultConfig.playerIndicatorConfig[userid] = { ...default8421Config };
                console.log(`[GameTypeManager] 为玩家 ${userid} (${player.nickname || player.wx_nickname}) 设置默认配置:`, default8421Config);
            }

            console.log('[GameTypeManager] 默认球员配置完成:', defaultConfig.playerIndicatorConfig);
        } else {
            console.log('[GameTypeManager] 非8421游戏或没有玩家，跳过球员配置');
        }

        console.log('[GameTypeManager] 最终默认配置:', defaultConfig);
        return defaultConfig;
    },

    /**
     * 测试默认配置生成
     * @param {string} gambleSysName 游戏类型名称
     * @param {Array} players 玩家数组
     * @returns {Object} 测试结果
     */
    testDefaultConfig(gambleSysName, players = []) {
        console.log('[GameTypeManager] 开始测试默认配置生成');

        const result = {
            gambleSysName,
            playerCount: players.length,
            needsPlayerConfig: this.needsPlayerConfig(gambleSysName),
            defaultConfig: null,
            val8421ConfigKeys: [],
            issues: []
        };

        try {
            result.defaultConfig = this.getDefaultConfig(gambleSysName, players);
            result.val8421ConfigKeys = Object.keys(result.defaultConfig.playerIndicatorConfig);

            // 检查是否有问题
            if (this.needsPlayerConfig(gambleSysName) && players.length > 0) {
                if (result.val8421ConfigKeys.length === 0) {
                    result.issues.push('8421游戏应该有默认球员配置，但配置为空');
                }

                const expectedPlayerIds = players.map(p => String(p.userid));
                const missingPlayers = expectedPlayerIds.filter(id => !result.val8421ConfigKeys.includes(id));

                if (missingPlayers.length > 0) {
                    result.issues.push(`缺少以下玩家的配置: ${missingPlayers.join(', ')}`);
                }
            }

        } catch (error) {
            result.issues.push(`生成默认配置时出错: ${error.message}`);
        }

        console.log('[GameTypeManager] 测试结果:', result);
        return result;
    },

    /**
     * 从规则类型中提取系统名称
     * @param {string} gambleSysName 完整的规则类型名称
     * @returns {string} 系统名称
     */
    extractSysNameFromRuleType(gambleSysName) {
        if (!gambleSysName) return '';

        const parts = gambleSysName.split('-');
        if (parts.length === 2) {
            return parts[1];
        }

        return gambleSysName;
    },

    /**
     * 验证游戏类型是否有效
     * @param {string} gambleSysName 游戏类型名称
     * @returns {boolean}
     */
    isValidGameType(gambleSysName) {
        return GameConstantsUtils.isValidGameType(gambleSysName);
    },

    /**
     * 获取所有游戏类型
     * @returns {Array} 游戏类型数组
     */
    getAllGameTypes() {
        return GameConstantsUtils.getAllGameTypes();
    }
};

module.exports = GameTypeManager; 