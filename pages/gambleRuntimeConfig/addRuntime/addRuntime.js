/**
 * 新增运行时配置页面
 * 专门处理新增配置的逻辑
 */
const BaseConfig = require('../shared/baseConfig');
const ConfigValidator = require('../shared/configValidator');
const { GameConfig } = require('../../../utils/gameConfig');
const { gameStore } = require('../../../stores/gameStore');
const { toJS } = require('mobx-miniprogram');

Page({
    data: {
        // 传递的数据
        gambleSysName: '',
        gameId: null,
        players: [],
        gameData: null,
        userRule: null,
        needsPlayerConfig: false,
        needsGrouping: false,

        runtimeConfig: {
            gameid: null,           // 游戏ID
            groupid: null,          // 分组ID
            userRuleId: null,       // 用户规则ID(仅用户规则时有值)
            gambleSysName: null,    // 游戏系统名称(如:8421、gross、hole等)
            gambleUserName: null,   // 用户规则名称(如:规则_4721)
            red_blue_config: '4_固拉',
            stroking_config: [],    // 让杆配置，初始为空数组
            bootstrap_order: [],
            ranking_tie_resolve_config: 'indicator.reverse',
            playerIndicatorConfig: {}      // 球员8421指标配置
        },

        // 页面状态
        loading: false,
        error: null,

        // 调试信息字段
        gameDataType: '',
        gameDataString: ''
    },

    onLoad(options) {
        console.log('[AddRuntime] 页面加载, 参数:', options);

        // 使用基础配置逻辑初始化页面
        const result = BaseConfig.initializePageData(options, this);

        if (!result.success) {
            console.error('[AddRuntime] 初始化失败:', result.error);
            return;
        }

        // 添加调试日志
        setTimeout(() => {
            const { gambleSysName } = this.data;
            const needsPlayerConfig = GameConfig.needsPlayerConfig(gambleSysName);
            const needsGrouping = GameConfig.needsGrouping(gambleSysName);

            // 获取 gameStore 中的 gameData
            const gameData = toJS(gameStore.gameData);
            console.log('[AddRuntime] gameStore.gameData:', gameData);

            // 计算调试信息
            const gameDataType = typeof gameData;

            // 只提取 holeList 中的 hindex, holename, unique_key
            let gameDataString = '';
            if (gameData && gameData.holeList && Array.isArray(gameData.holeList)) {
                const holeListInfo = gameData.holeList.map(hole => ({
                    hindex: hole.hindex,
                    holename: hole.holename,
                    unique_key: hole.unique_key
                }));
                gameDataString = JSON.stringify(holeListInfo, null, 2);
            }

            this.setData({
                needsPlayerConfig: needsPlayerConfig,
                needsGrouping: needsGrouping,
                gameData: gameData,
                gameDataType: gameDataType,
                gameDataString: gameDataString
            });

        }, 100);

    },

    // stroking_config 事件处理
    saveStroking(e) {
        const { config } = e.detail;
        console.log('[AddRuntime] Stroking配置变更:', config);

        this.setData({
            'runtimeConfig.stroking_config': config
        });
    },




    // 分组配置事件
    onGroupingConfigChange(e) {
        const { red_blue_config, bootstrap_order } = e.detail;
        console.log('[AddRuntime] 分组配置变更:', { red_blue_config, bootstrap_order });

        // 确保bootstrap_order是数字数组
        const playerIds = bootstrap_order.map(id => Number.parseInt(id));

        this.setData({
            'runtimeConfig.red_blue_config': red_blue_config,
            'runtimeConfig.bootstrap_order': playerIds
        });
    },

    // 排名配置事件
    onRankingConfigChange(e) {
        const { ranking_tie_resolve_config } = e.detail;

        this.setData({
            'runtimeConfig.ranking_tie_resolve_config': ranking_tie_resolve_config
        });
    },

    // 8421配置事件
    onVal8421ConfigChange(e) {
        const { val8421Config } = e.detail;
        this.setData({
            'runtimeConfig.playerIndicatorConfig': val8421Config
        });
    },

    // 确认配置
    onConfirmConfig() {
        const { runtimeConfig, gambleSysName, gameId, players } = this.data;

        // 打印完整配置信息
        console.log('[AddRuntime] 准备保存配置:');
        console.log('- 游戏系统名称:', gambleSysName);
        console.log('- 游戏ID:', gameId);
        console.log('- 玩家数量:', players.length);
        console.log('- 完整运行时配置:', runtimeConfig);
        console.log('- Stroking配置:', runtimeConfig.stroking_config);
        console.log('- 分组配置:', runtimeConfig.red_blue_config);
        console.log('- 启动顺序:', runtimeConfig.bootstrap_order);
        console.log('- 排名配置:', runtimeConfig.ranking_tie_resolve_config);
        console.log('- 球员指标配置:', runtimeConfig.playerIndicatorConfig);

        // 验证配置
        if (!ConfigValidator.validateAndShow(runtimeConfig, players, gambleSysName)) {
            return;
        }

        // 保存配置
        this.saveConfig();
    },

    // 保存配置
    async saveConfig() {
        const { runtimeConfig, gameId, groupId } = this.data;

        console.log('[AddRuntime] 保存配置，参数检查:', {
            gameId,
            groupId,
            groupIdType: typeof groupId,
            hasGroupId: !!groupId
        });

        const result = await BaseConfig.saveConfig(runtimeConfig, gameId, groupId, '', this, false);

        if (result.success) {
            console.log('[AddRuntime] 配置保存成功');
        } else {
            console.error('[AddRuntime] 配置保存失败:', result.error);
        }
    },

    // 重新选择规则
    onReSelectRule() {
        BaseConfig.onReSelectRule(this);
    },

    // 取消配置
    onCancelConfig() {
        BaseConfig.onCancelConfig(this);
    },


}); 