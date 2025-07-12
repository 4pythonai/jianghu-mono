// 游戏(Gamble)模块逻辑
import { gameStore } from '../../../stores/gameStore'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'

Component({
    behaviors: [storeBindingsBehavior],

    storeBindings: {
        store: gameStore,
        fields: ['gameid', 'loading', 'error', 'runtimeConfigs', 'loadingRuntimeConfig', 'runtimeConfigError', 'currentTab'],
    },

    properties: {
        // 可接收的参数
        gameId: {
            type: String,
            value: ''
        },
        players: {
            type: Array,
            value: []
        }
    },

    data: {
        // 模块内部数据
        loading: false,
        lastRefreshTime: 0 // 记录上次刷新时间，避免频繁刷新
    },

    // 计算属性
    computed: {
        hasGameConfigs() {
            return this.data.runtimeConfigs && this.data.runtimeConfigs.length > 0;
        }
    },

    // 观察者
    observers: {
        'currentTab': function (newTab) {
            // 当切换到游戏选项卡时，刷新运行时配置
            if (newTab === 2) {
                console.log('🎮 切换到游戏选项卡，刷新运行时配置');
                this.refreshRuntimeConfigWithThrottle();
            }
        }
    },

    methods: {
        // 模块方法
        initGame() {
            // 初始化游戏
            this.setData({ loading: true });
            console.log('🎮 初始化游戏，比赛ID:', this.properties.gameId);
            console.log('🎮 参赛球员:', this.properties.players);
            console.log('🎮 gameStore中的gameid:', gameStore.gameid);
            console.log('🎮 gameStore中的runtimeConfigs:', gameStore.runtimeConfigs);
            // TODO: 实际游戏初始化逻辑
            setTimeout(() => {
                this.setData({ loading: false });
            }, 1500);
        },

        // 添加游戏按钮点击事件
        handleAddGame() {
            // 跳转到游戏规则页面
            wx.navigateTo({
                url: '/pages/rules/rules',
                success: () => {
                    console.log('🎮 成功跳转到游戏规则页面');
                },
                fail: (err) => {
                    console.error('🎮 跳转失败:', err);
                    wx.showToast({
                        title: '页面跳转失败',
                        icon: 'none'
                    });
                }
            });
        },

        // 重试加载运行时配置
        retryLoadRuntimeConfig() {
            if (gameStore.gameid) {
                gameStore.fetchRuntimeConfigs(gameStore.gameid);
            }
        },

        // 刷新运行时配置
        refreshRuntimeConfig() {
            const gameId = this.properties.gameId || gameStore.gameid;
            if (gameId) {
                console.log('🎮 刷新运行时配置，gameId:', gameId);
                gameStore.fetchRuntimeConfigs(gameId);
            }
        },

        // 带防抖的刷新运行时配置
        refreshRuntimeConfigWithThrottle() {
            const now = Date.now();
            const lastRefreshTime = this.data.lastRefreshTime;

            // 如果距离上次刷新不足3秒，跳过此次刷新
            if (now - lastRefreshTime < 3000) {
                console.log('🎮 刷新过于频繁，跳过此次刷新');
                return;
            }

            this.setData({ lastRefreshTime: now });
            this.refreshRuntimeConfig();
        }
    },

    // 生命周期
    lifetimes: {
        attached() {
            this.initGame();
        }
    },

    // 页面生命周期
    pageLifetimes: {
        show() {
            // 页面显示时刷新运行时配置，但只有在当前选项卡是"游戏"时才刷新
            if (this.data.currentTab === 2) {
                console.log('🎮 页面显示且在游戏选项卡，刷新运行时配置');
                this.refreshRuntimeConfigWithThrottle();
            } else {
                console.log('🎮 页面显示，但不在游戏选项卡，跳过刷新');
            }
        }
    }
});