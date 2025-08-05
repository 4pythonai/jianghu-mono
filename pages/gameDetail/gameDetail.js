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
        const tab = options?.tab;

        // 设置初始tab，如果传入了tab参数则使用，否则默认为0
        const currentTab = tab !== undefined ? Number.parseInt(tab) : 0;
        this.setData({ gameId, groupId, currentTab });

        console.log('[gameDetail] 页面加载，参数:', { gameId, groupId, tab, currentTab });

        // 主动加载游戏数据
        if (gameId) {
            this.fetchGameDetail(gameId, groupId);
        }

        // 延迟刷新当前tab数据，确保组件已经挂载
        setTimeout(() => {
            this.refreshCurrentTab();
        }, 100);
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
        const { currentTab, gameId, groupId } = this.data;
        console.log('[gameDetail] 刷新当前tab:', { currentTab, gameId, groupId });

        if (currentTab === 0) {
            const component = this.selectComponent('#gameMagement');
            if (component && component.refresh) {
                console.log('[gameDetail] 刷新记分tab');
                component.refresh();
            } else {
                console.warn('[gameDetail] 记分组件未找到或没有refresh方法');
            }
        } else if (currentTab === 1) {
            const component = this.selectComponent('#bbsComponent');
            if (component && component.refresh) {
                console.log('[gameDetail] 刷新互动tab');
                component.refresh();
            } else {
                console.warn('[gameDetail] 互动组件未找到或没有refresh方法');
            }
        } else if (currentTab === 2) {
            const component = this.selectComponent('#GambleSummary');
            if (component && component.refresh) {
                console.log('[gameDetail] 刷新游戏tab');
                component.refresh();
            } else {
                console.warn('[gameDetail] 游戏组件未找到或没有refresh方法');
            }
        }
    },
});