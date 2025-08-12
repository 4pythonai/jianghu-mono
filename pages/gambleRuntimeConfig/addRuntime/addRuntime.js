/**
 * 新增运行时配置页面
 * 专门处理新增配置的逻辑
 */
const BaseConfig = require('../shared/baseConfig');
const ConfigValidator = require('../shared/configValidator');
const { GambleItemConfig } = require('../../../utils/gambleConfig');
const { gameStore } = require('../../../stores/gameStore');
const { toJS } = require('mobx-miniprogram');

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
            const needsPlayerConfig = GambleItemConfig.needsPlayerConfig(gambleSysName);
            const needsGrouping = GambleItemConfig.needsGrouping(gambleSysName);
            const needsStroking = GambleItemConfig.needsStroking(gambleSysName);

            // 获取 gameStore 中的 gameData
            const gameData = toJS(gameStore.gameData);
            const groupid = toJS(gameStore.gameData.groups[0].groupid); // 从 gameStore 获取 groupid

            // 计算调试信息
            const gameDataType = typeof gameData;

            // 只提取 holeList 中的 hindex, holename, unique_key
            let gameDataString = '';
            let roadLength = 0;
            if (gameData?.holeList && Array.isArray(gameData.holeList)) {
                gameDataString = JSON.stringify(gameData, null, 2);
                roadLength = gameData.holeList.length;
            }

            const config = {
                startHoleindex: 1,
                roadLength: roadLength,
            }

            this.setData({
                config: config,
                groupid: groupid,
                'runtimeConfig.groupid': groupid, // 使用 gameStore.groupid 设置 runtimeConfig 中的 groupid
                needsPlayerConfig: needsPlayerConfig,
                needsGrouping: needsGrouping,
                needsStroking: needsStroking,
                gameData: gameData,
                gameDataType: gameDataType,
                gameDataString: gameDataString
            });

        }, 100);

        // 添加更多调试信息
        setTimeout(() => {
            console.log('[AddRuntime] 页面加载完成后的状态:', {
                runtimeConfig: this.data.runtimeConfig,
                bootstrapOrder: this.data.runtimeConfig.bootstrap_order,
                bootstrapOrderType: typeof this.data.runtimeConfig.bootstrap_order,
                isArray: Array.isArray(this.data.runtimeConfig.bootstrap_order),
                players: this.data.players?.map(p => ({ userid: p.userid, type: typeof p.userid }))
            });
        }, 200);
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

        // 从洞范围选择器获取配置
        const holeRangeSelector = this.selectComponent('#holeRangeSelector');
        if (holeRangeSelector) {
            const holeConfig = holeRangeSelector.getConfig();
            if (holeConfig) {
                this.setData({
                    'runtimeConfig.startHoleindex': holeConfig.startHoleindex,
                    'runtimeConfig.endHoleindex': holeConfig.endHoleindex,
                    'runtimeConfig.roadLength': holeConfig.roadLength,
                });
            }
        }

        // 从让杆配置组件获取配置
        const stroking = this.selectComponent('#stroking');
        if (stroking && this.data.needsStroking) {
            const strokingConfig = stroking.getConfig();
            if (strokingConfig) {
                this.setData({
                    'runtimeConfig.stroking_config': strokingConfig
                });
            }
        }

        // 从8421球员配置组件获取配置
        const playerIndicator = this.selectComponent('#playerIndicator');
        if (playerIndicator) {
            const playerConfig = playerIndicator.getConfig();
            if (playerConfig) {
                this.setData({
                    'runtimeConfig.playerIndicatorConfig': playerConfig
                });
            }
        }

        // 从分组配置组件获取配置
        const redBlueConfig = this.selectComponent('#redBlueConfig');
        if (redBlueConfig) {
            const groupConfig = redBlueConfig.getConfig();
            console.log('[AddRuntime] RedBlueConfig 组件配置:', groupConfig);
            if (groupConfig) {
                const oldBootstrapOrder = this.data.runtimeConfig.bootstrap_order;
                this.setData({
                    'runtimeConfig.red_blue_config': groupConfig.red_blue_config,
                    'runtimeConfig.bootstrap_order': groupConfig.bootstrap_order
                });
                console.log('[AddRuntime] 设置分组配置后:', {
                    red_blue_config: this.data.runtimeConfig.red_blue_config,
                    bootstrap_order: this.data.runtimeConfig.bootstrap_order,
                    oldBootstrapOrder,
                    newBootstrapOrder: groupConfig.bootstrap_order,
                    bootstrapOrderType: typeof groupConfig.bootstrap_order,
                    isArray: Array.isArray(groupConfig.bootstrap_order)
                });
            }
        } else {
            console.warn('[AddRuntime] 未找到 RedBlueConfig 组件');
        }

        // 从排名配置组件获取配置
        const rankConfig = this.selectComponent('#rankConfig');
        if (rankConfig) {
            const rankingConfig = rankConfig.getConfig();
            if (rankingConfig) {
                this.setData({
                    'runtimeConfig.ranking_tie_resolve_config': rankingConfig
                });
            }
        }

        console.log('[AddRuntime] 收集配置完成，最终 runtimeConfig:', this.data.runtimeConfig);
    },

    // 保存配置
    async saveConfig() {
        const { runtimeConfig, gameid, groupid } = this.data;

        console.log('[AddRuntime] 保存配置，参数检查:', {
            gameid,
            groupid,
            groupIdType: typeof groupid,
            hasGroupId: !!groupid
        });

        const result = await BaseConfig.saveConfig(runtimeConfig, gameid, groupid, '', this, false);

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
    }

}); 