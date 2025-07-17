// 游戏(Gamble)模块逻辑
import { gameStore } from '../../../stores/gameStore'
import { runtimeStore } from '../../../stores/runtimeStore'
import { createStoreBindings } from 'mobx-miniprogram-bindings'


const app = getApp();

Component({
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
        lastRefreshTime: 0, // 记录上次刷新时间, 避免频繁刷新
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
            // 当切换到游戏选项卡时, 刷新运行时配置
            if (newTab === 2) {
                console.log('🎮 切换到游戏选项卡, 刷新运行时配置');
                this.refreshRuntimeConfigWithThrottle();
            }
        }
    },

    methods: {
        // 模块方法
        initGame() {
            // 初始化游戏
            this.setData({ loading: true });
            console.log('🎮 初始化游戏, 比赛ID:', this.properties.gameId);
            console.log('🎮 参赛球员:', this.properties.players);
            console.log('🎮 gameStore中的gameid:', gameStore.gameid);
            console.log('🎮 runtimeStore中的runtimeConfigs:', runtimeStore.runtimeConfigs);
            // TODO: 实际游戏初始化逻辑
            setTimeout(() => {
                this.setData({ loading: false });
            }, 1500);
        },

        onDeleteConfig(e) {
            const id = e.currentTarget.dataset.id;
            console.log('删除配置 id:', id);
            app.api.gamble.deleteRuntimeConfig({ id: id }).then(res => {
                console.log('删除配置成功:', res);
                this.refreshRuntimeConfig();
            });
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
            const gameId = this.properties.gameId || gameStore.gameid;
            const groupId = gameStore.groupId;
            if (gameId) {
                runtimeStore.fetchRuntimeConfigs(gameId, groupId);
            }
        },

        // 刷新运行时配置
        refreshRuntimeConfig() {
            const gameId = this.properties.gameId || gameStore.gameid;
            const groupId = gameStore.groupId;
            if (gameId) {
                console.log('🎮 刷新运行时配置, gameId:', gameId, 'groupId:', groupId);
                runtimeStore.fetchRuntimeConfigs(gameId, groupId);
            }
        },

        // 带防抖的刷新运行时配置
        refreshRuntimeConfigWithThrottle() {
            const now = Date.now();
            const lastRefreshTime = this.data.lastRefreshTime;

            // 如果距离上次刷新不足3秒, 跳过此次刷新
            if (now - lastRefreshTime < 3000) {
                console.log('🎮 刷新过于频繁, 跳过此次刷新');
                return;
            }

            this.setData({ lastRefreshTime: now });
            this.refreshRuntimeConfig();
        },

        // 处理配置项点击事件
        handleGotoResult(e) {
            const { config, index } = e.currentTarget.dataset;
            const gameId = this.properties.gameId || gameStore.gameid;

            console.log('🎮 点击配置项:', { config, index, gameId });

            if (!config) {
                console.error('🎮 配置数据为空');
                wx.showToast({
                    title: '配置数据错误',
                    icon: 'none'
                });
                return;
            }

            // 构建跳转参数 - 使用运行时配置的ID作为gambleid
            const gambleid = config.id
            const params = {
                gameId: gameId,
                gambleid: gambleid,
                ruleType: config.gambleSysName || '',
                userRuleName: config.gambleUserName || '',
                holePlayList: config.holePlayList || [],
                playerCount: config.player8421Count || 0
            };


            // 将参数编码为URL
            const queryString = Object.keys(params)
                .map(key => `${key}=${encodeURIComponent(params[key])}`)
                .join('&');

            console.log('🎮 跳转到赌球结果页面, 参数:', params);

            // 跳转到赌球结果页面
            wx.navigateTo({
                url: `/pages/gambleResult/gambleResult?${queryString}`,
                success: () => {
                    console.log('🎮 成功跳转到赌球结果页面');
                },
                fail: (err) => {
                    console.error('🎮 跳转到赌球结果页面失败:', err);
                    wx.showToast({
                        title: '页面跳转失败',
                        icon: 'none'
                    });
                }
            });
        }
    },

    // 生命周期
    lifetimes: {
        attached() {
            // 创建多个store绑定
            this.gameStoreBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameid', 'loading', 'error', 'currentTab'],
                actions: [],
            });

            this.runtimeStoreBindings = createStoreBindings(this, {
                store: runtimeStore,
                fields: ['runtimeConfigs', 'loadingRuntimeConfig', 'runtimeConfigError'],
                actions: ['fetchRuntimeConfigs'],
            });

            this.initGame();
            console.log('🎮 [Gamble] 组件已附加, 多store绑定已创建');
        },

        detached() {
            // 清理所有store绑定
            if (this.gameStoreBindings) {
                this.gameStoreBindings.destroyStoreBindings();
            }
            if (this.runtimeStoreBindings) {
                this.runtimeStoreBindings.destroyStoreBindings();
            }
            console.log('🎮 [Gamble] 组件已分离, 多store绑定已清理');
        }
    },

    // 页面生命周期
    pageLifetimes: {
        show() {
            // 页面显示时刷新运行时配置, 但只有在当前选项卡是"游戏"时才刷新
            if (this.data.currentTab === 2) {
                console.log('🎮 页面显示且在游戏选项卡, 刷新运行时配置');
                this.refreshRuntimeConfigWithThrottle();
            } else {
                console.log('🎮 页面显示, 但不在游戏选项卡, 跳过刷新');
            }
        }
    }
});