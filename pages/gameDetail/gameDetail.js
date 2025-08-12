import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/gameStore'

Page({
    data: {
        gameid: '',
        groupid: '',
        currentTab: 0,
    },

    onLoad(options) {
        this.storeBindings = createStoreBindings(this, {
            store: gameStore,
            fields: ['gameData', 'loading', 'error', 'players', 'scores', 'holes', 'red_blue'],
            actions: ['fetchGameDetail'], // 添加fetchGameDetail action
        });
        const gameid = options?.gameid;
        const groupid = options?.groupid;
        const tab = options?.tab;

        // 设置初始tab，如果传入了tab参数则使用，否则默认为0
        const currentTab = tab !== undefined ? Number.parseInt(tab) : 0;
        this.setData({ gameid, groupid, currentTab });

        console.log('[gameDetail] 页面加载，参数:', { gameid, groupid, tab, currentTab });

        // 主动加载游戏数据
        if (gameid) {
            this.fetchGameDetail(gameid, groupid);
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
            gameid: this.data.gameid,
            groupid: this.data.groupid
        });
        this.refreshCurrentTab();
    },

    refreshCurrentTab() {
        const { currentTab, gameid, groupid } = this.data;
        console.log('[gameDetail] 刷新当前tab:', { currentTab, gameid, groupid });

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

    // 菜单项点击事件处理
    onMenuAction(e) {
        const action = e.currentTarget.dataset.action;
        console.log('[gameDetail] 菜单项点击:', action);

        switch (action) {
            case 'viewDetail':
                this.handleViewDetail();
                break;
            default:
                console.warn('[gameDetail] 未知的菜单操作:', action);
        }
    },

    // 查看明细处理方法
    handleViewDetail() {
        console.log('[gameDetail] 显示明细抽屉');
        const drawer = this.selectComponent('#detailDrawer');
        if (drawer && drawer.show) {
            drawer.show();
        } else {
            console.warn('[gameDetail] Drawer组件未找到或没有show方法');
            wx.showToast({
                title: '组件加载失败',
                icon: 'none'
            });
        }
    },

    // Drawer确认事件
    onDrawerConfirm() {
        console.log('[gameDetail] Drawer确认');
        wx.showToast({
            title: '操作成功',
            icon: 'success'
        });
    },

    // Drawer关闭事件
    onDrawerClose() {
        console.log('[gameDetail] Drawer关闭');
    },

    // Drawer打开事件
    onDrawerOpen() {
        console.log('[gameDetail] Drawer打开');
    }
});