/**
 * 编辑运行时配置页面
 * 专门处理编辑配置的逻辑
 */
// 使用共享的导入和数据结构
const { getEditImportsWithMixin } = require('../shared/runtimeConfigImports');
const { getDefaultEditRuntimeConfigData } = require('../shared/runtimeConfigData');

const {
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
        const config = runtimeStore.runtimeConfigs.find(c => c.id === configId);

        if (!config) {
            setRuntimeConfigData(this, { error: '未找到配置数据' });
            return;
        }


        const gameData = toJS(gameStore.gameData);
        const gameDataType = typeof gameData;
        // 判断是否为8421游戏
        const is8421Game = ['4p-8421', '3p-8421', '2p-8421'].includes(config.gambleSysName);

        // 判断是否需要让杆功能（只有lasi游戏需要）
        const needsStroking = config.gambleSysName === '4p-lasi';

        // 使用统一的配置设置方法
        const configData = {
            config: config,
            configId: configId,
            gambleSysName: config.gambleSysName,
            gameid: config.gameid,
            groupid: config.groupid,
            players: config.players,
            gameData: gameData,
            gameDataType: gameDataType,
            is8421Game: is8421Game,
            needsStroking: needsStroking,
            runtimeConfig: {
                gameid: config.gameid,
                groupid: config.groupid,
                userRuleId: config.userRuleId,
                gambleSysName: config.gambleSysName,
                gambleUserName: config.gambleUserName,
                red_blue_config: config.red_blue_config || '4_固拉',
                bootstrap_order: config.bootstrap_order_parsed || config.bootstrap_order || [],
                ranking_tie_resolve_config: config.ranking_tie_resolve_config || 'score.reverse',
                playerIndicatorConfig: config.val8421_config_parsed || config.playerIndicatorConfig || {},
                stroking_config: config.stroking_config || []
            }
        };

        setRuntimeConfigData(this, configData);



        // 设置 holeRangeStore 中的洞范围配置
        if (config.startHoleindex !== undefined) {
            holeRangeStore.setStartIndex(Number.parseInt(config.startHoleindex));
        }

        // 设置 holeRangeStore 中的道路长度配置
        if (config.roadLength !== undefined) {
            holeRangeStore.setRoadLength(Number.parseInt(config.roadLength));
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
    },

    // 页面滚动时打印并透传 scrollTop 给 RedBlueConfig -> PlayerDrag
    onPageScroll(e) {
        const currentScrollTop = e?.scrollTop || 0;
        const redBlueConfig = this.selectComponent('#redBlueConfig');
        if (redBlueConfig) {
            redBlueConfig.setData({ scrollTop: currentScrollTop });
        }
    }
}); 