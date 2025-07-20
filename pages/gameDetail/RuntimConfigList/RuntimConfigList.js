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

    // 观察者 - 移除对 currentTab 的监听，改为由父组件主动调用
    observers: {
        // 可以添加其他需要监听的属性
        'runtimeConfigs': (newConfigs) => {
            console.log('🎮 [RuntimConfigList] runtimeConfigs 变化:', {
                length: newConfigs?.length || 0,
                configs: newConfigs
            });
        }
    },

    methods: {
        // 模块方法
        initGame() {
            // 初始化游戏
            this.setData({ loading: true });
            setTimeout(() => {
                this.setData({ loading: false });
            }, 1500);
        },

        onDeleteConfig(e) {
            const id = e.currentTarget.dataset.id;
            app.api.gamble.deleteRuntimeConfig({ id: id }).then(res => {
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
                }
            });
        },



        // 刷新运行时配置
        refreshRuntimeConfig() {
            const gameId = this.properties.gameId || gameStore.gameid;
            const groupId = gameStore.groupId;
            if (gameId) {
                runtimeStore.fetchRuntimeConfigs(groupId);
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

        // 观察运行时配置数据
        observeRuntimeConfigs() {
            console.log('🎮 [RuntimConfigList] 当前 runtimeConfigs:', {
                length: this.data.runtimeConfigs?.length || 0,
                configs: this.data.runtimeConfigs
            });
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
                gambleSysName: config.gambleSysName || '',
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
                url: `/pages/gambleResult/gambleResult?${queryString}`
            });
        },

        // 处理运行时配置项点击事件 - 跳转到配置页面
        onRuntimeItemClick(e) {
            const { config, index } = e.currentTarget.dataset;
            const gameId = this.properties.gameId || gameStore.gameid;

            console.log('🎮 点击配置详情按钮:', { config, index, gameId });

            if (!config) {
                console.error('🎮 配置数据为空');
                wx.showToast({
                    title: '配置数据错误',
                    icon: 'none'
                });
                return;
            }

            // 直接使用 processOneGamble 处理完的配置，添加必要的跳转标识
            const jumpData = {
                ...config,                    // 使用处理完的配置数据
                configId: config.id,          // 明确设置 configId
                gameId: gameId,               // 添加游戏ID
                fromUserRule: false,          // 不是从用户规则进入
                editConfig: config            // 传递要编辑的配置
            };

            // 将数据编码为JSON字符串
            const encodedData = encodeURIComponent(JSON.stringify(jumpData));


            // 跳转到配置编辑页面
            wx.navigateTo({
                url: `/pages/gambleRuntimeConfig/editRuntime/editRuntime?data=${encodedData}`,
                success: () => {
                    console.log('🎮 成功跳转到配置编辑页面');
                },
                fail: (err) => {
                    console.error('🎮 跳转到配置编辑页面失败:', err);
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
                fields: ['gameid', 'loading', 'error'],
                actions: [],
            });

            this.runtimeStoreBindings = createStoreBindings(this, {
                store: runtimeStore,
                fields: ['runtimeConfigs', 'loadingRuntimeConfig', 'runtimeConfigError'],
                actions: ['fetchRuntimeConfigs'],
            });

            this.initGame();
            console.log('🎮 [Gamble] 组件已附加, 多store绑定已创建');

            // 添加数据监听
            this.observeRuntimeConfigs();
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
            // 页面显示时刷新运行时配置
            console.log('🎮 页面显示, 刷新运行时配置');
            this.refreshRuntimeConfigWithThrottle();
        }
    }
});