/**
 * 新增运行时配置页面
 * 专门处理新增配置的逻辑
 */
// 使用共享的导入和数据结构
const { getBaseImportsWithMixin } = require('../shared/runtimeConfigImports');
const { getDefaultRuntimeConfigData } = require('../shared/runtimeConfigData');

const {
    GambleMetaConfig,
    gameStore,
    toJS,
    configManager,
    GambleRelatedInitor,
    setRuntimeConfigData,
    collectAllConfigs: sharedCollectAllConfigs,
    onReSelectRule: sharedOnReSelectRule,
    onCancelConfig: sharedOnCancelConfig,
    onConfirmConfigCommon
} = getBaseImportsWithMixin();

Page({
    data: getDefaultRuntimeConfigData(),

    onLoad(options) {

        // 初始化页面数据
        this.initializePageData(options);

        // 设置游戏配置和状态
        setTimeout(() => {
            this.setupGameConfig();
        }, 100);
    },

    /**
     * 初始化页面数据
     * @param {Object} options 页面参数
     */
    initializePageData(options) {
        // 处理传入的数据
        const processedData = configManager.processIncomingData(options);

        // 使用统一的配置设置方法
        const configData = {
            gambleSysName: processedData.gambleSysName,
            gameid: processedData.gameid,
            groupid: processedData.groupid,
            configId: processedData.configId || '',
            players: processedData.players,
            gameData: processedData.gameData,
            userRule: processedData.userRule,
            runtimeConfig: {
                gameid: processedData.gameid,
                groupid: processedData.groupid,
                userRuleId: processedData.userRuleId,
                gambleSysName: processedData.gambleSysName,
                gambleUserName: processedData.gambleUserName
            }
        };

        setRuntimeConfigData(this, configData);
        this.createGambleRelatedConfig(processedData.editConfig);
    },

    /**
     * 设置游戏配置和状态
     * 包括游戏功能标识、洞范围配置、默认游戏配置等
     */
    setupGameConfig() {
        const { gambleSysName } = this.data;
        const is8421Game = ['4p-8421', '3p-8421', '2p-8421'].includes(gambleSysName);
        const needsGrouping = GambleMetaConfig.needsGrouping(gambleSysName);
        const needsStroking = GambleMetaConfig.needsStroking(gambleSysName);

        // 获取 gameStore 中的 gameData
        const gameData = toJS(gameStore.gameData);
        const groupid = toJS(gameStore.gameData.groups[0].groupid);

        // 计算调试信息
        const gameDataType = typeof gameData;

        // 只提取 holeList 中的 hindex, holename, unique_key
        let roadLength = 0;
        if (gameData?.holeList && Array.isArray(gameData.holeList)) {
            roadLength = gameData.holeList.length;
        }

        const config = {
            startHoleindex: 1,
            roadLength: roadLength,
        }

        // 设置默认的游戏配置
        const defaultConfig = GambleMetaConfig.getDefaultGambleConfig(gambleSysName, this.data.players);

        // 使用统一的配置设置方法
        const configData = {
            config: config,
            groupid: groupid,
            runtimeConfig: {
                groupid: groupid,
                red_blue_config: defaultConfig.red_blue_config,
                bootstrap_order: defaultConfig.bootstrap_order,
                ranking_tie_resolve_config: defaultConfig.ranking_tie_resolve_config,
                playerIndicatorConfig: defaultConfig.playerIndicatorConfig
            },
            is8421Game: is8421Game,
            needsGrouping: needsGrouping,
            needsStroking: needsStroking,
            gameData: gameData,
            gameDataType: gameDataType
        };

        setRuntimeConfigData(this, configData);
    },

    /**
     * 创建游戏相关配置
     * 处理特定游戏类型的配置需求，如8421游戏的球员指标配置
     * @param {Object} editConfig 编辑配置
     */
    createGambleRelatedConfig(editConfig) {

        // 加载玩家顺序配置
        if (editConfig?.bootstrap_order) {
            let bootstrapOrder = editConfig.bootstrap_order;
            if (typeof bootstrapOrder === 'string') {
                try {
                    bootstrapOrder = JSON.parse(bootstrapOrder);
                } catch (error) {
                    bootstrapOrder = [];
                }
            }
            if (Array.isArray(bootstrapOrder) && bootstrapOrder.length > 0) {
                setRuntimeConfigData(this, {
                    runtimeConfig: {
                        bootstrap_order: bootstrapOrder
                    }
                });
            }
        }

        // 加载排名配置
        if (editConfig?.ranking_tie_resolve_config) {
            setRuntimeConfigData(this, {
                runtimeConfig: {
                    ranking_tie_resolve_config: editConfig.ranking_tie_resolve_config
                }
            });
        }

        // 8421初始化配置
        if (editConfig.gambleSysName.includes('8421')) {
            const val8421Config = GambleRelatedInitor.getInit8421Values(this.data.players);
            setRuntimeConfigData(this, {
                runtimeConfig: {
                    playerIndicatorConfig: val8421Config
                }
            });
        }
    },

    // 确认配置 - 使用共享方法
    async onConfirmConfig() {
        onConfirmConfigCommon(this, false); // false 表示新增模式
    },

    // 收集所有组件的配置 - 使用共享方法
    collectAllConfigs() {
        sharedCollectAllConfigs(this, this.data.needsStroking);
    },



    // 重新选择规则 - 使用共享方法
    onReSelectRule() {
        sharedOnReSelectRule();
    },

    // 取消配置 - 使用共享方法
    onCancelConfig() {
        sharedOnCancelConfig();
    }
}); 