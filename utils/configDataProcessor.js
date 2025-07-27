/**
 * 配置数据处理器
 * 统一处理传入和传出的配置数据
 */
const { gameStore } = require('../stores/gameStore');
const { holeRangeStore } = require('../stores/holeRangeStore');
const GameTypeManager = require('./gameTypeManager');

const ConfigDataProcessor = {
    /**
     * 处理传入的页面参数
     * @param {Object} options 页面参数
     * @returns {Object} 处理后的数据
     */
    processIncomingData(options) {
        console.log('[ConfigDataProcessor] 处理传入数据:', options);

        try {
            if (!options.data) {
                throw new Error('缺少必要的数据参数');
            }

            const decodedData = JSON.parse(decodeURIComponent(options.data));
            console.log('[ConfigDataProcessor] 解析数据:', decodedData);

            // 获取基础游戏数据
            const baseData = ConfigDataProcessor.getBaseGameData();

            // 处理游戏类型和规则信息
            const gameTypeData = ConfigDataProcessor.processGameTypeData(decodedData);

            // 处理洞范围数据
            const holeData = ConfigDataProcessor.processHoleData(decodedData);

            // 合并所有数据
            const processedData = {
                ...baseData,
                ...gameTypeData,
                ...holeData,
                editConfig: decodedData,  // 整个 decodedData 就是编辑配置
                configId: decodedData.id || ''  // 从配置对象中获取 id
            };


            return processedData;

        } catch (error) {
            console.error('[ConfigDataProcessor] 数据处理失败:', error);
            throw error;
        }
    },

    /**
     * 获取基础游戏数据
     * @returns {Object} 基础游戏数据
     */
    getBaseGameData() {
        const players = gameStore.players || [];
        const gameData = gameStore.gameData || null;
        return {
            players,
            gameData,
            gameId: gameStore.gameid,
            groupId: gameStore.groupId
        };
    },

    /**
     * 处理游戏类型和规则信息
     * @param {Object} decodedData 解析后的数据
     * @returns {Object} 游戏类型数据
     */
    processGameTypeData(decodedData) {
        let gambleSysName = '';
        let userRuleId = null;
        let gambleUserName = '';
        let userRule = null;

        if (decodedData.fromUserRule) {
            // 从用户规则进入
            gambleSysName = decodedData.userRule?.gamblesysname || '';

            if (!gambleSysName && decodedData.gambleSysName) {
                gambleSysName = GameTypeManager.extractSysNameFromRuleType(decodedData.gambleSysName);
            }

            gambleUserName = decodedData.userRuleName || '';
            userRuleId = decodedData.userRuleId || null;
            userRule = decodedData.userRule || null;

        } else if (decodedData.id) {
            // 编辑模式 - 直接使用配置对象
            gambleSysName = decodedData.gambleSysName;
            gambleUserName = decodedData.gambleUserName;
            userRuleId = decodedData.userRuleId;

        } else {
            // 从系统规则进入（新增）
            gambleSysName = GameTypeManager.extractSysNameFromRuleType(decodedData.gambleSysName || '');
            gambleUserName = decodedData.gambleSysName || '';
            userRuleId = null;
        }

        return {
            gambleSysName,
            gambleUserName,
            userRuleId,
            userRule
        };
    },

    /**
     * 处理洞范围数据
     * @param {Object} decodedData 解析后的数据
     * @returns {Object} 洞范围数据
     */
    processHoleData(decodedData) {
        // 从 holeRangeStore 获取洞数据
        const { holePlayList, rangeHolePlayList } = holeRangeStore.getState();

        return {
            holePlayList,
            rangeHolePlayList
        };
    },

    /**
     * 验证配置数据
     * @param {Object} config 配置数据
     * @param {Array} players 玩家数组
     * @returns {Object} 验证结果 {valid: boolean, errors: Array}
     */
    validateConfig(config, players) {
        const errors = [];

        // 验证分组配置
        if (config.bootstrap_order) {
            const playersOrderCount = config.bootstrap_order.length;
            if (playersOrderCount !== players.length) {
                errors.push('玩家顺序数量与总人数不符');
            }

            // 验证所有玩家ID都存在 - 使用与 normalizePlayer 一致的字段名处理
            const playerIds = players.map(p => Number.parseInt(p.userid));
            const allPlayersIncluded = config.bootstrap_order.every(id =>
                playerIds.includes(Number.parseInt(id))
            );

            if (!allPlayersIncluded) {
                errors.push('玩家顺序配置有误');
            }
        }

        // 验证分组方式
        if (!config.red_blue_config) {
            errors.push('请选择分组方式');
        }


        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * 准备保存的配置数据
     * @param {Object} runtimeConfig 运行时配置
     * @param {boolean} isEdit 是否为编辑模式
     * @param {string} configId 配置ID（编辑模式）
     * @returns {Object} 准备保存的数据
     */
    prepareSaveData(runtimeConfig, isEdit, configId = '') {
        // 从 holeRangeStore 获取洞数据
        const { holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex } = holeRangeStore.getState();

        const saveData = {
            ...runtimeConfig,
            holeList,
            holePlayList,
            rangeHolePlayList,
            startHoleindex,
            endHoleindex
        };

        // 如果是编辑模式，添加配置ID
        if (isEdit) {
            saveData.id = configId;
        }
        return saveData;
    }
};

module.exports = ConfigDataProcessor; 