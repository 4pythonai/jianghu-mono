// 游戏(Gamble)模块逻辑
import { gameStore } from '../../../stores/gameStore'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'

Component({
    behaviors: [storeBindingsBehavior],

    storeBindings: {
        store: gameStore,
        fields: ['gameid', 'loading', 'error', 'runtimeConfigs', 'loadingRuntimeConfig', 'runtimeConfigError'],
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
        loading: false
    },

    // 计算属性
    computed: {
        // 是否有游戏配置
        hasGameConfigs() {
            return this.data.runtimeConfigs && this.data.runtimeConfigs.length > 0;
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
        }
    },

    // 生命周期
    lifetimes: {
        attached() {
            this.initGame();
        }
    }
});