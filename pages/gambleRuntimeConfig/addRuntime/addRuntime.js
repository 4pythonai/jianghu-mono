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
            const needsPlayerConfig = GameConfig.needsPlayerConfig(gambleSysName);
            const needsGrouping = GameConfig.needsGrouping(gambleSysName);
            const needsStroking = GameConfig.needsStroking(gambleSysName);

            // 获取 gameStore 中的 gameData
            const gameData = toJS(gameStore.gameData);
            console.log('[AddRuntime] gameStore.gameData:', gameData);

            // 计算调试信息
            const gameDataType = typeof gameData;

            // 只提取 holeList 中的 hindex, holename, unique_key
            let gameDataString = '';
            if (gameData?.holeList && Array.isArray(gameData.holeList)) {
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
                needsStroking: needsStroking,
                gameData: gameData,
                gameDataType: gameDataType,
                gameDataString: gameDataString
            });

        }, 100);
    },


    // 确认配置
    onConfirmConfig() {
        const { runtimeConfig, gambleSysName, gameId, players } = this.data;

        // 从各个组件收集最新配置
        this.collectAllConfigs();

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

    // 收集所有组件的配置
    collectAllConfigs() {
        // 从洞范围选择器获取配置
        const holeRangeSelector = this.selectComponent('#holeRangeSelector');
        if (holeRangeSelector) {
            const holeConfig = holeRangeSelector.getConfig();
            if (holeConfig) {
                this.setData({
                    'runtimeConfig.startHoleindex': holeConfig.startHoleindex,
                    'runtimeConfig.endHoleindex': holeConfig.endHoleindex,
                    'runtimeConfig.holePlayListStr': holeConfig.holePlayListStr
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
            if (groupConfig) {
                this.setData({
                    'runtimeConfig.red_blue_config': groupConfig.red_blue_config,
                    'runtimeConfig.bootstrap_order': groupConfig.bootstrap_order
                });
            }
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
    }

}); 