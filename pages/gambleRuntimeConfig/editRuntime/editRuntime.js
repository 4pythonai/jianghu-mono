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

        // 简化：直接从 runtimeStore 获取配置数据
        const configId = options.configId;
        if (!configId) {
            setRuntimeConfigData(this, { error: '缺少配置ID' });
            return;
        }

        // 从 runtimeStore 中查找对应的配置
        const existingRuntimeConfig = runtimeStore.runtimeConfigs.find(c => c.id === configId);

        if (!existingRuntimeConfig) {
            setRuntimeConfigData(this, { error: '未找到配置数据' });
            return;
        }


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
            runtimeConfig: {
                gameid: existingRuntimeConfig.gameid,
                groupid: existingRuntimeConfig.groupid,
                userRuleId: existingRuntimeConfig.userRuleId,
                gambleSysName: existingRuntimeConfig.gambleSysName,
                gambleUserName: existingRuntimeConfig.gambleUserName,
                red_blue_config: existingRuntimeConfig.red_blue_config || '4_固拉',
                bootstrap_order: existingRuntimeConfig.bootstrap_order_parsed || existingRuntimeConfig.bootstrap_order || [],
                ranking_tie_resolve_config: existingRuntimeConfig.ranking_tie_resolve_config || 'score.reverse',
                playerIndicatorConfig: existingRuntimeConfig.val8421_config_parsed || existingRuntimeConfig.playerIndicatorConfig || {},
                stroking_config: existingRuntimeConfig.stroking_config || []
            }
        };

        setRuntimeConfigData(this, configData, {}, () => {
            console.log('[EditRuntime] 数据设置完成，当前页面数据:', {
                is8421Game: this.data.is8421Game,
                needsStroking: this.data.needsStroking,
                gambleSysName: this.data.gambleSysName,
                existingRuntimeConfig: this.data.existingRuntimeConfig  // 添加现有配置的调试信息
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
    }
}); 