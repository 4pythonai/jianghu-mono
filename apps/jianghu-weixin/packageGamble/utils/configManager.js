/**
 * 统一配置管理器
 * 合并 configConverter、configParser、configDataProcessor 的功能
 * 提供统一的配置解析、转换、处理接口
 */
const { gameStore } = require('@/stores/game/gameStore');
const { holeRangeStore } = require('@/stores/game/holeRangeStore');
const navigationHelper = require('@/utils/navigationHelper.js');

class ConfigManager {
    constructor() {
        // 存储键名常量
        this.KEYS = {
            TOKEN: 'token',
            USER_INFO: 'userInfo',
            USER_AVATAR: 'userAvatarPath',
            APP_CONFIG: 'appConfig',
            LAST_LOGIN_TIME: 'lastLoginTime'
        };
    }





    /**
     * 解析封顶值配置
     * @param {string|number} value - 配置值，如 "10000000" 或 10000000
     * @returns {Object} 解析结果，如 { isUnlimited: true, value: 10000000 }
     */
    parseMaxValue(value) {
        const numValue = Number(value);

        if (Number.isNaN(numValue)) {
            return {
                isUnlimited: false,
                value: 0,
                original: value
            };
        }

        return {
            isUnlimited: numValue === 10000000,
            value: numValue,
            original: value
        };
    }

    /**
     * 处理传入的页面参数
     * @param {Object} options 页面参数
     * @returns {Object} 处理后的数据
     */
    processIncomingGambleCardData(options) {
        console.log('[ConfigManager] 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 处理传入数据:', options);

        try {
            if (!options.data) {
                throw new Error('缺少必要的数据参数');
            }

            const decodedData = JSON.parse(decodeURIComponent(options.data));
            console.log('[ConfigManager] 解析数据:', decodedData);

            // 获取基础游戏数据
            const baseData = this.getBaseGameData();

            // 处理游戏类型和规则信息
            const gameTypeData = this.processGambleTypeData(decodedData);

            // 合并所有数据
            const processedData = {
                ...baseData,
                ...gameTypeData,
                editConfig: decodedData,  // 整个 decodedData 就是编辑配置
            };

            return processedData;

        } catch (error) {
            console.error('[ConfigManager] 数据处理失败:', error);
            throw error;
        }
    }

    /**
     * 获取比赛数据
     * @returns {Object} 比赛数据
     */
    getBaseGameData() {
        const players = gameStore.players || [];
        const gameData = gameStore.gameData || null;
        return {
            players,
            gameData,
            gameid: gameStore.gameid,
            groupid: gameStore.groupid
        };
    }

    /**
     * 处理游戏类型和规则信息
     * @param {Object} decodedData 解析后的数据
     * @returns {Object} 游戏类型数据
     */
    processGambleTypeData(decodedData) {
        let gambleSysName = '';
        let userRuleId = null;
        let gambleUserName = '';
        let userRule = null;

        if (decodedData.fromUserRule) {
            // 从用户规则进入
            // 优先使用传递的 gambleSysName，保持完整格式
            gambleSysName = decodedData.gambleSysName || decodedData.userRule?.gamblesysname || '';

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
            gambleSysName = decodedData.gambleSysName || '';
            gambleUserName = decodedData.gambleSysName || '';
            userRuleId = null;
        }

        return {
            gambleSysName,
            gambleUserName,
            userRuleId,
            userRule
        };
    }



    /**
     * 验证配置数据
     * @param {Object} config 配置数据
     * @param {Array} players 玩家数组
     * @returns {Object} 验证结果 {valid: boolean, errors: Array}
     */
    validateConfig(config, players) {
        const errors = [];

        console.log('[ConfigManager] 验证配置数据:', config);

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
    }

    /**
     * 准备保存的配置数据
     * @param {Object} runtimeConfig 运行时配置
     * @param {boolean} isEdit 是否为编辑模式
     * @param {string} configId 配置ID（编辑模式）
     * @returns {Object} 准备保存的数据
     */
    prepareSaveData(runtimeConfig, isEdit, configId = '') {
        // 从 holeRangeStore 获取洞数据
        const { holeList, startHoleindex, roadLength } = holeRangeStore.getState();


        const saveData = {
            ...runtimeConfig,
            holeList,
            startHoleindex,
            roadLength,
        };



        if (isEdit) {
            saveData.id = configId;
        }


        return saveData;
    }

    // ==================== 配置保存方法 ====================

