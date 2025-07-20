/**
 * 配置验证器
 * 专门处理配置验证逻辑
 */
const GameTypeManager = require('../../../utils/gameTypeManager');

const ConfigValidator = {
    /**
     * 验证完整配置
     * @param {Object} runtimeConfig 运行时配置
     * @param {Array} players 玩家数组
     * @param {string} gambleSysName 游戏类型
     * @returns {Object} 验证结果 {valid: boolean, errors: Array}
     */
    validateFullConfig(runtimeConfig, players, gambleSysName) {
        const errors = [];

        // 基础验证
        const basicValidation = ConfigValidator.validateBasicConfig(runtimeConfig, players);
        errors.push(...basicValidation.errors);

        // 分组验证
        const groupingValidation = ConfigValidator.validateGroupingConfig(runtimeConfig, players, gambleSysName);
        errors.push(...groupingValidation.errors);

        // 球员配置验证
        const playerValidation = ConfigValidator.validatePlayerConfig(runtimeConfig, players, gambleSysName);
        errors.push(...playerValidation.errors);

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * 验证基础配置
     * @param {Object} runtimeConfig 运行时配置
     * @param {Array} players 玩家数组
     * @returns {Object} 验证结果
     */
    validateBasicConfig(runtimeConfig, players) {
        const errors = [];

        // 验证玩家数据
        if (!players || players.length === 0) {
            errors.push('没有可用的玩家数据');
        }

        // 验证游戏ID
        if (!runtimeConfig.gameid) {
            errors.push('缺少游戏ID');
        }

        // 验证分组ID
        if (!runtimeConfig.groupid) {
            errors.push('缺少分组ID');
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * 验证分组配置
     * @param {Object} runtimeConfig 运行时配置
     * @param {Array} players 玩家数组
     * @param {string} gambleSysName 游戏类型
     * @returns {Object} 验证结果
     */
    validateGroupingConfig(runtimeConfig, players, gambleSysName) {
        const errors = [];

        // 检查是否需要分组
        const needsGrouping = GameTypeManager.needsGrouping(gambleSysName);

        if (needsGrouping) {
            // 验证分组方式
            if (!runtimeConfig.red_blue_config) {
                errors.push('请选择分组方式');
            }

            // 验证玩家顺序
            if (!runtimeConfig.bootstrap_order || !Array.isArray(runtimeConfig.bootstrap_order)) {
                errors.push('玩家顺序配置有误');
            } else {
                const playersOrderCount = runtimeConfig.bootstrap_order.length;

                if (playersOrderCount !== players.length) {
                    errors.push('玩家顺序数量与总人数不符');
                } else {
                    // 验证所有玩家ID都存在
                    const playerIds = players.map(p => Number.parseInt(p.userid));
                    const allPlayersIncluded = runtimeConfig.bootstrap_order.every(id =>
                        playerIds.includes(Number.parseInt(id))
                    );

                    if (!allPlayersIncluded) {
                        errors.push('玩家顺序配置有误');
                    }
                }
            }
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * 验证球员配置
     * @param {Object} runtimeConfig 运行时配置
     * @param {Array} players 玩家数组
     * @param {string} gambleSysName 游戏类型
     * @returns {Object} 验证结果
     */
    validatePlayerConfig(runtimeConfig, players, gambleSysName) {
        const errors = [];

        // 检查是否需要球员配置
        const needsPlayerConfig = GameTypeManager.needsPlayerConfig(gambleSysName);

        if (needsPlayerConfig) {
            const val8421Config = runtimeConfig.val8421_config;

            if (!val8421Config || Object.keys(val8421Config).length === 0) {
                errors.push('请配置球员指标');
            } else {
                // 验证所有球员都有配置
                const playerIds = players.map(p => String(p.userid));
                const configPlayerIds = Object.keys(val8421Config);
                const allPlayersConfigured = playerIds.every(id =>
                    configPlayerIds.includes(id)
                );

                if (!allPlayersConfigured) {
                    errors.push('部分球员未配置指标');
                } else {
                    // 验证每个球员的配置是否有效
                    const configValidation = ConfigValidator.validate8421Config(val8421Config);
                    errors.push(...configValidation.errors);
                }
            }
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * 验证8421配置
     * @param {Object} val8421Config 8421配置
     * @returns {Object} 验证结果
     */
    validate8421Config(val8421Config) {
        const errors = [];

        for (const [playerId, config] of Object.entries(val8421Config)) {
            // 验证必要的字段
            const requiredFields = ['Birdie', 'Par', 'Par+1', 'Par+2'];

            for (const field of requiredFields) {
                if (config[field] === undefined || config[field] === null) {
                    errors.push(`球员${playerId}缺少${field}配置`);
                } else if (typeof config[field] !== 'number' || config[field] < 0) {
                    errors.push(`球员${playerId}的${field}配置无效`);
                }
            }

            // 验证配置的合理性
            if (config.Birdie <= config.Par) {
                errors.push(`球员${playerId}的老鹰球得分应该高于标准杆得分`);
            }
        }

        return { valid: errors.length === 0, errors };
    },



    /**
     * 显示验证错误
     * @param {Array} errors 错误列表
     */
    showValidationErrors(errors) {
        if (errors && errors.length > 0) {
            wx.showToast({
                title: errors[0],
                icon: 'none'
            });
        }
    },

    /**
     * 验证并显示结果
     * @param {Object} runtimeConfig 运行时配置
     * @param {Array} players 玩家数组
     * @param {string} gambleSysName 游戏类型
     * @returns {boolean} 验证是否通过
     */
    validateAndShow(runtimeConfig, players, gambleSysName) {
        const validation = ConfigValidator.validateFullConfig(runtimeConfig, players, gambleSysName);

        if (!validation.valid) {
            ConfigValidator.showValidationErrors(validation.errors);
        }

        return validation.valid;
    }
};

module.exports = ConfigValidator; 