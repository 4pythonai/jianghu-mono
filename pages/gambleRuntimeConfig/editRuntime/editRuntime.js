/**
 * 编辑运行时配置页面
 * 专门处理编辑配置的逻辑
 */
const BaseConfig = require('../shared/baseConfig');
const ConfigValidator = require('../shared/configValidator');
const GameTypeManager = require('../../../utils/gameTypeManager');
const { runtimeStore } = require('../../../stores/runtimeStore');
const { gameStore } = require('../../../stores/gameStore');
const { toJS } = require('mobx-miniprogram');

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

        console.log('[EditRuntime] 找到配置数据:', config);

        // 从 gameStore 获取玩家数据
        const players = gameStore.players || [];
        console.log('[EditRuntime] 获取玩家数据:', {
            playersCount: players.length,
            players: players.map(p => ({ userid: p.userid, nickname: p.nickname }))
        });

        // 直接设置配置数据
        this.setData({
            configId: configId,
            gambleSysName: config.gambleSysName,
            gameId: config.gameid,
            players: players,
            'runtimeConfig.gameid': config.gameid,
            'runtimeConfig.groupid': config.groupid,
            'runtimeConfig.userRuleId': config.userRuleId,
            'runtimeConfig.gambleSysName': config.gambleSysName,
            'runtimeConfig.gambleUserName': config.gambleUserName,
            'runtimeConfig.red_blue_config': config.red_blue_config || '4_固拉',
            'runtimeConfig.bootstrap_order': config.bootstrap_order_parsed || config.bootstrap_order || [],
            'runtimeConfig.ranking_tie_resolve_config': config.ranking_tie_resolve_config || 'score.reverse',
            'runtimeConfig.val8421_config': config.val8421_config_parsed || config.val8421_config || {}
        });

        // 设置 gameStore 中的洞范围配置
        if (config.startHoleindex !== undefined && config.endHoleindex !== undefined) {
            gameStore.startHoleindex = Number.parseInt(config.startHoleindex);
            gameStore.endHoleindex = Number.parseInt(config.endHoleindex);
            console.log('[EditRuntime] 设置洞范围配置:', {
                startHoleindex: gameStore.startHoleindex,
                endHoleindex: gameStore.endHoleindex
            });
        }

        // 根据 holePlayListStr 重新设置 gameStore 中的 holePlayList
        if (config.holePlayListStr) {
            try {
                // 解析 holePlayListStr，例如 "3,4,5,6,7,8,9,1,2"
                const holeIndexes = config.holePlayListStr.split(',').map(index => Number.parseInt(index.trim()));
                console.log('[EditRuntime] 解析 holePlayListStr:', {
                    holePlayListStr: config.holePlayListStr,
                    holeIndexes
                });

                // 根据 hindex 重新排序 holeList
                const { holeList } = gameStore.getState();
                if (holeList && holeList.length > 0) {
                    // 使用 toJS 将 observable 对象转换为普通对象
                    const plainHoleList = toJS(holeList);
                    const newHolePlayList = holeIndexes.map(hindex => {
                        const hole = plainHoleList.find(h => h.hindex === hindex);
                        return hole || { hindex, holename: `B${hindex}` };
                    }).filter(hole => hole); // 过滤掉未找到的洞
                    gameStore.holePlayList = newHolePlayList;

                    // 根据 startHoleindex 和 endHoleindex 设置 rangeHolePlayList
                    if (config.startHoleindex !== undefined && config.endHoleindex !== undefined) {
                        const startIndex = Number.parseInt(config.startHoleindex);
                        const endIndex = Number.parseInt(config.endHoleindex);

                        // 确保 startIndex <= endIndex
                        const minIndex = Math.min(startIndex, endIndex);
                        const maxIndex = Math.max(startIndex, endIndex);

                        // 从 newHolePlayList 中找到对应范围的洞
                        const rangeHolePlayList = newHolePlayList.filter(hole => {
                            const hindex = hole.hindex;
                            return hindex >= minIndex && hindex <= maxIndex;
                        });

                        // 更新 gameStore 中的 rangeHolePlayList
                        gameStore.rangeHolePlayList = rangeHolePlayList;

                        console.log('🈴🈴🈴 设置 rangeHolePlayList:', {
                            startHoleindex: startIndex,
                            endHoleindex: endIndex,
                            rangeHolePlayList: rangeHolePlayList.map(h => ({ hindex: h.hindex, holename: h.holename }))
                        });
                    }
                }




            } catch (error) {
                console.error('[EditRuntime] 解析 holePlayListStr 失败:', error);
            }
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