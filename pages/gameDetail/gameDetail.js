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
            fields: ['gameData', 'loading', 'error', 'players', 'scores', 'holes'],
            actions: [], // 不再需要fetchGameDetail
        });
        const gameId = options?.gameId;
        const groupId = options?.groupId;
        this.setData({ gameId, groupId });
        // 不再主动拉取数据，交由各tab组件管理
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
            this.selectComponent('#gambleComponent')?.refresh?.();
        }
    },
});