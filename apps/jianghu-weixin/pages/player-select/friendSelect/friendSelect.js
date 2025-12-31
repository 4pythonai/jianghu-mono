import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/gameStore'

Page({
    behaviors: [storeBindingsBehavior],
    storeBindings: {
        store: gameStore,
        fields: {
            storePlayers: 'players'
        }
    },

    data: {
        groupIndex: 0,
        slotIndex: 0,
        maxSelect: 4
    },

    onLoad(options) {
        console.log('🔵 [friendSelect] gameStore.players:', gameStore.players);

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
    onFriendPickerConfirm(e) {
        const { friends, scene } = e.detail;
        console.log('🔵 [friendSelect] onFriendPickerConfirm:', { friends, scene });

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

        if (targetPage && typeof targetPage.onFriendsSelected === 'function') {
            targetPage.onFriendsSelected(friends, this.data.groupIndex, this.data.slotIndex);
            const deltaLevel = pages.length - pages.indexOf(targetPage) - 1;
            wx.navigateBack({ delta: deltaLevel });
            return;
        }

        // 使用 eventChannel 通信
        const eventChannel = this.getOpenerEventChannel();
        if (eventChannel) {
            eventChannel.emit('onFriendsSelected', {
                friends: friends,
                groupIndex: this.data.groupIndex,
                slotIndex: this.data.slotIndex
            });
            wx.navigateBack();
            return;
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
