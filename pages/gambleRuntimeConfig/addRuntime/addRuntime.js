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

        // 设置游戏配置和状态 - 增加延迟确保数据初始化完成
        setTimeout(() => {
            this.setupGameConfig();
        }, 200);
    },

    /**
     * 初始化页面数据
     * @param {Object} options 页面参数
     */
    initializePageData(options) {
        // 处理传入的数据
        const processedData = configManager.processIncomingData(options);

        // 计算游戏配置和状态
        const gambleSysName = processedData.gambleSysName;
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
        const defaultConfig = GambleMetaConfig.getDefaultGambleConfig(gambleSysName, processedData.players);

        // 使用统一的配置设置方法，一次性设置所有数据
        const configData = {
            gambleSysName: gambleSysName,
            gameid: processedData.gameid,
            groupid: groupid,
            configId: processedData.configId || '',
            players: processedData.players,
            gameData: gameData,
            userRule: processedData.userRule,
            is8421Game: is8421Game,
            needsGrouping: needsGrouping,
            needsStroking: needsStroking,
            gameDataType: gameDataType,
            config: config,
            runtimeConfig: {
                gameid: processedData.gameid,
                groupid: groupid,
                userRuleId: processedData.userRuleId,
                gambleSysName: gambleSysName,
                gambleUserName: processedData.gambleUserName,
                red_blue_config: defaultConfig.red_blue_config,
                bootstrap_order: defaultConfig.bootstrap_order,
                ranking_tie_resolve_config: defaultConfig.ranking_tie_resolve_config,
                playerIndicatorConfig: defaultConfig.playerIndicatorConfig
            }
        };

        // 使用回调确保数据设置完成后再执行后续逻辑
        setRuntimeConfigData(this, configData, {}, () => {
            console.log('[AddRuntime] initializePageData 数据设置完成，开始执行后续逻辑');
            this.createGambleRelatedConfig(processedData.editConfig);
        });
    },

    /**
     * 设置游戏配置和状态
     * 包括游戏功能标识、洞范围配置、默认游戏配置等
     */
    setupGameConfig() {
        // 这个方法现在只需要处理一些额外的配置，主要数据已经在 initializePageData 中设置
        console.log('[AddRuntime] setupGameConfig 开始，当前页面数据:', {
            is8421Game: this.data.is8421Game,
            needsGrouping: this.data.needsGrouping,
            needsStroking: this.data.needsStroking,
            gambleSysName: this.data.gambleSysName
        });

        // 检查数据是否已正确设置
        if (this.data.is8421Game === undefined || this.data.needsGrouping === undefined || this.data.needsStroking === undefined) {
            console.warn('[AddRuntime] 关键数据未设置，重新设置');
            // 如果数据未设置，重新设置一次
            const gambleSysName = this.data.gambleSysName;
            const is8421Game = ['4p-8421', '3p-8421', '2p-8421'].includes(gambleSysName);
            const needsGrouping = GambleMetaConfig.needsGrouping(gambleSysName);
            const needsStroking = GambleMetaConfig.needsStroking(gambleSysName);

            // 确保包含完整的 runtimeConfig 对象，避免 Object.keys() 报错
            setRuntimeConfigData(this, {
                is8421Game,
                needsGrouping,
                needsStroking,
                runtimeConfig: this.data.runtimeConfig || {} // 保留现有的 runtimeConfig
            });
        }
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
                // 只更新特定的 runtimeConfig 字段，不覆盖其他数据
                this.setData({
                    'runtimeConfig.bootstrap_order': bootstrapOrder
                });
            }
        }

        // 加载排名配置
        if (editConfig?.ranking_tie_resolve_config) {
            // 只更新特定的 runtimeConfig 字段，不覆盖其他数据
            this.setData({
                'runtimeConfig.ranking_tie_resolve_config': editConfig.ranking_tie_resolve_config
            });
        }

        // 8421初始化配置
        if (editConfig?.gambleSysName && editConfig.gambleSysName.includes('8421')) {
            const val8421Config = GambleRelatedInitor.getInit8421Values(this.data.players);
            // 只更新特定的 runtimeConfig 字段，不覆盖其他数据
            this.setData({
                'runtimeConfig.playerIndicatorConfig': val8421Config
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