// 游戏(Gamble)模块逻辑
import { gameStore } from '../../../stores/gameStore'
import { runtimeStore } from '../../../stores/runtimeStore'
import { createStoreBindings } from 'mobx-miniprogram-bindings'

const app = getApp();

Page({
    data: {
        // 页面参数
        gameId: '',
        groupId: '',
        players: [],

        // 模块内部数据
        loading: false,
        lastRefreshTime: 0, // 记录上次刷新时间, 避免频繁刷新

        // 游戏额外选项数据 - 从第一个配置项获取
        ifShow: 'y',     // 游戏是否公开，默认公开
        bigWind: 'n',    // 大风吹，默认否

        // 额外功能选项
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

        // 弹窗显示状态
        isKickoffVisible: false,
        isHolejumpVisible: false,
        isStartholeVisible: false,
        isJuanguoVisible: false,
        selectedConfigForKick: null, // 当前选中的配置项（用于踢一脚功能）
    },

    onLoad(options) {
        console.log('[RuntimeConfigList] 页面加载，参数:', options);

        // 解析页面参数
        const gameId = options?.gameId || '';
        const groupId = options?.groupId || '';
        let players = [];

        if (options?.players) {
            try {
                players = JSON.parse(options.players);
            } catch (e) {
                console.error('[RuntimeConfigList] 解析players参数失败:', e);
            }
        }

        this.setData({ gameId, groupId, players });

        // 绑定store
        this.gameStoreBindings = createStoreBindings(this, {
            store: gameStore,
            fields: ['gameData'],
            actions: []
        });

        this.runtimeStoreBindings = createStoreBindings(this, {
            store: runtimeStore,
            fields: ['runtimeConfigs', 'loadingRuntimeConfig', 'runtimeConfigError'],
            actions: ['fetchRuntimeConfigs'],
        });

        // 初始化数据
        this.initPage();
    },

    onUnload() {
        // 清理所有store绑定
        if (this.gameStoreBindings) {
            this.gameStoreBindings.destroyStoreBindings();
        }
        if (this.runtimeStoreBindings) {
            this.runtimeStoreBindings.destroyStoreBindings();
        }
    },

    initPage() {
        this.refreshRuntimeConfig();

        // 在 onLoad 中初始化 observers，避免深度克隆警告
        this.observers = {
            'runtimeConfigs': function (newConfigs) {
                this.updateGameSettings(newConfigs);
            }
        };
    },

    // 刷新方法 - 供外部调用
    refresh() {
        this.refreshRuntimeConfig();
    },

    // 删除配置项
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

    // 刷新运行时配置 - 优化后的方法
    refreshRuntimeConfig() {
        const gameId = this.data.gameId || gameStore.gameid;
        const groupId = this.data.groupId || gameStore.groupId;


        if (!groupId) {
            console.error('[RuntimeConfigList] groupId 为空，无法刷新配置');
            return;
        }

        // 设置加载状态
        this.setData({ loading: true });

        runtimeStore.fetchRuntimeConfigs(groupId)
            .then((result) => {

                // 强制触发一次更新，确保数据同步
                setTimeout(() => {
                    this.updateGameSettings(this.data.runtimeConfigs);
                    // 调试数据状态
                    this.debugDataStatus();
                }, 100);
            })
            .catch(err => {
                wx.showToast({
                    title: '加载配置失败',
                    icon: 'none'
                });
            })
            .finally(() => {
                this.setData({ loading: false });
            });
    },

    // 带防抖的刷新运行时配置
    refreshRuntimeConfigWithThrottle() {
        const now = Date.now();
        const lastRefreshTime = this.data.lastRefreshTime;

        // 如果距离上次刷新不足3秒, 跳过此次刷新
        if (now - lastRefreshTime < 3000) {
            return;
        }

        this.setData({ lastRefreshTime: now });
        this.refreshRuntimeConfig();
    },

    // 静默刷新运行时配置 - 不显示加载状态，用于后台数据更新
    silentRefreshRuntimeConfig() {
        const gameId = this.data.gameId || gameStore.gameid;
        const groupId = this.data.groupId || gameStore.groupId;

        if (!groupId) {
            console.error('[RuntimeConfigList] groupId 为空，无法静默刷新配置');
            return;
        }

        console.log('[RuntimeConfigList] 开始静默刷新配置...');

        // 记录当前滚动位置
        const query = wx.createSelectorQuery();
        query.select('.gamble-container').scrollOffset();
        query.exec((res) => {
            const scrollTop = res[0]?.scrollTop || 0;
            console.log('[RuntimeConfigList] 记录当前滚动位置:', scrollTop);

            runtimeStore.fetchRuntimeConfigs(groupId)
                .then((result) => {
                    console.log('[RuntimeConfigList] 静默刷新成功');
                    // 强制触发一次更新，确保数据同步
                    setTimeout(() => {
                        this.updateGameSettings(this.data.runtimeConfigs);
                        // 恢复滚动位置
                        this.restoreScrollPosition(scrollTop);
                    }, 100);
                })
                .catch(err => {
                    console.error('[RuntimeConfigList] 静默刷新失败:', err);
                    // 静默刷新失败时不显示错误提示，避免影响用户体验
                });
        });
    },

    // 恢复滚动位置
    restoreScrollPosition(scrollTop) {
        setTimeout(() => {
            wx.pageScrollTo({
                scrollTop: scrollTop,
                duration: 0 // 立即滚动，无动画
            });
            console.log('[RuntimeConfigList] 恢复滚动位置到:', scrollTop);
        }, 50);
    },

    // 获取当前游戏设置状态 - 从第一个配置项获取
    getCurrentGameSettings() {
        const configs = this.data.runtimeConfigs || [];
        if (configs.length === 0) {
            return {
                ifShow: 'y',  // 默认公开
                bigWind: 'n'  // 默认否
            };
        }

        const firstConfig = configs[0];
        return {
            ifShow: firstConfig.ifShow !== undefined && firstConfig.ifShow !== null ? firstConfig.ifShow : 'y',
            bigWind: firstConfig.bigWind !== undefined && firstConfig.bigWind !== null ? firstConfig.bigWind : 'n'
        };
    },

    // 更新游戏设置状态 - 从第一个配置项获取
    updateGameSettings(configs) {
        if (!configs || configs.length === 0) {
            console.log('🎮 [RuntimeConfigList] 无配置数据，使用默认值');
            return;
        }

        // 使用第一个配置项的值作为全局设置
        const firstConfig = configs[0];

        const newData = {};

        // 更新游戏是否公开状态 - 确保字段存在且有效
        if (firstConfig.ifShow !== undefined && firstConfig.ifShow !== null) {
            newData.ifShow = firstConfig.ifShow;
        }

        // 更新大风吹状态 - 确保字段存在且有效
        if (firstConfig.bigWind !== undefined && firstConfig.bigWind !== null) {
            newData.bigWind = firstConfig.bigWind;
        }

        // 批量更新数据
        if (Object.keys(newData).length > 0) {
            this.setData(newData);
        }
    },

    // 处理配置项点击事件 - 跳转到结果页面
    handleGotoResult(e) {
        const { config, index } = e.currentTarget.dataset;
        const gameId = this.data.gameId || gameStore.gameid;

        if (!config) {
            console.error('🎮 配置数据为空');
            wx.showToast({
                title: '配置数据错误',
                icon: 'none'
            });
            return;
        }

        // 构建跳转参数 - 使用运行时配置的ID作为gambleid
        const gambleid = config.id;
        const params = {
            gameId: gameId,
            gambleid: gambleid,
            gambleSysName: config.gambleSysName || '',
            userRuleName: config.gambleUserName || '',
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

        console.log(' 🌓🌓🌓🌓🌓🌓🌓🌓🌓🌓🌓🌓🌓 ')
        console.log(config);
        console.log(' 🌓🌓🌓🌓🌓🌓🌓🌓🌓🌓🌓🌓🌓 ')

        // 简化：只传递配置ID
        wx.navigateTo({ url: `/pages/gambleRuntimeConfig/editRuntime/editRuntime?configId=${config.id}` });
    },

    // 游戏设置相关事件处理
    onGamePublicChange(e) {
        const value = e.detail.value;
        const configs = this.data.runtimeConfigs || [];

        if (configs.length === 0) {
            wx.showToast({
                title: '暂无配置项',
                icon: 'none'
            });
            return;
        }

        // 立即更新本地状态，提供即时反馈
        this.setData({ ifShow: value });

        // 获取所有配置项的ID
        const ids = configs.map(item => item.id);


        app.api.gamble.setGambleVisible({
            allRuntimeIDs: ids,
            ifShow: value
        }).then(() => {
            wx.showToast({
                title: '设置已保存',
                icon: 'success'
            });
        }).catch(err => {
            // 如果失败，回滚到原来的状态
            this.setData({ ifShow: value === 'y' ? 'n' : 'y' });
            wx.showToast({
                title: '设置失败',
                icon: 'none'
            });
        });
    },

    onBigWindChange(e) {
        const value = e.detail.value;
        const configs = this.data.runtimeConfigs || [];


        if (configs.length === 0) {
            wx.showToast({
                title: '暂无配置项',
                icon: 'none'
            });
            return;
        }

        // 立即更新本地状态，提供即时反馈
        this.setData({ bigWind: value });

        // 获取所有配置项的ID
        const ids = configs.map(item => item.id);


        app.api.gamble.updateBigWind({
            allRuntimeIDs: ids,
            bigWind: value
        }).then(() => {
            wx.showToast({
                title: '设置已保存',
                icon: 'success'
            });
        }).catch(err => {
            // 如果失败，回滚到原来的状态
            this.setData({ bigWind: value === 'y' ? 'n' : 'y' });
            wx.showToast({
                title: '设置失败',
                icon: 'none'
            });
        });
    },

    // 额外功能选项点击事件
    onJuanguoClick() {
        this.setData({ isJuanguoVisible: true });
    },

    onJuanguoClose() {
        this.setData({ isJuanguoVisible: false });
    },

    async onJuanguoConfirm(e) {
        const { donationConfig } = e.detail;
        console.log('RuntimeConfigList.js/捐锅配置确认:', donationConfig);

        if (donationConfig.selectedIds.length === 0) {
            wx.showToast({
                title: '请选择要捐锅的游戏',
                icon: 'none'
            });
            return;
        }

        try {
            const res = await app.api.gamble.updateDonation(donationConfig);

            if (res.code === 200) {
                // 刷新运行时配置
                this.refreshRuntimeConfig();
                wx.showToast({
                    title: '捐锅配置已保存',
                    icon: 'success'
                });
                this.onJuanguoClose();
            } else {
                wx.showToast({
                    title: '捐锅配置保存失败',
                    icon: 'none'
                });
            }
        } catch (err) {
            wx.showToast({
                title: '捐锅配置保存失败',
                icon: 'none'
            });
        }
    },

    onHoleJumpClick() {
        this.setData({ isHolejumpVisible: true });
    },

    onHolejumpClose() {
        this.setData({ isHolejumpVisible: false });
    },

    onStartholeClick() {
        this.setData({ isStartholeVisible: true });
    },

    onStartholeClose() {
        this.setData({ isStartholeVisible: false });
    },

    // 踢一脚功能
    onKickClick(e) {
        const { config, index } = e.currentTarget.dataset;

        if (!config) {
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
        });
    },

    onKickoffClose() {
        this.setData({
            isKickoffVisible: false,
            selectedConfigForKick: null
        });
    },

    onKickoffConfirm(e) {
        const { configId, configName, hindex, multipliers, completeMultiplierConfig, holeMultiplierMap } = e.detail;

        app.api.gamble.updateKickOffMultiplier({
            configId,
            configName,
            multipliers
        }).then(() => {
            wx.showToast({
                title: "踢一脚配置已保存",
                icon: 'success'
            });
            this.onKickoffClose();

            // 延迟静默刷新数据，避免页面闪烁
            console.log('[RuntimeConfigList] 踢一脚配置保存成功，延迟静默刷新数据...');
            setTimeout(() => {
                this.silentRefreshRuntimeConfig();
            }, 300); // 延迟300ms，等弹窗完全关闭后再静默刷新
        }).catch(err => {
            console.error('踢一脚配置保存失败:', err);
            wx.showToast({
                title: '配置保存失败',
                icon: 'none'
            });
        });
    },

    // 通用选项点击处理方法
    onExtraOptionClick(e) {
        const option = e.currentTarget.dataset.option;
        if (option.id === 'holejump') {
            this.onHoleJumpClick();
        } else if (option.id === 'starthole') {
            this.onStartholeClick();
        } else if (option.id === 'juanguo') {
            this.onJuanguoClick();
        }
    },

    onShow() {
        console.log('[RuntimeConfigList] 页面显示');
        // 页面显示时刷新数据
        this.refreshRuntimeConfig();
    },

    // 调试方法 - 手动检查数据状态
    debugDataStatus() {

        if (this.data.runtimeConfigs && this.data.runtimeConfigs.length > 0) {
            const firstConfig = this.data.runtimeConfigs[0];
        }
    }
});