    /**
     * 收集所有组件的配置
     * @param {Object} pageContext 页面上下文
     * @param {boolean} needsStroking 是否需要让杆配置
     * @returns {Object} 收集到的配置对象
     */
    collectAllConfigs(pageContext, needsStroking = false) {
        console.log('[ConfigManager] 开始收集所有组件配置');

        const collectedConfig = {};

        // 从洞范围选择器获取配置
        const holeRangeSelector = pageContext.selectComponent('#holeRangeSelector');
        if (holeRangeSelector) {
            const holeConfig = holeRangeSelector.getConfig();
            if (holeConfig) {
                console.log('🕳️ [ConfigManager] 收集洞范围配置:', holeConfig);
                Object.assign(collectedConfig, {
                    startHoleindex: holeConfig.startHoleindex,
                    endHoleindex: holeConfig.endHoleindex,
                    roadLength: holeConfig.roadLength,
                });
            }
        }

        // 从让杆配置组件获取配置（仅在需要时）
        if (needsStroking) {
            const stroking = pageContext.selectComponent('#stroking');
            if (stroking) {
                const strokingConfig = stroking.getConfig();
                if (strokingConfig) {
                    Object.assign(collectedConfig, {
                        stroking_config: strokingConfig
                    });
                }
            }
        }

        // 从8421球员配置组件获取配置
        const playerIndicator = pageContext.selectComponent('#playerIndicator');
        if (playerIndicator) {
            const playerConfig = playerIndicator.getConfig();
            if (playerConfig) {
                Object.assign(collectedConfig, {
                    playerIndicatorConfig: playerConfig
                });
            }
        }

        // 从分组配置组件获取配置
        const redBlueConfig = pageContext.selectComponent('#redBlueConfig');
        if (redBlueConfig) {
            const groupConfig = redBlueConfig.getConfig();
            console.log('[ConfigManager] RedBlueConfig 组件配置:', groupConfig);
            if (groupConfig) {
                Object.assign(collectedConfig, {
                    red_blue_config: groupConfig.red_blue_config,
                    bootstrap_order: groupConfig.bootstrap_order
                });
            }
        } else {
            console.warn('[ConfigManager] 未找到 RedBlueConfig 组件');
        }

        // 从排名配置组件获取配置
        const rankConfig = pageContext.selectComponent('#rankConfig');
        if (rankConfig) {
            const rankingConfig = rankConfig.getConfig();
            if (rankingConfig) {
                Object.assign(collectedConfig, {
                    ranking_tie_resolve_config: rankingConfig
                });
            }
        }

        console.log('[ConfigManager] 收集配置完成，收集到的配置:', collectedConfig);
        return collectedConfig;
    }

    /**
     * 保存配置
     * @param {Object} runtimeConfig 运行时配置
     * @param {string} gameid 游戏ID
     * @param {string} groupid 分组ID
     * @param {string} configId 配置ID
     * @param {Object} pageContext 页面上下文
     * @param {boolean} isEdit 是否为编辑模式
     * @param {string} redirectTo 跳转目标页面，可选值：'gameDetail' | 'rules' | 'auto'(自动判断)
     * @returns {Promise} 保存结果
     */
    async saveGambleConfig(runtimeConfig, gameid, groupid, configId, pageContext, isEdit = false, redirectTo = 'auto') {
        try {
            const saveData = this.prepareSaveData(runtimeConfig, isEdit, configId);

            pageContext.setData({ loading: true });

            const app = getApp();
            const apiMethod = isEdit ? 'updateRuntimeConfig' : 'addRuntimeConfig';
            const res = await app.api.gamble[apiMethod](saveData);

            if (res.code === 200) {
                wx.showToast({
                    title: isEdit ? '配置更新成功' : '配置保存成功',
                    icon: 'success'
                });

                setTimeout(() => {
                    let targetUrl;
                    if (redirectTo === 'rules') {
                        // 明确指定跳转到规则页面
                        targetUrl = `/packageGamble/rules/rules?activeTab=0`;
                    } else if (redirectTo === 'gameDetail') {
                        // 明确指定跳转到游戏详情页面
                        targetUrl = `/packageGame/gameDetail/gamble/gamble?gameid=${gameid}${groupid ? `&groupid=${groupid}` : ''}`;
                    } else {
                        // 自动判断：新增模式下跳转到规则页面，编辑模式下跳转到游戏详情页面
                        if (isEdit) {
                            targetUrl = `/packageGame/gameDetail/gamble/gamble?gameid=${gameid}${groupid ? `&groupid=${groupid}` : ''}`;
                        } else {
                            targetUrl = `/packageGamble/rules/rules?activeTab=0`;
                        }
                    }

                    navigationHelper.navigateTo(targetUrl)
                        .then(() => {
                            console.log(`[ConfigManager] 成功跳转到: ${targetUrl}`);
                        })
                        .catch((err) => {
                            console.error(`[ConfigManager] 跳转失败:`, err);
                            // 只有在真正失败时才执行降级操作
                            if (!err.message.includes('页面栈超限自动降级')) {
                                navigationHelper.navigateBack()
                                    .catch(() => {
                                        console.error(`[ConfigManager] navigateBack 也失败了`);
                                    });
                            }
                        });
                }, 300);

                return { success: true };
            }

            wx.showToast({
                title: isEdit ? '配置更新失败' : '配置保存失败',
                icon: 'none'
            });

            return { success: false, error: res.message || '保存失败' };
        } catch (error) {
            console.error('[ConfigManager] 保存配置失败:', error);
            wx.showToast({
                title: '保存失败，请重试',
                icon: 'none'
            });

            return { success: false, error: error.message };
        } finally {
            // 无论成功还是失败，都要重置loading状态
            pageContext.setData({ loading: false });
        }
    }
}

// 创建单例实例
const configManager = new ConfigManager();

// 导出单例实例
module.exports = configManager;

// 导出兼容接口，保持向后兼容
module.exports.ConfigManager = ConfigManager;
module.exports.ConfigConverter = configManager;
module.exports.ConfigParser = configManager;
module.exports.ConfigDataProcessor = configManager; 
