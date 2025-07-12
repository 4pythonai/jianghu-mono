// 赌博游戏运行时配置页面
Page({
    data: {
        // 传递的数据
        ruleType: '',
        gameId: null,
        players: [],
        holes: [],
        gameData: null,
        userRule: null, // 用户规则数据

        // 运行时配置数据
        runtimeConfig: {
            // 起点洞与终点洞配置
            firstHoleindex: 1,
            lastHoleindex: 18,

            // 分组配置 - 直接在顶层
            red_blue_config: '4_固拉',
            bootstrap_order: [],

            // 排名配置
            ranking_tie_resolve_config: 'score_based' // 可选: 'score_based', 'handicap_based', 'random'
        },

        // 页面状态
        loading: false,
        error: null
    },

    onLoad(options) {
        console.log('[GambleRuntimeConfig] 页面加载，参数:', options);

        try {
            // 解析传递的数据
            if (options.data) {
                const decodedData = JSON.parse(decodeURIComponent(options.data));
                console.log('[GambleRuntimeConfig] 解析数据:', decodedData);

                let players = [];
                let holes = [];
                let gameData = null;
                let userRule = null;

                // 统一从全局数据获取完整信息
                const app = getApp();
                const globalData = app.globalData || {};

                // 检查是否有全局数据
                if (!globalData.currentGameData) {
                    console.warn('[GambleRuntimeConfig] 全局数据为空，使用默认值');
                    players = [];
                    holes = [];
                    gameData = null;
                } else {
                    players = globalData.currentGameData.players || [];
                    holes = globalData.currentGameData.holes || [];
                    gameData = globalData.currentGameData.gameData || null;
                }

                // 只有从用户规则进入时才有用户规则数据
                if (decodedData.fromUserRule) {
                    userRule = globalData.currentUserRule || null;

                    console.log('[GambleRuntimeConfig] 从用户规则进入，全局数据:', {
                        players: players.length,
                        holes: holes.length,
                        userRule: userRule?.gambleUserName
                    });
                } else {
                    userRule = null;

                    console.log('[GambleRuntimeConfig] 从系统规则进入，全局数据:', {
                        players: players.length,
                        holes: holes.length,
                        ruleType: decodedData.ruleType
                    });
                }

                // 根据holeList设置初始洞范围
                let initialFirstHole = 1;
                let initialLastHole = 18;

                if (holes && holes.length > 0) {
                    // 使用第一个洞的holeno作为起始洞
                    initialFirstHole = holes[0].holeno || 1;
                    // 使用最后一个洞的holeno作为结束洞
                    initialLastHole = holes[holes.length - 1].holeno || 18;
                }

                this.setData({
                    ruleType: decodedData.ruleType || '',
                    gameId: decodedData.gameId || null,
                    players: players,
                    holes: holes,
                    gameData: gameData,
                    userRule: userRule,
                    'runtimeConfig.firstHoleindex': initialFirstHole,
                    'runtimeConfig.lastHoleindex': initialLastHole
                });

                // 初始化分组配置
                this.initializeGroupingConfig();
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
        console.log('[GambleRuntimeConfig] 页面销毁，清理全局数据');
        const app = getApp();
        if (app.globalData) {
            app.globalData.currentUserRule = undefined;
            app.globalData.currentGameData = undefined;
        }
    },

    // 初始化分组配置
    initializeGroupingConfig() {
        const { players, ruleType } = this.data;

        // 检查是否需要分组（3人或4人游戏）
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
        const { firstHoleindex, lastHoleindex } = e.detail;
        console.log('[GambleRuntimeConfig] 洞范围变更:', { firstHoleindex, lastHoleindex });

        // 确保数据类型正确
        const firstHole = Number.parseInt(firstHoleindex) || 1;
        const lastHole = Number.parseInt(lastHoleindex) || 18;

        this.setData({
            'runtimeConfig.firstHoleindex': firstHole,
            'runtimeConfig.lastHoleindex': lastHole
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

    // 确认配置
    onConfirmConfig() {
        const { runtimeConfig, ruleType, gameId, players } = this.data;

        // console.log('[GambleRuntimeConfig] 确认配置:', {
        //     ruleType,
        //     gameId,
        //     runtimeConfig,
        //     players
        // });





        // 验证配置
        if (!this.validateConfig()) {
            return;
        }

        // 保存配置并返回
        this.saveRuntimeConfig();
    },

    // 验证配置
    validateConfig() {
        const { runtimeConfig, players } = this.data;

        // 验证洞范围
        if (runtimeConfig.firstHoleindex > runtimeConfig.lastHoleindex) {
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

        return true;
    },

    // 保存运行时配置
    saveRuntimeConfig() {
        const { runtimeConfig, ruleType, gameId } = this.data;

        console.log('[GambleRuntimeConfig] 最终配置:', JSON.stringify(runtimeConfig, null, 2));

        this.setData({ loading: true });

        // TODO: 调用API保存配置
        console.log('[GambleRuntimeConfig] 保存配置到服务器...');

        // 模拟API调用
        setTimeout(() => {
            this.setData({ loading: false });

            wx.showToast({
                title: '配置保存成功',
                icon: 'success'
            });

            // 返回到游戏详情页面
            setTimeout(() => {
                wx.navigateBack({
                    delta: 2 // 返回两层，跳过rules页面
                });
            }, 1500);
        }, 1000);
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