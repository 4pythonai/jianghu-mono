import api from '@/api/index'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'

Page({
    behaviors: [storeBindingsBehavior],
    storeBindings: {
        store: gameStore,
        fields: {
            storePlayers: 'players',
            storeGameid: 'gameid'
        }
    },

    data: {
        gameid: 0,
        groupIndex: 0,
        slotIndex: 0,
        maxSelect: 4
    },

    onLoad(options) {
        console.log('🔵 [friendSelect] onLoad options:', options);
        console.log('🔵 [friendSelect] gameStore.gameid:', gameStore.gameid);

        // 优先使用 URL 参数中的 gameid，其次使用 store 中的 gameid
        if (options.gameid !== undefined) {
            this.setData({ gameid: Number.parseInt(options.gameid) });
        } else if (gameStore.gameid) {
            this.setData({ gameid: gameStore.gameid });
        }

        if (options.groupIndex !== undefined) {
            this.setData({ groupIndex: Number.parseInt(options.groupIndex) });
        }
        if (options.slotIndex !== undefined) {
            this.setData({ slotIndex: Number.parseInt(options.slotIndex) });
        }
        if (options.maxSelect !== undefined) {
            this.setData({ maxSelect: Number.parseInt(options.maxSelect) });
        }
    },

    onShow() {
        // 重置组件选择状态
        const friendPicker = this.selectComponent('#friendPicker');
        if (friendPicker) {
            friendPicker.resetSelection();
        }
    },

    /**
     * 好友选择确认回调
     */
    async onFriendPickerConfirm(e) {
        const { friends, scene } = e.detail;
        console.log('🔵 [friendSelect] onFriendPickerConfirm:', { friends, scene });

        const gameid = this.data.gameid || gameStore.gameid;

        if (!gameid) {
            wx.showToast({ title: '缺少球局信息', icon: 'none' });
            return;
        }

        // 提取用户ID列表
        const userids = friends.map(f => f.userid);

        try {
            const result = await api.game.addFriendsToGame({
                gameid: gameid,
                userids: userids
            }, {
                loadingTitle: '添加中...'
            });

            if (result?.code === 200) {
                wx.showToast({
                    title: result.message || '添加成功',
                    icon: 'success'
                });

                // 刷新球局数据
                if (gameStore.fetchGameDetail) {
                    await gameStore.fetchGameDetail(gameid, gameStore.groupid);
                }

                // 延迟返回，让用户看到成功提示
                setTimeout(() => {
                    this.navigateBackToGame();
                }, 500);
            } else {
                wx.showToast({
                    title: result?.message || '添加失败',
                    icon: 'none'
                });
            }
        } catch (error) {
            console.error('🔵 [friendSelect] addFriendsToGame error:', error);
            wx.showToast({
                title: '网络错误',
                icon: 'none'
            });
        }
    },

    /**
     * 返回球局页面
     */
    navigateBackToGame() {
        const pages = getCurrentPages();

        // 查找目标页面(commonCreate)
        let targetPage = null;
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];
            if (page.route && page.route.includes('commonCreate')) {
                targetPage = page;
                break;
            }
        }

        if (targetPage && typeof targetPage.onFriendsAdded === 'function') {
            targetPage.onFriendsAdded();
            const deltaLevel = pages.length - pages.indexOf(targetPage) - 1;
            wx.navigateBack({ delta: deltaLevel });
            return;
        }

        // 使用 eventChannel 通信
        const eventChannel = this.getOpenerEventChannel();
        if (eventChannel) {
            eventChannel.emit('onFriendsAdded', {
                gameid: this.data.gameid,
                groupIndex: this.data.groupIndex,
                slotIndex: this.data.slotIndex
            });
        }

        wx.navigateBack();
    },

    /**
     * 好友选择取消回调
     */
    onFriendPickerCancel(e) {
        console.log('🔵 [friendSelect] onFriendPickerCancel:', e.detail);
        wx.navigateBack();
    },

    onPullDownRefresh() {
        const friendPicker = this.selectComponent('#friendPicker');
        if (friendPicker) {
            friendPicker.loadFriends().finally(() => {
                wx.stopPullDownRefresh();
            });
        } else {
            wx.stopPullDownRefresh();
        }
    },

    onShareAppMessage() {
        return {
            title: '好友选择',
            path: '/pages/player-select/friendSelect/friendSelect'
        };
    }
});
