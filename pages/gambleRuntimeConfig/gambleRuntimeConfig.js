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
            startHole: 1,
            endHole: 18,

            // 分组配置
            grouping_config: {
                enable: false,
                red_blue_config: '4_固拉',
                playersOrder: []
            },

            // 排名配置
            ranking_tie_resolve_config: 'score_based' // 可选: 'score_based', 'handicap_based', 'random'
        },

        // 页面状态
        loading: false,
        error: null
    },

    onLoad(options) {
        console.log('🎮 [GambleRuntimeConfig] 页面加载，参数:', options);

        try {
            // 解析传递的数据
            if (options.data) {
                const decodedData = JSON.parse(decodeURIComponent(options.data));
                console.log('🎮 [GambleRuntimeConfig] 解析数据:', decodedData);

                let players = [];
                let holes = [];
                let gameData = null;
                let userRule = null;

                // 统一从全局数据获取完整信息
                const app = getApp();
                const globalData = app.globalData || {};

                // 检查是否有全局数据
                if (!globalData.currentGameData) {
                    console.warn('🎮 [GambleRuntimeConfig] 全局数据为空，使用默认值');
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

                    console.log('🎮 [GambleRuntimeConfig] 从用户规则进入，全局数据:', {
                        players: players.length,
                        holes: holes.length,
                        userRule: userRule?.gambleUserName
                    });
                } else {
                    userRule = null;

                    console.log('🎮 [GambleRuntimeConfig] 从系统规则进入，全局数据:', {
                        players: players.length,
                        holes: holes.length,
                        ruleType: decodedData.ruleType
                    });
                }

                this.setData({
                    ruleType: decodedData.ruleType || '',
                    gameId: decodedData.gameId || null,
                    players: players,
                    holes: holes,
                    gameData: gameData,
                    userRule: userRule,
                    'runtimeConfig.endHole': holes?.length || decodedData.holeCount || 18
                });

                // 初始化分组配置
                this.initializeGroupingConfig();
            }
        } catch (error) {
            console.error('🎮 [GambleRuntimeConfig] 数据解析失败:', error);
            this.setData({
                error: '数据解析失败'
            });
        }
    },

    // 页面销毁时清理全局数据
    onUnload() {
        console.log('🎮 [GambleRuntimeConfig] 页面销毁，清理全局数据');
        const app = getApp();
        if (app.globalData) {
            delete app.globalData.currentUserRule;
            delete app.globalData.currentGameData;
        }
    },

    // 初始化分组配置
    initializeGroupingConfig() {
        const { players, ruleType } = this.data;

        // 检查是否需要分组（3人或4人游戏）
        const playerCount = players.length;
        const needGrouping = (playerCount === 3 || playerCount === 4) &&
            (ruleType.includes('3p-') || ruleType.includes('4p-'));

        if (needGrouping) {
            this.setData({
                'runtimeConfig.grouping_config.enable': true,
                'runtimeConfig.grouping_config.red_blue_config': '4_固拉',
                'runtimeConfig.grouping_config.playersOrder': [...players]
            });
        } else {
            this.setData({
                'runtimeConfig.grouping_config.enable': false,
                'runtimeConfig.grouping_config.playersOrder': [...players]
            });
        }

        console.log('🎮 [GambleRuntimeConfig] 分组配置初始化:', {
            needGrouping,
            playerCount,
            ruleType
        });
    },

    // 重新选择赌博规则
    onReSelectRule() {
        console.log('🎮 [GambleRuntimeConfig] 重新选择规则');

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
        const { startHole, endHole } = e.detail;
        console.log('🎮 [GambleRuntimeConfig] 洞范围变更:', { startHole, endHole });

        this.setData({
            'runtimeConfig.startHole': startHole,
            'runtimeConfig.endHole': endHole
        });
    },

    // 分组配置事件
    onGroupingConfigChange(e) {
        const { red_blue_config, playersOrder } = e.detail;
        console.log('🎮 [GambleRuntimeConfig] 分组配置变更:', { red_blue_config, playersOrder });

        this.setData({
            'runtimeConfig.grouping_config.red_blue_config': red_blue_config,
            'runtimeConfig.grouping_config.playersOrder': playersOrder
        });
    },

    // 排名配置事件
    onRankingConfigChange(e) {
        const { ranking_tie_resolve_config } = e.detail;
        console.log('🎮 [GambleRuntimeConfig] 排名配置变更:', ranking_tie_resolve_config);

        this.setData({
            'runtimeConfig.ranking_tie_resolve_config': ranking_tie_resolve_config
        });
    },

    // 确认配置
    onConfirmConfig() {
        const { runtimeConfig, ruleType, gameId, players } = this.data;

        console.log('🎮 [GambleRuntimeConfig] 确认配置:', {
            ruleType,
            gameId,
            runtimeConfig,
            players
        });





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
        if (runtimeConfig.startHole > runtimeConfig.endHole) {
            wx.showToast({
                title: '起始洞不能大于结束洞',
                icon: 'none'
            });
            return false;
        }

        // 验证分组配置
        if (runtimeConfig.grouping_config.enable) {
            const playersOrderCount = runtimeConfig.grouping_config.playersOrder.length;

            if (playersOrderCount !== players.length) {
                wx.showToast({
                    title: '玩家顺序数量与总人数不符',
                    icon: 'none'
                });
                return false;
            }

            if (!runtimeConfig.grouping_config.red_blue_config) {
                wx.showToast({
                    title: '请选择分组方式',
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

        console.log(JSON.stringify(this.data, null, 2));


        return;

        this.setData({ loading: true });

        // TODO: 调用API保存配置
        console.log('🎮 [GambleRuntimeConfig] 保存配置到服务器...');

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
        console.log('🎮 [GambleRuntimeConfig] 取消配置');

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