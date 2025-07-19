import api from '../../../api/index'

Page({
    data: {
        groupIndex: 0,
        slotIndex: 0,
        friends: [], // 好友数据
        selectedFriends: [], // 选中的好友
        maxSelect: 4 // 最大选择数量
    },

    onLoad(options) {

        if (options.groupIndex !== undefined) {
            this.setData({
                groupIndex: Number.parseInt(options.groupIndex)
            });
        }

        if (options.slotIndex !== undefined) {
            this.setData({
                slotIndex: Number.parseInt(options.slotIndex)
            });
        }

        // 加载好友数据
        this.loadFriends();
    },

    /**
     * 加载好友数据
     */
    async loadFriends() {
        try {
            // 移除手动loading管理, 使用API自动管理
            const result = await api.user.getFriendList({}, {
                loadingTitle: '加载好友中...'
            });

            if (result?.code === 200 && result?.friends) {
                // 为每个好友添加选中状态
                const friends = result.friends.map(friend => ({
                    ...friend,
                    selected: false
                }));

                this.setData({
                    friends: friends
                });
                console.log('好友数据加载成功:', friends);
            } else {
                wx.showToast({
                    title: '加载失败',
                    icon: 'none'
                });
            }
        } catch (error) {
            console.error('加载好友失败:', error);
            wx.showToast({
                title: '网络错误',
                icon: 'none'
            });
        }
        // 移除finally中的loading管理
    },

    /**
     * 切换好友选择状态
     */
    toggleFriendSelection(e) {
        const { index } = e.currentTarget.dataset;
        const friends = [...this.data.friends];
        const selectedFriends = [...this.data.selectedFriends];

        const friend = friends[index];

        if (friend.selected) {
            // 取消选择
            friend.selected = false;
            const selectedIndex = selectedFriends.findIndex(f => f.userid === friend.userid);
            if (selectedIndex > -1) {
                selectedFriends.splice(selectedIndex, 1);
            }
        } else {
            // 选择好友
            if (selectedFriends.length >= this.data.maxSelect) {
                wx.showToast({
                    title: `最多只能选择${this.data.maxSelect}名好友`,
                    icon: 'none'
                });
                return;
            }

            friend.selected = true;
            selectedFriends.push(friend);
        }

        this.setData({
            friends,
            selectedFriends
        });

        console.log('当前选中的好友:', selectedFriends);
    },

    /**
     * 确认选择好友
     */
    confirmSelection() {
        if (this.data.selectedFriends.length === 0) {
            wx.showToast({
                title: '请至少选择一名好友',
                icon: 'none'
            });
            return;
        }

        // 获取当前页面栈
        const pages = getCurrentPages();

        // 查找最终的目标页面(commonCreate)
        let targetPage = null;
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];
            if (page.route && page.route.includes('commonCreate')) {
                targetPage = page;
                break;
            }
        }

        // 如果找到了最终目标页面, 直接调用它的方法
        if (targetPage && typeof targetPage.onFriendsSelected === 'function') {
            targetPage.onFriendsSelected(this.data.selectedFriends, this.data.groupIndex, this.data.slotIndex);
            // 计算需要返回的层级
            const deltaLevel = pages.length - pages.indexOf(targetPage) - 1;
            wx.navigateBack({ delta: deltaLevel });
            return;
        }

        // 如果没有找到最终目标页面, 尝试调用 PlayerSelector 组件的方法
        const playerSelector = this.selectComponent('/components/PlayerSelector/PlayerSelector');
        if (playerSelector) {
            playerSelector.addPlayerToSlot(this.data.slotIndex, this.data.selectedFriends[0], 'friendSelect');
            wx.navigateBack();
            return;
        }

        // 如果都不成功, 显示错误提示
        wx.showToast({
            title: '无法添加好友',
            icon: 'none'
        });
    },

    /**
     * 搜索好友
     */
    onSearchInput(e) {
        const keyword = e.detail.value.trim().toLowerCase();

        if (!keyword) {
            // 如果搜索关键词为空, 重新加载所有好友
            this.loadFriends();
            return;
        }

        // 过滤好友列表
        const allFriends = this.data.friends;
        const filteredFriends = allFriends.filter(friend =>
            friend.nickname?.toLowerCase().includes(keyword) ||
            friend.wx_nickname?.toLowerCase().includes(keyword) ||
            friend.userid?.toString().includes(keyword)
        );

        this.setData({
            friends: filteredFriends
        });
    },

    /**
     * 清空搜索
     */
    clearSearch() {
        this.loadFriends();
    },

    /**
     * 刷新数据
     */
    onPullDownRefresh() {
        this.loadFriends().finally(() => {
            wx.stopPullDownRefresh();
        });
    },

    onReady() {
        // 页面准备完成
    },

    onShow() {
        // 页面显示时重置选择状态
        this.setData({
            selectedFriends: []
        });

        // 重置好友选择状态
        const friends = this.data.friends.map(friend => ({
            ...friend,
            selected: false
        }));
        this.setData({ friends });
    },

    onHide() {

    },

    onUnload() {

    },

    onReachBottom() {

    },

    onShareAppMessage() {
        return {
            title: '好友选择',
            path: '/pages/player-select/friendSelect/friendSelect'
        };
    }
}); 