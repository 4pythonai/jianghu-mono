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
    ConfigValidator,
    setRuntimeConfigData,
    collectAllConfigs: sharedCollectAllConfigs,
    onReSelectRule: sharedOnReSelectRule,
    onCancelConfig: sharedOnCancelConfig
} = getBaseImportsWithMixin();

Page({
    data: getDefaultRuntimeConfigData(),

    onLoad(options) {

        // 初始化页面数据
        this.initializePageData(options);

        // 设置游戏配置和状态 - 增加延迟确保数据初始化完成
        setTimeout(() => {
            this.createGambleRelatedConfig(options.editConfig);
        }, 200);
    },

    /**
     * 初始化页面数据
     * @param {Object} options 页面参数
     */
    initializePageData(options) {
        // 处理传入的数据
        const processedData = configManager.processIncomingGambleCardData(options);

        // 获取基础数据
        const gambleSysName = processedData.gambleSysName;
        const gameData = toJS(gameStore.gameData);
        const groupid = toJS(gameStore.gameData.groups[0].groupid);

        // 获取默认配置
        const defaultConfig = GambleMetaConfig.getDefaultGambleConfig(gambleSysName, processedData.players);

        // 计算洞范围配置
        const roadLength = gameData?.holeList?.length || 0;
        const holeRangeConfig = { startHoleindex: 1, roadLength };

        console.log("🉐💮🆚🉐💮🆚🉐💮🆚🉐💮🆚🉐💮🆚🉐💮🆚🉐💮🆚 processedData", processedData)

        const configData = {
            gambleSysName,
            gameData,
            gameDataType: typeof gameData,
            gameid: processedData.gameid,
            groupid,
            is8421Game: ['4p-8421', '3p-8421', '2p-8421'].includes(gambleSysName),
            needRedBlueDiv: GambleMetaConfig.needRedBlueDiv(gambleSysName),
            needsStroking: GambleMetaConfig.needsStroking(gambleSysName),
            players: processedData.players,
            userRule: processedData.userRule,
            // 洞范围配置：起始洞索引和道路长度
            holeRangeConfig,
            runtimeConfig: {
                gameid: processedData.gameid,
                groupid,
                userRuleId: processedData.userRuleId,
                gambleSysName,
                gambleUserName: processedData.gambleUserName,
                red_blue_config: defaultConfig.red_blue_config,
                bootstrap_order: defaultConfig.bootstrap_order,
                ranking_tie_resolve_config: defaultConfig.ranking_tie_resolve_config,
                playerIndicatorConfig: defaultConfig.playerIndicatorConfig
            }
        }

        // 使用 mixin 设置数据，只传递需要覆盖的字段
        setRuntimeConfigData(this, configData, {}, () => {
            console.log('[AddRuntime] initializePageData 数据设置完成，开始执行后续逻辑');
            this.createGambleRelatedConfig(processedData.editConfig);
        });
    },

    /**
     * 创建游戏相关配置
     * 处理特定游戏类型的配置需求，如8421游戏的球员指标配置
     * @param {Object} editConfig 编辑配置
     */
    createGambleRelatedConfig(editConfig) {
        if (!editConfig) return;

        // 加载玩家顺序配置
        if (editConfig.bootstrap_order) {
            try {
                const bootstrapOrder = typeof editConfig.bootstrap_order === 'string'
                    ? JSON.parse(editConfig.bootstrap_order)
                    : editConfig.bootstrap_order;

                if (Array.isArray(bootstrapOrder) && bootstrapOrder.length > 0) {
                    this.setData({ 'runtimeConfig.bootstrap_order': bootstrapOrder });
                }
            } catch (error) {
                console.warn('[AddRuntime] 解析 bootstrap_order 失败:', error);
            }
        }

        // 加载排名配置
        if (editConfig.ranking_tie_resolve_config) {
            this.setData({ 'runtimeConfig.ranking_tie_resolve_config': editConfig.ranking_tie_resolve_config });
        }

        // 8421初始化配置
        if (editConfig.gambleSysName?.includes('8421')) {
            const val8421Config = GambleRelatedInitor.getInit8421Values(this.data.players);
            this.setData({ 'runtimeConfig.playerIndicatorConfig': val8421Config });
        }
    },

    // 确认配置 - 使用共享方法
    async onConfirmConfig() {
        const { runtimeConfig, gambleSysName, players, gameid, groupid, configId } = this.data;

        // 从各个组件收集最新配置
        sharedCollectAllConfigs(this, this.data.needsStroking);

        // 验证配置
        if (!ConfigValidator.validateAndShow(runtimeConfig, players, gambleSysName)) {
            return { success: false, error: '配置验证失败' };
        }

        // 直接调用configManager.saveGambleConfig，明确指定跳转到gameDetail
        try {
            await configManager.saveGambleConfig(runtimeConfig, gameid, groupid, configId, this, false, 'gameDetail');
        } catch (error) {
            console.error('[AddRuntime] 保存配置失败:', error);
            return { success: false, error: error.message };
        }
    },

    // 收集所有组件的配置 - 使用共享方法
    collectAllConfigs() {
        sharedCollectAllConfigs(this, this.data.needsStroking);
    },

    // 让杆配置变化处理
    onStrokingConfigChange(e) {
        const { config } = e.detail;
        console.log('[AddRuntime] 让杆配置更新:', config);
        this.setData({
            'runtimeConfig.stroking_config': config
        });
    },

    // 球员指标配置变化处理
    onPlayerIndicatorConfigChange(e) {
        const { config } = e.detail;
        console.log('[AddRuntime] 球员指标配置更新:', config);
        this.setData({
            'runtimeConfig.playerIndicatorConfig': config
        });
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