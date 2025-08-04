/**
 * 新增运行时配置页面
 * 专门处理新增配置的逻辑
 */
const BaseConfig = require('../shared/baseConfig');
const ConfigValidator = require('../shared/configValidator');
const GameTypeManager = require('../../../utils/gameTypeManager');

Page({
    data: {
        // 传递的数据
        gambleSysName: '',
        gameId: null,
        players: [],
        gameData: null,
        userRule: null,
        needsPlayerConfig: false,

        runtimeConfig: {
            gameid: null,           // 游戏ID
            groupid: null,          // 分组ID
            userRuleId: null,       // 用户规则ID(仅用户规则时有值)
            gambleSysName: null,    // 游戏系统名称(如:8421、gross、hole等)
            gambleUserName: null,   // 用户规则名称(如:规则_4721)
            red_blue_config: '4_固拉',
            bootstrap_order: [],
            ranking_tie_resolve_config: 'indicator.reverse',
            playerIndicatorConfig: {}      // 球员8421指标配置
        },

        // 页面状态
        loading: false,
        error: null
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
            const needsPlayerConfig = GameTypeManager.needsPlayerConfig(gambleSysName);

            this.setData({
                needsPlayerConfig: needsPlayerConfig
            });

            console.log('[AddRuntime] 调试 gambleSysName:', {
                value: gambleSysName,
                type: typeof gambleSysName,
                length: gambleSysName?.length,
                indexOf8421: gambleSysName?.indexOf('8421'),
                condition: gambleSysName?.indexOf('8421') !== -1,
                needsPlayerConfig: needsPlayerConfig
            });
        }, 100);

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


        // 验证配置
        if (!ConfigValidator.validateAndShow(runtimeConfig, players, gambleSysName)) {
            return;
        }

        // 保存配置
        this.saveConfig();
    },

    // 保存配置
    async saveConfig() {
        const { runtimeConfig, gameId } = this.data;

        const result = await BaseConfig.saveConfig(runtimeConfig, gameId, '', this, false);

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