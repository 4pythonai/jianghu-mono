import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/gameStore'

Page({
    usingComponents: {
        'bbs': './bbs/bbs',
        'gamble': './gamble/gamble',
        'ScoreTable': './ScoreTable/ScoreTable'
    },
    data: {
        // currentTab 现在从 store 中获取，不需要在 data 中定义
        gameId: '',
        groupId: ''
    },

    onLoad(options) {
        // ** 核心：创建 Store 和 Page 的绑定 **
        this.storeBindings = createStoreBindings(this, {
            store: gameStore, // 需要绑定的 store
            fields: ['gameData', 'loading', 'error', 'players', 'scores', 'holes', 'currentTab'], // 添加 currentTab
            actions: ['fetchGameDetail', 'setCurrentTab'], // 添加 setCurrentTab
        });

        const gameId = options?.gameId;
        const groupId = options?.groupId; // 新增：获取 groupId 参数

        // 存储到页面数据中，供重试时使用
        this.setData({ gameId, groupId });

        if (gameId) {
            // 直接调用从 store 映射来的 action 来获取数据
            // 如果有 groupId，一并传递
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
        // ** 关键：在页面销毁时清理绑定 **
        this.storeBindings.destroyStoreBindings();
    },

    // 重试加载
    retryLoad() {
        if (this.data.loading) return;

        console.log('🔄 重试加载比赛详情');
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
        const newTab = Number.parseInt(e.currentTarget.dataset.tab, 10);
        console.log('📑 切换到Tab:', newTab);

        // 使用 store 的 action 来管理状态
        this.setCurrentTab(newTab);
    },

    // 页面显示时检查数据
    onShow() {
        // 如果没有数据、不在加载中且有错误，可以尝试重新加载
        if (!this.data.gameData && !this.data.loading && this.data.error) {
            console.log('📝 页面显示，检测到错误状态，自动重试加载');
            const { gameId, groupId } = this.data;

            if (gameId) {
                if (groupId) {
                    this.fetchGameDetail(gameId, groupId);
                } else {
                    this.fetchGameDetail(gameId);
                }
            }
        }
    },

    onCellClick(e) {
        const { holeIndex, playerIndex, unique_key } = e.detail;
        const scoreInputPanel = this.selectComponent('#scoreInputPanel');
        if (scoreInputPanel) {
            scoreInputPanel.show({ holeIndex, playerIndex, unique_key });
        } else {
            console.error("无法找到 #scoreInputPanel 组件");
        }
    }
});