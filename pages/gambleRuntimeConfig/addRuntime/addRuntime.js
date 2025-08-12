/**
 * 新增运行时配置页面
 * 专门处理新增配置的逻辑
 */
const ConfigValidator = require('../shared/configValidator');
const { GambleMetaConfig } = require('../../../utils/GambleMetaConfig');
const { gameStore } = require('../../../stores/gameStore');
const { toJS } = require('mobx-miniprogram');
const configManager = require('../../../utils/configManager');
const { holeRangeStore } = require('../../../stores/holeRangeStore');
const GambleRelatedInitor = require('../../../utils/GambleRelatedInitor');

Page({
    data: {
        // 传递的数据
        gambleSysName: '',
        gameid: null,
        groupid: null,
        players: [],
        gameData: null,
        userRule: null,
        needsPlayerConfig: false,
        needsGrouping: false,
        needsStroking: false,

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
    },

    onLoad(options) {
        console.log('🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 AddRuntime');

        // 初始化页面数据
        this.initializePageData(options);

        // 添加调试日志
        setTimeout(() => {
            this.setupDebugInfo();
        }, 100);
    },

    /**
     * 初始化页面数据
     * @param {Object} options 页面参数
     */
    initializePageData(options) {
        // 处理传入的数据
        const processedData = configManager.processIncomingData(options);

        // 设置页面数据
        const setDataObj = {
            gambleSysName: processedData.gambleSysName,
            gameid: processedData.gameid,
            groupid: processedData.groupid,
            configId: processedData.configId || '',
            players: processedData.players,
            gameData: processedData.gameData,
            userRule: processedData.userRule,
            'runtimeConfig.gameid': processedData.gameid,
            'runtimeConfig.groupid': processedData.groupid,
            'runtimeConfig.userRuleId': processedData.userRuleId,
            'runtimeConfig.gambleSysName': processedData.gambleSysName,
            'runtimeConfig.gambleUserName': processedData.gambleUserName
        };

        this.setData(setDataObj);
        this.createGambleRelatedConfig(processedData.editConfig);
    },

    /**
     * 设置调试信息
     */
    setupDebugInfo() {
        const { gambleSysName } = this.data;
        const needsPlayerConfig = GambleMetaConfig.needsPlayerConfig(gambleSysName);
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

        this.setData({
            config: config,
            groupid: groupid,
            'runtimeConfig.groupid': groupid,
            needsPlayerConfig: needsPlayerConfig,
            needsGrouping: needsGrouping,
            needsStroking: needsStroking,
            gameData: gameData,
            gameDataType: gameDataType,
        });
    },

    /**
     * 创建游戏相关配置
     * 处理特定游戏类型的配置需求，如8421游戏的球员指标配置
     * @param {Object} editConfig 编辑配置
     */
    createGambleRelatedConfig(editConfig) {
        console.log('[AddRuntime] 🟥🟧🟨🟥🟧🟨🟥🟧🟨🟥🟧🟨 editConfig== ', editConfig);

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
                this.setData({
                    'runtimeConfig.bootstrap_order': bootstrapOrder
                });
                console.log('[AddRuntime] 玩家顺序配置加载:', bootstrapOrder);
            }
        }

        // 加载排名配置
        if (editConfig?.ranking_tie_resolve_config) {
            this.setData({
                'runtimeConfig.ranking_tie_resolve_config': editConfig.ranking_tie_resolve_config
            });
            console.log('[AddRuntime] 排名配置加载:', editConfig.ranking_tie_resolve_config);
        }

        // 8421初始化配置
        if (editConfig.gambleSysName.includes('8421')) {
            const val8421Config = GambleRelatedInitor.getInit8421Values(this.data.players);
            this.setData({
                'runtimeConfig.playerIndicatorConfig': val8421Config
            });
        }



        console.log('[AddRuntime] 游戏相关配置创建完成');
    },

    // 确认配置
    onConfirmConfig() {
        const { runtimeConfig, gambleSysName, players } = this.data;

        // 从各个组件收集最新配置
        this.collectAllConfigs();

        // 验证配置
        if (!ConfigValidator.validateAndShow(runtimeConfig, players, gambleSysName)) {
            return;
        }

        // 保存配置
        this.saveConfig();
    },

    // 收集所有组件的配置
    collectAllConfigs() {
        console.log('[AddRuntime] 开始收集所有组件配置');

        // 调用 configManager 的统一收集方法，传入 needsStroking 参数
        const collectedConfig = configManager.collectAllConfigs(this, this.data.needsStroking);

        // 将收集到的配置设置到页面数据中
        if (Object.keys(collectedConfig).length > 0) {
            const setDataObj = {};
            for (const key of Object.keys(collectedConfig)) {
                setDataObj[`runtimeConfig.${key}`] = collectedConfig[key];
            }
            this.setData(setDataObj);
        }

        console.log('[AddRuntime] 收集配置完成，最终 runtimeConfig:', this.data.runtimeConfig);
    },

    // 保存配置
    async saveConfig() {
        const { runtimeConfig, gameid, groupid } = this.data;

        // 调用 configManager 的保存方法
        const result = await configManager.saveConfig(runtimeConfig, gameid, groupid, '', this, false);
        if (result.success) {
            console.log('[AddRuntime] 配置保存成功');
        } else {
            console.error('[AddRuntime] 配置保存失败:', result.error);
        }
    },

    // 重新选择规则
    onReSelectRule() {
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

    // 取消配置
    onCancelConfig() {
        console.log('[AddRuntime] 取消配置');
        wx.navigateBack();
    }
}); 