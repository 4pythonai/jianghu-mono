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

        // 游戏额外选项数据
        extraOptions: [
            {
                id: 'gamePublic',
                title: '游戏是否公开',
                icon: '/assets/icons/icons8-delete-50.png',
                handler: 'onGamePublicClick'
            },
            {
                id: 'donatePot',
                title: '捐锅设置',
                icon: '/assets/icons/icons8-delete-50.png',
                handler: 'onDonatePotClick'
            },
            {
                id: 'skipHole',
                title: '跳洞设置',
                icon: '/assets/icons/icons8-delete-50.png',
                handler: 'onSkipHoleClick'
            },
            {
                id: 'adjustStartHole',
                title: '调整出发洞',
                icon: '/assets/icons/icons8-delete-50.png',
                handler: 'onAdjustStartHoleClick'
            },
            {
                id: 'kick',
                title: '踢一脚',
                icon: '/assets/icons/icons8-delete-50.png',
                handler: 'onKickClick'
            },
            {
                id: 'bigWind',
                title: '大风吹',
                icon: '/assets/icons/icons8-delete-50.png',
                handler: 'onBigWindClick'
            }
        ]
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


        // 处理配置项点击事件
        handleGotoResult(e) {
            const { config, index } = e.currentTarget.dataset;
            const gameId = this.properties.gameId || gameStore.gameid;


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

            // 简化：只传递配置ID
            wx.navigateTo({
                url: `/pages/gambleRuntimeConfig/editRuntime/editRuntime?configId=${config.id}`,
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
        },

        // 游戏额外选项点击事件
        onGamePublicClick() {
            console.log('🎮 点击游戏是否公开');
            wx.showToast({
                title: '游戏公开设置功能开发中',
                icon: 'none'
            });
        },

        onDonatePotClick() {
            console.log('🎮 点击捐锅设置');
            wx.showToast({
                title: '捐锅设置功能开发中',
                icon: 'none'
            });
        },

        onSkipHoleClick() {
            console.log('🎮 点击跳洞设置');
            wx.showToast({
                title: '跳洞设置功能开发中',
                icon: 'none'
            });
        },

        onAdjustStartHoleClick() {
            console.log('🎮 点击调整出发洞');
            wx.showToast({
                title: '调整出发洞功能开发中',
                icon: 'none'
            });
        },

        onKickClick() {
            console.log('🎮 点击踢一脚');
            wx.showToast({
                title: '踢一脚功能开发中',
                icon: 'none'
            });
        },

        onBigWindClick() {
            console.log('🎮 点击大风吹');
            wx.showToast({
                title: '大风吹功能开发中',
                icon: 'none'
            });
        },

        // 通用选项点击处理方法
        onExtraOptionClick(e) {
            const option = e.currentTarget.dataset.option;
            console.log('🎮 点击游戏选项:', option);

            // 根据选项ID执行不同的处理逻辑
            switch (option.id) {
                case 'gamePublic':
                    wx.showToast({
                        title: '游戏公开设置功能开发中',
                        icon: 'none'
                    });
                    break;
                case 'donatePot':
                    wx.showToast({
                        title: '捐锅设置功能开发中',
                        icon: 'none'
                    });
                    break;
                case 'skipHole':
                    wx.showToast({
                        title: '跳洞设置功能开发中',
                        icon: 'none'
                    });
                    break;
                case 'adjustStartHole':
                    wx.showToast({
                        title: '调整出发洞功能开发中',
                        icon: 'none'
                    });
                    break;
                case 'kick':
                    wx.showToast({
                        title: '踢一脚功能开发中',
                        icon: 'none'
                    });
                    break;
                case 'bigWind':
                    wx.showToast({
                        title: '大风吹功能开发中',
                        icon: 'none'
                    });
                    break;
                default:
                    wx.showToast({
                        title: '功能开发中',
                        icon: 'none'
                    });
            }
        }
    },

    // 生命周期
    lifetimes: {
        attached() {
            console.log('🎮 [RuntimConfigList] 组件已挂载');

            // 调试：检查extraOptions数据
            console.log('🎮 [RuntimConfigList] extraOptions数据:', this.data.extraOptions);

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
            // this.observeRuntimeConfigs();
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