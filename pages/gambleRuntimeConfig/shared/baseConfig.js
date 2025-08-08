/**
 * 基础配置逻辑
 * 包含新增和编辑模式的公共方法
 */
const { holeRangeStore } = require('../../../stores/holeRangeStore');
const { GameConfig } = require('../../../utils/gameConfig');
const configManager = require('../../../utils/configManager');

const app = getApp();

const BaseConfig = {
    /**
     * 初始化页面数据
     * @param {Object} options 页面参数
     * @param {Object} pageContext 页面上下文
     * @returns {Object} 初始化结果
     */
    initializePageData(options, pageContext) {
        try {
            // 处理传入的数据
            const processedData = configManager.processIncomingData(options);

            // 设置页面数据
            const setDataObj = {
                gambleSysName: processedData.gambleSysName,
                gameId: processedData.gameId,
                groupid: processedData.groupid, // 添加 groupid 到页面数据
                configId: processedData.configId || '',
                players: processedData.players,
                gameData: processedData.gameData,
                userRule: processedData.userRule,
                'runtimeConfig.gameid': processedData.gameId,
                'runtimeConfig.groupid': processedData.groupid,
                'runtimeConfig.userRuleId': processedData.userRuleId,
                'runtimeConfig.gambleSysName': processedData.gambleSysName,
                'runtimeConfig.gambleUserName': processedData.gambleUserName
            };

            pageContext.setData(setDataObj);

            // 根据是否有编辑配置来决定初始化方式
            if (processedData.editConfig) {
                BaseConfig.loadEditConfig(processedData.editConfig, pageContext);
            } else {
                BaseConfig.initializeNewConfig(processedData, pageContext);
            }

            return {
                success: true,
                data: processedData
            };

        } catch (error) {
            console.error('[BaseConfig] 初始化失败:', error);
            pageContext.setData({
                error: `初始化失败: ${error.message}`
            });

            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * 初始化新配置
     * @param {Object} processedData 处理后的数据
     * @param {Object} pageContext 页面上下文
     */
    initializeNewConfig(processedData, pageContext) {
        console.log('[BaseConfig] 初始化新配置:', {
            gambleSysName: processedData.gambleSysName,
            playerCount: processedData.players?.length
        });

        // 获取默认配置
        const defaultConfig = GameConfig.getDefaultConfig(
            processedData.gambleSysName,
            processedData.players
        );

        console.log('[BaseConfig] 获取到的默认配置:', defaultConfig);

        // 设置默认配置
        pageContext.setData({
            'runtimeConfig.red_blue_config': defaultConfig.red_blue_config,
            'runtimeConfig.bootstrap_order': defaultConfig.bootstrap_order,
            'runtimeConfig.ranking_tie_resolve_config': defaultConfig.ranking_tie_resolve_config,
            'runtimeConfig.playerIndicatorConfig': defaultConfig.playerIndicatorConfig
        });


        // 强制检查8421配置是否为空，如果为空则重新初始化
        const is8421Game = processedData.gambleSysName && (
            processedData.gambleSysName.includes('8421') ||
            GameConfig.needsPlayerConfig(processedData.gambleSysName)
        );

        if (is8421Game) {
            // 直接检查生成的默认配置，而不是从页面数据中获取
            if (!defaultConfig.playerIndicatorConfig || Object.keys(defaultConfig.playerIndicatorConfig).length === 0) {

                // 重新获取默认配置
                const retryConfig = GameConfig.getDefaultConfig(
                    processedData.gambleSysName,
                    processedData.players
                );

                pageContext.setData({
                    'runtimeConfig.playerIndicatorConfig': retryConfig.playerIndicatorConfig
                });

            } else {
                console.log('[BaseConfig] 8421配置已正确生成:', defaultConfig.playerIndicatorConfig);
            }
        }

        // 初始化洞范围配置
        BaseConfig.initializeHoleRangeConfig(pageContext);
    },

    /**
     * 加载编辑配置
     * @param {Object} editConfig 编辑配置
     * @param {Object} pageContext 页面上下文
     */
    loadEditConfig(editConfig, pageContext) {

        // 加载分组配置
        if (editConfig.red_blue_config !== undefined && editConfig.red_blue_config !== null) {
            pageContext.setData({
                'runtimeConfig.red_blue_config': editConfig.red_blue_config
            });
        } else {
            console.log('[BaseConfig] 分组配置为空或未定义');
        }

        // 加载玩家顺序配置
        if (editConfig.bootstrap_order) {
            let bootstrapOrder = editConfig.bootstrap_order;

            if (typeof bootstrapOrder === 'string') {
                try {
                    bootstrapOrder = JSON.parse(bootstrapOrder);
                } catch (error) {
                    bootstrapOrder = [];
                }
            }

            if (Array.isArray(bootstrapOrder) && bootstrapOrder.length > 0) {
                pageContext.setData({
                    'runtimeConfig.bootstrap_order': bootstrapOrder
                });
                console.log('[BaseConfig] 玩家顺序配置加载:', bootstrapOrder);
            }
        }

        // 加载排名配置
        if (editConfig.ranking_tie_resolve_config) {
            pageContext.setData({
                'runtimeConfig.ranking_tie_resolve_config': editConfig.ranking_tie_resolve_config
            });
            console.log('[BaseConfig] 排名配置加载:', editConfig.ranking_tie_resolve_config);
        }

        // 加载8421配置
        let val8421Config = {};
        if (editConfig.playerIndicatorConfig) {
            let configData = editConfig.playerIndicatorConfig;

            if (typeof configData === 'string') {
                try {
                    configData = JSON.parse(configData);
                } catch (error) {
                    console.error('[BaseConfig] 解析8421配置失败:', error);
                    configData = {};
                }
            }

            if (typeof configData === 'object' && configData !== null && Object.keys(configData).length > 0) {
                val8421Config = configData;
                console.log('[BaseConfig] 8421配置加载成功:', val8421Config);
            }
        }

        // 如果8421配置为空且是8421游戏，则初始化默认配置
        const is8421Game = editConfig.gambleSysName && (
            editConfig.gambleSysName.includes('8421') ||
            GameConfig.needsPlayerConfig(editConfig.gambleSysName)
        );

        if (Object.keys(val8421Config).length === 0 && is8421Game) {
            console.log('[BaseConfig] 检测到8421游戏但配置为空，初始化默认配置');

            // 获取玩家数据
            const players = pageContext.data.players || [];

            if (players.length > 0) {
                // 使用 GameTypeManager 生成默认配置
                const defaultConfig = GameConfig.getDefaultConfig(editConfig.gambleSysName, players);
                val8421Config = defaultConfig.playerIndicatorConfig;
            }
        }

        // 设置8421配置
        pageContext.setData({
            'runtimeConfig.playerIndicatorConfig': val8421Config
        });


        // 加载起始洞和结束洞索引配置
        if (editConfig.startHoleindex !== undefined) {
            const startHoleindex = Number.parseInt(editConfig.startHoleindex);
            holeRangeStore.setStartIndex(startHoleindex);
        }

        console.log('[BaseConfig] 编辑配置加载完成');
    },

    /**
     * 初始化洞范围配置
     * @param {Object} pageContext 页面上下文
     */
    initializeHoleRangeConfig(pageContext) {
        // 使用 holeRangeStore 重置洞范围到默认状态
        // holeRangeStore.resetHoleRange();

        console.log('[BaseConfig] 洞范围配置初始化完成');
    },



    /**
     * 保存配置
     * @param {Object} runtimeConfig 运行时配置
     * @param {string} gameId 游戏ID
     * @param {string} groupid 分组ID
     * @param {string} configId 配置ID
     * @param {Object} pageContext 页面上下文
     * @param {boolean} isEdit 是否为编辑模式
     * @returns {Promise} 保存结果
     */
    async saveConfig(runtimeConfig, gameId, groupid, configId, pageContext, isEdit = false) {
        const saveData = configManager.prepareSaveData(runtimeConfig, isEdit, configId);

        pageContext.setData({ loading: true });

        try {
            const apiMethod = isEdit ? 'updateRuntimeConfig' : 'addRuntimeConfig';


            const res = await app.api.gamble[apiMethod](saveData);
            if (res.code === 200) {
                wx.showToast({
                    title: isEdit ? '配置更新成功' : '配置保存成功',
                    icon: 'success'
                });

                setTimeout(() => {
                    wx.navigateTo({
                        url: `/pages/gameDetail/gameDetail?gameId=${gameId}&groupid=${groupid}&tab=2`
                    });
                }, 1500);

                return { success: true };
            }
            wx.showToast({
                title: res.msg || (isEdit ? '更新失败' : '保存失败'),
                icon: 'none'
            });
            return { success: false, error: res.msg };

        } catch (err) {
            console.error('[BaseConfig] 保存配置失败:', err);
            wx.showToast({
                title: '网络错误, 请重试',
                icon: 'none'
            });
            return { success: false, error: err.message };
        } finally {
            pageContext.setData({ loading: false });
        }
    },

    /**
     * 重新选择规则
     * @param {Object} pageContext 页面上下文
     */
    onReSelectRule(pageContext) {
        wx.showModal({
            title: '重新选择规则',
            content: '确定要重新选择赌博规则吗？当前配置将丢失。',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateBack();
                }
            }
        });
    },

    /**
     * 取消配置
     * @param {Object} pageContext 页面上下文
     */
    onCancelConfig(pageContext) {
        console.log('[BaseConfig] 取消配置');
        wx.navigateBack();
    }
};

module.exports = BaseConfig; 