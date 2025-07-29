import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/gameStore'

Page({
    data: {
        gameId: '',
        groupId: '',
        currentTab: 0,
    },

    onLoad(options) {
        this.storeBindings = createStoreBindings(this, {
            store: gameStore,
            fields: ['gameData', 'loading', 'error', 'players', 'scores', 'holes', 'red_blue'],
            actions: ['fetchGameDetail'], // 添加fetchGameDetail action
        });
        const gameId = options?.gameId;
        const groupId = options?.groupId;
        this.setData({ gameId, groupId });

        console.log('[gameDetail] 页面加载，参数:', { gameId, groupId });

        // 主动加载游戏数据
        if (gameId) {
            this.fetchGameDetail(gameId, groupId);
        }
    },

    onUnload() {
        this.storeBindings.destroyStoreBindings();
    },

    switchTab: function (e) {
        const tabValue = e.currentTarget.dataset.tab;
        const newTab = Number.parseInt(tabValue, 10);
        if (Number.isNaN(newTab) || newTab < 0) {
            console.warn('⚠️ 无效的tab值:', tabValue);
            return;
        }
        this.setData({ currentTab: newTab });
        this.refreshCurrentTab();
    },

    onShow() {
        console.log('[gameDetail] 页面显示，当前数据:', {
            gameData: this.data.gameData,
            gameId: this.data.gameId,
            groupId: this.data.groupId
        });
        this.refreshCurrentTab();
    },

    refreshCurrentTab() {
        const { currentTab } = this.data;
        if (currentTab === 0) {
            this.selectComponent('#gameMagement')?.refresh?.();
        } else if (currentTab === 1) {
            this.selectComponent('#bbsComponent')?.refresh?.();
        } else if (currentTab === 2) {
            console.log('🎯 刷新赌博tab');
            this.selectComponent('#GambleSummary')?.refresh?.();
        }
    },
});