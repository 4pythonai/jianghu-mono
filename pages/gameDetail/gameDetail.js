import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/gameStore'

Page({


    data: {
        gameId: '',
        groupId: '',
        currentTab: 0,
    },

    onLoad(options) {
        // ** 核心:创建 Store 和 Page 的绑定 **
        this.storeBindings = createStoreBindings(this, {
            store: gameStore, // 需要绑定的 store
            fields: ['gameData', 'loading', 'error', 'players', 'scores', 'holes'],
            actions: ['fetchGameDetail'],
        });

        const gameId = options?.gameId;
        const groupId = options?.groupId; // 新增:获取 groupId 参数

        this.setData({ gameId, groupId });

        if (gameId) {
            if (groupId) {
                console.log('🎯 加载指定分组的比赛详情', { gameId, groupId });
                this.fetchGameDetail(gameId, groupId);
            } else {
                console.log('🎯 加载比赛详情', { gameId });
                this.fetchGameDetail(gameId);
            }
        } else {
            console.warn('⚠️ 无效的比赛ID');
            wx.showToast({
                title: '比赛ID无效',
                icon: 'none'
            });
        }
    },

    onUnload() {
        // ** 关键:在页面销毁时清理绑定 **
        this.storeBindings.destroyStoreBindings();
    },

    // 重试加载
    retryLoad() {
        if (this.data.loading) return;

        const { gameId, groupId } = this.data;

        if (gameId) {
            if (groupId) {
                this.fetchGameDetail(gameId, groupId);
            } else {
                this.fetchGameDetail(gameId);
            }
        }
    },

    // 切换tab页方法
    switchTab: function (e) {
        const tabValue = e.currentTarget.dataset.tab;
        const newTab = Number.parseInt(tabValue, 10);

        // 确保 newTab 是有效的数字
        if (Number.isNaN(newTab) || newTab < 0) {
            console.warn('⚠️ 无效的tab值:', tabValue);
            return;
        }

        console.log('📊 [GameDetail] 切换到tab:', newTab);
        this.setData({ currentTab: newTab });

        // 当切换到游戏tab时，通知gamble组件刷新数据
        if (newTab === 2) {
            this.refreshGambleData();
        }
    },

    // 刷新游戏数据
    refreshGambleData() {
        console.log('📊 [GameDetail] 刷新游戏数据');
        const gambleComponent = this.selectComponent('#gambleComponent');
        gambleComponent?.refreshRuntimeConfig?.();
    },

    // 刷新 runtime configs
    refreshRuntimeConfigs() {
        console.log('📊 [GameDetail] 刷新 runtime configs');
        const gambleComponent = this.selectComponent('#gambleComponent');
        gambleComponent?.refreshRuntimeConfig?.();
    },

    // 页面显示时检查数据
    onShow() {
        // 每次页面显示都强制刷新数据，确保记分tab有最新的球员和球洞
        const { gameId, groupId } = this.data;
        if (gameId) {
            if (groupId) {
                this.fetchGameDetail(gameId, groupId);
            } else {
                this.fetchGameDetail(gameId);
            }
        }

        // 刷新 runtime configs，确保配置列表是最新的
        this.refreshRuntimeConfigs();
    },





});