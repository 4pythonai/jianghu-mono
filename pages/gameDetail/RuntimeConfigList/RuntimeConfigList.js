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


        // holejump  juanguo   kickoff   starthole
        extraOptions: [
            {
                id: 'juanguo',
                title: '捐锅设置(以最后一次为准)',
                icon: '/assets/icons/icons8-kitchen-100.png',
                handler: 'onJuanguoClick'
            },
            {
                id: 'holejump',
                title: '跳洞设置',
                icon: '/assets/icons/icons8-skip-100.png',
                handler: 'onHoleJumpClick'
            },
            {
                id: 'starthole',
                title: '调整出发洞',
                icon: '/assets/icons/icons8-golf-100.png',
                handler: 'onStartHoleClick'
            }
        ],
        isKickoffVisible: false,
        isHolejumpVisible: false,
        isStartholeVisible: false,
        isJuanguoVisible: false,
        selectedConfigForKick: null, // 当前选中的配置项（用于踢一脚功能）
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
            console.log('🎮 [RuntimeConfigList] runtimeConfigs 变化:', {
                length: newConfigs?.length || 0,
                configs: newConfigs
            });
        }
    },

    methods: {
        refresh() {
            this.refreshRuntimeConfig?.();
        },
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

        onJuanguoClick() {
            console.log('🎮 点击捐锅设置');
            this.setData({ isJuanguoVisible: true });
        },
        onJuanguoClose() {
            this.setData({ isJuanguoVisible: false });
        },

        onHoleJumpClick() {
            console.log('🎮 点击跳洞设置');
            this.setData({ isHolejumpVisible: true });
        },

        onHolejumpClose() {
            this.setData({ isHolejumpVisible: false });
        },

        onStartHoleClick() {
            console.log('🎮 点击调整出发洞');
            wx.showToast({
                title: '调整出发洞功能开发中',
                icon: 'none'
            });
        },

        onStartholeClick() {
            console.log('🎮 点击调整出发洞');
            this.setData({ isStartholeVisible: true });
        },
        onStartholeClose() {
            this.setData({ isStartholeVisible: false });
        },

        onKickClick(e) {
            const { config, index } = e.currentTarget.dataset;
            console.log('🎮 点击踢一脚 config:', config, 'index:', index);

            if (!config) {
                console.error('🎮 配置数据为空');
                wx.showToast({
                    title: '配置数据错误',
                    icon: 'none'
                });
                return;
            }

            // 设置选中的配置项，只传递当前选中的配置
            this.setData({
                isKickoffVisible: true,
                selectedConfigForKick: config
            }, () => {
                console.log('isKickoffVisible:', this.data.isKickoffVisible);
            });
        },

        onKickoffClose() {
            this.setData({
                isKickoffVisible: false,
                selectedConfigForKick: null
            });
        },

        onKickoffConfirm(e) {
            const { configId, configName, hindex, multiplier, completeMultiplierConfig, holeMultiplierMap } = e.detail;

            // updateKickOffMultiplier
            console.log(' [🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻  踢一脚配置确认:', {
                configId,
                configName,
                hindex,
                multiplier,
                completeMultiplierConfig,
                holeMultiplierMap
            });

            // 调用 updateKickOffMultiplier

            // app.api.gamble.deleteRuntimeConfig

            app.api.gamble.updateKickOffMultiplier({
                configId,
                configName,
                hindex,
                multiplier,
                completeMultiplierConfig,
                holeMultiplierMap
            });

            // 这里可以处理踢一脚配置的确认逻辑
            // 例如：保存到服务器、更新本地状态等

            wx.showToast({
                title: "踢一脚配置已保存",
                icon: 'success'
            });

            // 关闭弹窗
            this.onKickoffClose();
        },

        onBigWindClick() {
            console.log('🎮 点击大风吹');
            wx.showToast({
                title: '大风吹功能开发中',
                icon: 'none'
            });
        },

        onGamePublicChange(e) {
            const value = e.detail.value;
            console.log('【游戏是否公开】选择：', value);
            // 打印所有gamble id
            const ids = (this.data.runtimeConfigs || []).map(item => item.id);
            console.log('本页面所有的gamble id:', ids);
            // 这里调用 setGamblesVisible，暂时只打印log
            // this.setGamblesVisible(value);
        },
        onBigWindChange(e) {
            const value = e.detail.value;
            console.log('【大风吹】选择：', value);
            // 打印所有gamble id
            const ids = (this.data.runtimeConfigs || []).map(item => item.id);
            console.log('本页面所有的gamble id:', ids);
        },

        // 通用选项点击处理方法
        onExtraOptionClick(e) {
            const option = e.currentTarget.dataset.option;
            console.log('🎮 点击游戏选项:', option);
            if (option.id === 'holejump') {
                this.onHoleJumpClick();
            } else if (option.id === 'starthole') {
                this.onStartholeClick();
            } else if (option.id === 'juanguo') {
                this.onJuanguoClick();
            }
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