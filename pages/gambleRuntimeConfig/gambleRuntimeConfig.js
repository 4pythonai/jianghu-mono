const app = getApp();
Page({
    data: {
        // 传递的数据
        ruleType: '',
        gameId: null,
        players: [],
        holeList: [],
        gameData: null,
        userRule: null, // 用户规则数据

        runtimeConfig: {
            // 起点洞与终点洞配置
            startHoleindex: 1,
            endHoleindex: 18,

            // 分组配置 - 直接在顶层
            red_blue_config: '4_固拉',
            bootstrap_order: [],

            // 排名配置
            ranking_tie_resolve_config: 'score.reverse',

            // 新增字段
            gameid: null,           // 游戏ID
            groupid: null,          // 分组ID
            userRuleId: null,       // 用户规则ID(仅用户规则时有值)
            gambleSysName: null,    // 游戏系统名称(如:8421、gross、hole等)
            gambleUserName: null,   // 用户规则名称(如:规则_4721)
            val8421_config: {}      // 球员8421指标配置
        },

        // 页面状态
        loading: false,
        error: null
    },

    onLoad(options) {
        console.log('[GambleRuntimeConfig] 页面加载, 参数::', JSON.parse(decodeURIComponent(options.data)));
        try {
            // 解析传递的数据
            if (options.data) {
                const decodedData = JSON.parse(decodeURIComponent(options.data));
                console.log('[GambleRuntimeConfig] 解析数据:', decodedData);

                let players = [];
                let holeList = [];
                let gameData = null;
                let userRule = null;

                // 统一从全局数据获取完整信息
                const app = getApp();
                const globalData = app.globalData || {};

                // 检查是否有全局数据
                if (!globalData.currentGameData) {
                    console.warn('[GambleRuntimeConfig] 全局数据为空, 使用默认值');
                    players = [];
                    holeList = [];
                    gameData = null;
                } else {
                    players = globalData.currentGameData.players || [];
                    holeList = globalData.currentGameData.holeList || [];
                    gameData = globalData.currentGameData.gameData || null;
                }

                // 只有从用户规则进入时才有用户规则数据
                if (decodedData.fromUserRule) {
                    userRule = globalData.currentUserRule || null;

                    console.log('[GambleRuntimeConfig] 从用户规则进入, 全局数据:', {
                        players: players.length,
                        holeList: holeList.length,
                        userRule: userRule?.gambleUserName
                    });
                } else {
                    userRule = null;

                    console.log('[GambleRuntimeConfig] 从系统规则进入, 全局数据:', {
                        players: players.length,
                        holeList: holeList.length,
                        ruleType: decodedData.ruleType
                    });
                }

                // 根据holeList设置初始洞范围
                let initialFirstHole = 0;
                let initialLastHole = 0;

                if (holeList && holeList.length > 0) {
                    // 用index初始化
                    initialFirstHole = 0;
                    initialLastHole = holeList.length - 1;
                }

                // 从gameStore获取游戏相关数据
                const { gameStore } = require('../../stores/gameStore');

                // 设置新增字段
                let gambleSysName = null;
                let userRuleId = null;
                let gambleUserName = null;

                if (decodedData.fromUserRule && userRule) {
                    // 从用户规则进入, 直接从userRule获取
                    gambleSysName = userRule.gambleSysName;
                    userRuleId = userRule.userRuleId;
                    gambleUserName = userRule.gambleUserName;
                }

                this.setData({
                    ruleType: decodedData.ruleType || '',
                    gameId: decodedData.gameId || null,
                    players: players,
                    holeList: holeList,
                    gameData: gameData,
                    userRule: userRule,
                    'runtimeConfig.startHoleindex': initialFirstHole,
                    'runtimeConfig.endHoleindex': initialLastHole,
                    'runtimeConfig.gameid': gameStore.gameid,
                    'runtimeConfig.groupid': gameStore.groupId,
                    'runtimeConfig.userRuleId': userRuleId,
                    'runtimeConfig.gambleSysName': gambleSysName,
                    'runtimeConfig.gambleUserName': gambleUserName
                });

                console.log('[GambleRuntimeConfig] 运行时配置字段设置:', {
                    gameid: gameStore.gameid,
                    groupid: gameStore.groupId,
                    userRuleId: userRuleId,
                    gambleSysName: gambleSysName,
                    gambleUserName: gambleUserName,
                    fromUserRule: decodedData.fromUserRule
                });

                // 初始化分组配置
                this.initializeGroupingConfig();

                // 初始化8421配置(仅在8421游戏时)
                this.initialize8421Config();
            }
        } catch (error) {
            console.error('[GambleRuntimeConfig] 数据解析失败:', error);
            this.setData({
                error: '数据解析失败'
            });
        }
    },

    // 页面销毁时清理全局数据
    onUnload() {
        console.log('[GambleRuntimeConfig] 页面销毁, 清理全局数据');
        const app = getApp();
        if (app.globalData) {
            app.globalData.currentUserRule = undefined;
            app.globalData.currentGameData = undefined;
        }
    },


    // 初始化分组配置
    initializeGroupingConfig() {
        const { players, ruleType } = this.data;

        // 检查是否需要分组(3人或4人游戏)
        const playerCount = players.length;
        const needGrouping = (playerCount === 3 || playerCount === 4) &&
            (ruleType.includes('3p-') || ruleType.includes('4p-'));

        // 将玩家对象转换为用户ID数组
        const playerIds = players.map(player => Number.parseInt(player.user_id || player.userid));

        if (needGrouping) {
            this.setData({
                'runtimeConfig.red_blue_config': '4_固拉',
                'runtimeConfig.bootstrap_order': playerIds
            });
        } else {
            this.setData({
                'runtimeConfig.bootstrap_order': playerIds
            });
        }

        console.log('[GambleRuntimeConfig] 分组配置初始化:', {
            needGrouping,
            playerCount,
            ruleType,
            playerIds
        });
    },

    // 初始化8421配置
    initialize8421Config() {
        const { players, ruleType } = this.data;

        // 检查是否是8421游戏
        const is8421Game = ruleType.includes('8421');

        if (is8421Game && players.length > 0) {
            // 为每个球员设置默认8421配置
            const defaultConfig = {
                "Birdie": 8,
                "Par": 4,
                "Par+1": 2,
                "Par+2": 1
            };

            const val8421Config = {};
            for (const player of players) {
                const userid = String(player.userid || player.user_id);
                val8421Config[userid] = { ...defaultConfig };
            }

            this.setData({
                'runtimeConfig.val8421_config': val8421Config
            });

            console.log('[GambleRuntimeConfig] 8421配置初始化:', {
                is8421Game,
                playerCount: players.length,
                val8421Config
            });
        }
    },

    // 重新选择赌博规则
    onReSelectRule() {
        console.log('[GambleRuntimeConfig] 重新选择规则');

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

    // 洞范围选择事件
    onHoleRangeChange(e) {
        let { startHoleindex, endHoleindex } = e.detail;
        // 自动转换为数字, 保证类型一致
        startHoleindex = Number(startHoleindex);
        endHoleindex = Number(endHoleindex);
        console.log('[GambleRuntimeConfig] 洞范围变更:', { startHoleindex, endHoleindex });

        // 直接用 unique_key, 不要转数字
        this.setData({
            'runtimeConfig.startHoleindex': startHoleindex,
            'runtimeConfig.endHoleindex': endHoleindex
        });
    },

    // 分组配置事件
    onGroupingConfigChange(e) {
        const { red_blue_config, bootstrap_order } = e.detail;
        console.log('[GambleRuntimeConfig] 分组配置变更:', { red_blue_config, bootstrap_order });

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
        console.log('[GambleRuntimeConfig] 排名配置变更:', ranking_tie_resolve_config);

        this.setData({
            'runtimeConfig.ranking_tie_resolve_config': ranking_tie_resolve_config
        });
    },

    // 8421配置事件
    onVal8421ConfigChange(e) {
        const { val8421Config } = e.detail;
        console.log('[GambleRuntimeConfig] 8421配置变更:', val8421Config);

        this.setData({
            'runtimeConfig.val8421_config': val8421Config
        });
    },

    // 确认配置
    onConfirmConfig() {
        const { runtimeConfig, ruleType, gameId, players } = this.data;

        // 验证配置
        if (!this.validateConfig()) {
            return;
        }

        // 保存配置并返回
        this.saveRuntimeConfig();
    },

    // 验证配置
    validateConfig() {
        const { runtimeConfig, players, ruleType } = this.data;

        // 验证洞范围
        if (runtimeConfig.startHoleindex > runtimeConfig.endHoleindex) {
            wx.showToast({
                title: '起始洞不能大于结束洞',
                icon: 'none'
            });
            return false;
        }

        // 验证分组配置
        {
            const playersOrderCount = runtimeConfig.bootstrap_order.length;

            if (playersOrderCount !== players.length) {
                wx.showToast({
                    title: '玩家顺序数量与总人数不符',
                    icon: 'none'
                });
                return false;
            }

            if (!runtimeConfig.red_blue_config) {
                wx.showToast({
                    title: '请选择分组方式',
                    icon: 'none'
                });
                return false;
            }

            // 验证所有玩家ID都存在
            const playerIds = players.map(p => Number.parseInt(p.user_id || p.userid));
            const allPlayersIncluded = runtimeConfig.bootstrap_order.every(id =>
                playerIds.includes(Number.parseInt(id))
            );

            if (!allPlayersIncluded) {
                wx.showToast({
                    title: '玩家顺序配置有误',
                    icon: 'none'
                });
                return false;
            }
        }

        // 验证8421配置(仅在8421游戏时)
        if (ruleType.includes('8421')) {
            const val8421Config = runtimeConfig.val8421_config;

            if (!val8421Config || Object.keys(val8421Config).length === 0) {
                wx.showToast({
                    title: '请配置球员指标',
                    icon: 'none'
                });
                return false;
            }

            // 验证所有球员都有配置
            const playerIds = players.map(p => String(p.userid || p.user_id));
            const configPlayerIds = Object.keys(val8421Config);

            const allPlayersConfigured = playerIds.every(id =>
                configPlayerIds.includes(id)
            );

            if (!allPlayersConfigured) {
                wx.showToast({
                    title: '部分球员未配置指标',
                    icon: 'none'
                });
                return false;
            }
        }

        return true;
    },

    saveRuntimeConfig() {
        const { runtimeConfig, holeList } = this.data;

        // 新增调试日志，打印holeList、gameid、groupid
        console.log('[GambleRuntimeConfig] 调试: holeList:', holeList);
        console.log('[GambleRuntimeConfig] 调试: gameid:', runtimeConfig?.gameid);
        console.log('[GambleRuntimeConfig] 调试: groupid:', runtimeConfig?.groupid);

        console.log('[GambleRuntimeConfig] 最终配置:', JSON.stringify(runtimeConfig, null, 2));

        // 添加 holeList 参数
        const configWithHoleList = {
            ...runtimeConfig,
            holeList: holeList
        };

        this.setData({ loading: true });
        app.api.gamble.addRuntimeConfig(configWithHoleList).then(res => {
            console.log('[GambleRuntimeConfig] 保存配置成功:', res);

            if (res.code === 200) {
                wx.showToast({
                    title: '配置保存成功',
                    icon: 'success'
                });

                // 返回到游戏详情页面
                setTimeout(() => {
                    wx.navigateBack({
                        delta: 2 // 返回两层, 跳过rules页面
                    });
                }, 1500);
            } else {
                wx.showToast({
                    title: res.msg || '保存失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            console.error('[GambleRuntimeConfig] 保存配置失败:', err);
            wx.showToast({
                title: '网络错误, 请重试',
                icon: 'none'
            });
        }).finally(() => {
            this.setData({ loading: false });
        });
    },

    // 取消配置
    onCancelConfig() {
        console.log('[GambleRuntimeConfig] 取消配置');

        wx.showModal({
            title: '取消配置',
            content: '确定要取消配置吗？当前配置将丢失。',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateBack();
                }
            }
        });
    }
}); 