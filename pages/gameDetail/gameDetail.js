import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/gameStore'

Page({
    usingComponents: {
        'bbs': './bbs/bbs',
        'gamble': './gamble/gamble',
        'ScoreTable': './ScoreTable/ScoreTable'
    },
    data: {
        currentTab: 0, // 当前激活的tab索引
    },

    onLoad(options) {
        // ** 核心：创建 Store 和 Page 的绑定 **
        this.storeBindings = createStoreBindings(this, {
            store: gameStore, // 需要绑定的 store
            fields: ['gameData', 'loading', 'error', 'players', 'scores', 'holes'], // 将 store 中的字段映射到 page 的 data
            actions: ['fetchGameDetail'], // 将 store 中的方法映射到 page 的 methods
        });

        const gameId = options?.gameId;
        if (gameId) {
            // 直接调用从 store 映射来的 action 来获取数据
            this.fetchGameDetail(gameId);
        } else {
            console.warn('⚠️ 无效的比赛ID');
            wx.showToast({
                title: '比赛ID无效',
                icon: 'none'
            });
        }
    },

    onUnload() {
        // ** 关键：在页面销毁时清理绑定 **
        this.storeBindings.destroyStoreBindings();
    },

    // 重试加载
    retryLoad() {
        if (this.data.loading) return;

        console.log('🔄 重试加载比赛详情');
        if (gameStore.gameid) {
            this.fetchGameDetail(gameStore.gameid);
        }
    },

    // 切换tab页方法
    switchTab: function (e) {
        const newTab = Number.parseInt(e.currentTarget.dataset.tab, 10);
        console.log('📑 切换到Tab:', newTab);

        this.setData({
            currentTab: newTab
        });
    },

    // 页面显示时检查数据
    onShow() {
        // 如果没有数据、不在加载中且有错误，可以尝试重新加载
        if (!this.data.gameData && !this.data.loading && this.data.error && gameStore.gameid) {
            console.log('📝 页面显示，检测到错误状态，自动重试加载');
            this.fetchGameDetail(gameStore.gameid);
        }
    }
});