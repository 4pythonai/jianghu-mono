/**
 * 编辑运行时配置页面
 * 专门处理编辑配置的逻辑
 */
const BaseConfig = require('../shared/baseConfig');
const ConfigValidator = require('../shared/configValidator');
const { runtimeStore } = require('../../../stores/runtimeStore');
const { gameStore } = require('../../../stores/gameStore');
const { holeRangeStore } = require('../../../stores/holeRangeStore');
const { toJS } = require('mobx-miniprogram');

Page({
    data: {
        // 传递的数据
        gambleSysName: '',
        gameid: null,
        configId: '',
        players: [],

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
        error: null,

        // 调试信息字段
        gameDataType: '',
        gameDataString: ''
    },

    onLoad(options) {

        // 简化：直接从 runtimeStore 获取配置数据
        const configId = options.configId;
        if (!configId) {
            this.setData({
                error: '缺少配置ID'
            });
            return;
        }

        // 从 runtimeStore 中查找对应的配置
        const config = runtimeStore.runtimeConfigs.find(c => c.id === configId);

        if (!config) {
            this.setData({
                error: '未找到配置数据'
            });
            return;
        }


        // 从 gameStore 获取玩家数据

        // 获取 gameStore 中的 gameData
        const gameData = toJS(gameStore.gameData);

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


        // 直接设置配置数据
        this.setData({
            config: config,
            configId: configId,
            gambleSysName: config.gambleSysName,
            gameid: config.gameid,
            groupid: config.groupid, // 添加 groupid 到页面数据
            players: config.players,
            gameData: gameData, // 添加 gameData
            gameDataType: gameDataType,
            gameDataString: gameDataString,
            'runtimeConfig.gameid': config.gameid,
            'runtimeConfig.groupid': config.groupid,
            'runtimeConfig.userRuleId': config.userRuleId,
            'runtimeConfig.gambleSysName': config.gambleSysName,
            'runtimeConfig.gambleUserName': config.gambleUserName,
            'runtimeConfig.red_blue_config': config.red_blue_config || '4_固拉',
            'runtimeConfig.bootstrap_order': config.bootstrap_order_parsed || config.bootstrap_order || [],
            'runtimeConfig.ranking_tie_resolve_config': config.ranking_tie_resolve_config || 'score.reverse',
            'runtimeConfig.playerIndicatorConfig': config.val8421_config_parsed || config.playerIndicatorConfig || {}
        });



        // 设置 holeRangeStore 中的洞范围配置
        if (config.startHoleindex !== undefined) {
            holeRangeStore.setStartIndex(Number.parseInt(config.startHoleindex));
        }

        // 设置 holeRangeStore 中的道路长度配置
        if (config.roadLength !== undefined) {
            holeRangeStore.setRoadLength(Number.parseInt(config.roadLength));
        }


        console.log('[EditRuntime] 页面初始化成功');
    },





    // 确认配置
    onConfirmConfig() {
        const { runtimeConfig, gambleSysName, gameid, configId, players } = this.data;

        // 从各个组件收集最新配置
        this.collectAllConfigs();

        console.log('[EditRuntime] 确认配置:', {
            runtimeConfig,
            gambleSysName,
            gameid,
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

    // 收集所有组件的配置
    collectAllConfigs() {
        // 从洞范围选择器获取配置
        const holeRangeSelector = this.selectComponent('#holeRangeSelector');
        if (holeRangeSelector) {
            const holeConfig = holeRangeSelector.getConfig();
            if (holeConfig) {
                console.log('🕳️ [EditRuntime] 收集洞范围配置:', holeConfig);
                this.setData({
                    'runtimeConfig.startHoleindex': holeConfig.startHoleindex,
                    'runtimeConfig.endHoleindex': holeConfig.endHoleindex,
                    'runtimeConfig.roadLength': holeConfig.roadLength,
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
        const { runtimeConfig, gameid, groupid, configId } = this.data;

        // 直接调用BaseConfig的保存方法，避免重复逻辑
        const result = await BaseConfig.saveConfig(runtimeConfig, gameid, groupid, configId, this, true);

        if (result?.success) {
            console.log('[EditRuntime] 配置更新成功');
        } else {
            console.error('[EditRuntime] 配置更新失败:', result?.error);
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

    // 页面滚动时打印并透传 scrollTop 给 RedBlueConfig -> PlayerDrag
    onPageScroll(e) {
        const currentScrollTop = e?.scrollTop || 0;
        console.log('[EditRuntime] onPageScroll scrollTop =', currentScrollTop);

        const redBlueConfig = this.selectComponent('#redBlueConfig');
        if (redBlueConfig) {
            redBlueConfig.setData({ scrollTop: currentScrollTop });
        }
    }
}); 