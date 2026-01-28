/**
 * 编辑运行时配置页面
 * 专门处理编辑配置的逻辑
 */
// 使用共享的导入和数据结构
const { getEditImportsWithMixin } = require('../shared/runtimeConfigImports');
const { getDefaultEditRuntimeConfigData } = require('../shared/runtimeConfigData');

const {
    GambleMetaConfig,
    runtimeStore,
    gameStore,
    holeRangeStore,
    toJS,
    setRuntimeConfigData,
    collectAllConfigs: sharedCollectAllConfigs,
    onReSelectRule: sharedOnReSelectRule,
    onCancelConfig: sharedOnCancelConfig,
    onConfirmConfigCommon
} = getEditImportsWithMixin();





Page({
    data: getDefaultEditRuntimeConfigData(),

    onLoad(options) {

        // 获取配置ID
        const configId = options.configId;
        if (!configId) {
            setRuntimeConfigData(this, { error: '缺少配置ID' });
            return;
        }

        // 优先使用 globalData 中的临时配置数据（来自 RuntimeConfigList 传递）
        const app = getApp();
        let existingRuntimeConfig = app.globalData.tempEditRuntimeConfig;
        
        console.log('[EditRuntime] 尝试从globalData获取临时配置:', existingRuntimeConfig);

        // 如果globalData中没有，再从 runtimeStore 中查找
        if (!existingRuntimeConfig) {
            console.log('[EditRuntime] globalData中无临时配置，从runtimeStore查询');
            existingRuntimeConfig = runtimeStore.runtimeConfigs.find(c => c.id === configId);
        }

        if (!existingRuntimeConfig) {
            console.error('[EditRuntime] 未找到配置数据，configId:', configId);
            setRuntimeConfigData(this, { error: '未找到配置数据' });
            return;
        }

        console.log('[EditRuntime] 已获取配置数据:', {
            configId: existingRuntimeConfig.id,
            gambleSysName: existingRuntimeConfig.gambleSysName,
            gameid: existingRuntimeConfig.gameid,
            groupid: existingRuntimeConfig.groupid
        });

        const gameData = toJS(gameStore.gameData);
        const gameDataType = typeof gameData;
        // 判断是否为8421游戏
        const is8421Game = ['4p-8421', '3p-8421', '2p-8421'].includes(existingRuntimeConfig.gambleSysName);

        // 判断是否需要让杆功能（只有lasi游戏需要）
        const needsStroking = existingRuntimeConfig.gambleSysName === '4p-lasi';

        // 使用统一的配置设置方法
        const configData = {
            // 现有运行时配置：从store中获取的完整配置数据
            configId: configId,
            existingRuntimeConfig,
            gambleSysName: existingRuntimeConfig.gambleSysName,
            gameData: gameData,
            gameDataType: gameDataType,
            gameid: existingRuntimeConfig.gameid,
            groupid: existingRuntimeConfig.groupid,
            is8421Game: is8421Game,
            needRedBlueDiv: GambleMetaConfig.needRedBlueDiv(existingRuntimeConfig.gambleSysName),
            needsStroking: needsStroking,
            players: existingRuntimeConfig.players,
            // 后端 t_gamble_x_runtime 表字段:
            // - bootstrap_order: JSON字符串 (前端通过 gambleUtils.js 解析为 bootstrap_order_parsed)
            // - playerIndicatorConfig: JSON字符串 (前端通过 gambleUtils.js 解析为 val8421_config_parsed)
            runtimeConfig: {
                gameid: existingRuntimeConfig.gameid,
                groupid: existingRuntimeConfig.groupid,
                userRuleId: existingRuntimeConfig.userRuleId,
                gambleSysName: existingRuntimeConfig.gambleSysName,
                gambleUserName: existingRuntimeConfig.gambleUserName,
                red_blue_config: existingRuntimeConfig.red_blue_config || '4_固拉',
                // 优先使用前端解析后的数组，否则使用原始字段
                bootstrap_order: existingRuntimeConfig.bootstrap_order_parsed || existingRuntimeConfig.bootstrap_order || [],
                ranking_tie_resolve_config: existingRuntimeConfig.ranking_tie_resolve_config || 'score.reverse_score',
                // 优先使用前端解析后的对象，否则使用原始字段
                playerIndicatorConfig: existingRuntimeConfig.val8421_config_parsed || existingRuntimeConfig.playerIndicatorConfig || {},
                stroking_config: existingRuntimeConfig.stroking_config || []
            }
        };

        setRuntimeConfigData(this, configData, {}, () => {
            console.log('[EditRuntime] 数据设置完成，当前页面数据:', {
                is8421Game: this.data.is8421Game,
                needsStroking: this.data.needsStroking,
                gambleSysName: this.data.gambleSysName,
                playerIndicatorConfig: this.data.runtimeConfig.playerIndicatorConfig,
                playerIndicatorConfigValues: Object.values(this.data.runtimeConfig.playerIndicatorConfig || {}),
                existingRuntimeConfig: this.data.existingRuntimeConfig,
                'existingRuntimeConfig.spec': this.data.existingRuntimeConfig?.spec,
                'spec.eatingRange': this.data.existingRuntimeConfig?.spec?.eatingRange
            });
        });

        // 设置 holeRangeStore 中的洞范围配置
        if (existingRuntimeConfig.startHoleindex !== undefined) {
            holeRangeStore.setStartIndex(Number.parseInt(existingRuntimeConfig.startHoleindex));
        }

        // 设置 holeRangeStore 中的道路长度配置
        if (existingRuntimeConfig.roadLength !== undefined) {
            holeRangeStore.setRoadLength(Number.parseInt(existingRuntimeConfig.roadLength));
        }
    },





    // 让杆配置变化处理
    onStrokingConfigChange(e) {
        const { config } = e.detail;
        console.log('[EditRuntime] 让杆配置更新:', config);
        this.setData({
            'runtimeConfig.stroking_config': config
        });
    },

    // 球员指标配置变化处理
    onPlayerIndicatorConfigChange(e) {
        const { config } = e.detail;
        console.log('[EditRuntime] 🎯 球员指标配置更新:', {
            config,
            values: Object.values(config),
            uniqueCount: new Set(Object.values(config)).size
        });
        this.setData({
            'runtimeConfig.playerIndicatorConfig': config
        });
    },

    // 确认配置 - 使用共享方法
    onConfirmConfig() {
        onConfirmConfigCommon(this, true); // true 表示编辑模式
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
    },

    // 页面卸载时清除临时数据
    onUnload() {
        const app = getApp();
        app.globalData.tempEditRuntimeConfig = null;
        console.log('[EditRuntime] 已清除globalData中的临时配置数据');
    }
}); 