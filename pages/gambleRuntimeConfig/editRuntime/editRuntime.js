/**
 * 编辑运行时配置页面
 * 专门处理编辑配置的逻辑
 */
const BaseConfig = require('../shared/baseConfig');
const ConfigValidator = require('../shared/configValidator');
const GameTypeManager = require('../../../utils/gameTypeManager');

Page({
    data: {
        // 传递的数据
        gambleSysName: '',
        gameId: null,
        configId: '',
        players: [],
        gameData: null,
        userRule: null,

        runtimeConfig: {
            gameid: null,           // 游戏ID
            groupid: null,          // 分组ID
            userRuleId: null,       // 用户规则ID(仅用户规则时有值)
            gambleSysName: null,    // 游戏系统名称(如:8421、gross、hole等)
            gambleUserName: null,   // 用户规则名称(如:规则_4721)
            red_blue_config: '4_固拉',
            bootstrap_order: [],
            ranking_tie_resolve_config: 'score.reverse',
            val8421_config: {}      // 球员8421指标配置
        },

        // 页面状态
        loading: false,
        error: null
    },

    onLoad(options) {
        console.log('[EditRuntime] 页面加载, 参数:', options);

        // 使用基础配置逻辑初始化页面
        const result = BaseConfig.initializePageData(options, this);

        if (!result.success) {
            console.error('[EditRuntime] 初始化失败:', result.error);
            return;
        }

        console.log('[EditRuntime] 页面初始化成功');
    },

    // 分组配置事件
    onGroupingConfigChange(e) {
        const { red_blue_config, bootstrap_order } = e.detail;
        console.log('[EditRuntime] 分组配置变更:', { red_blue_config, bootstrap_order });

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
        console.log('[EditRuntime] 排名配置变更:', ranking_tie_resolve_config);

        this.setData({
            'runtimeConfig.ranking_tie_resolve_config': ranking_tie_resolve_config
        });
    },

    // 8421配置事件
    onVal8421ConfigChange(e) {
        const { val8421Config } = e.detail;
        console.log('[EditRuntime] 8421配置变更:', val8421Config);

        this.setData({
            'runtimeConfig.val8421_config': val8421Config
        });
    },

    // 确认配置
    onConfirmConfig() {
        const { runtimeConfig, gambleSysName, gameId, configId, players } = this.data;

        console.log('[EditRuntime] 确认配置:', {
            runtimeConfig,
            gambleSysName,
            gameId,
            configId,
            playerCount: players.length
        });

        // 验证配置
        if (!ConfigValidator.validateAndShow(runtimeConfig, players, gambleSysName)) {
            return;
        }

        // 保存配置
        this.saveConfig();
    },

    // 保存配置
    async saveConfig() {
        const { runtimeConfig, gameId, configId } = this.data;

        console.log('[EditRuntime] 保存配置，数据检查:', {
            configId,
            configIdType: typeof configId,
            hasConfigId: !!configId,
            gameId,
            runtimeConfigKeys: Object.keys(runtimeConfig)
        });

        const result = await BaseConfig.saveConfig(runtimeConfig, gameId, configId, this, true);

        if (result.success) {
            console.log('[EditRuntime] 配置更新成功');
        } else {
            console.error('[EditRuntime] 配置更新失败:', result.error);
        }
    },

    // 重新选择规则
    onReSelectRule() {
        BaseConfig.onReSelectRule(this);
    },

    // 取消配置
    onCancelConfig() {
        BaseConfig.onCancelConfig(this);
    }
}); 