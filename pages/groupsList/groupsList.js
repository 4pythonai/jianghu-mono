// groupsList.js
const app = getApp()

Page({
    data: {
        gameId: '',
        gameName: '',
        course: '',
        groups: [],
        loading: false,
        error: null
    },

    onLoad(options) {
        const { gameId } = options;
        if (gameId) {
            this.setData({ gameId });
            this.loadGameGroupsFromGlobal(gameId);
        } else {
            console.error('❌ 缺少 gameId 参数');
            wx.showToast({
                title: '参数错误',
                icon: 'none'
            });
            // 返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }
    },

    // 从全局数据获取分组信息
    loadGameGroupsFromGlobal(gameId) {
        try {
            this.setData({ loading: true, error: null });

            // 从全局数据获取 groups 信息
            const globalData = app.globalData?.currentGameGroups;

            if (globalData?.gameId === gameId && globalData?.groups) {
                console.log('✅ 从全局数据获取分组信息:', globalData);

                this.setData({
                    gameName: globalData.gameName || '',
                    course: globalData.course || '',
                    groups: globalData.groups || []
                });

                // 清理全局数据
                if (app.globalData) {
                    app.globalData.currentGameGroups = null;
                }
            } else {
                throw new Error('未找到分组数据, 请重新进入');
            }

        } catch (error) {
            console.error('❌ 加载分组信息失败:', error);
            this.setData({
                error: error.message || '加载失败'
            });
            wx.showToast({
                title: error.message || '加载失败, 请重试',
                icon: 'none',
                duration: 2000
            });

            // 2秒后返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 2000);
        } finally {
            this.setData({ loading: false });
        }
    },

    // 点击分组, 进入计分页面
    onGroupTap(e) {
        const { groupId, groupName } = e.currentTarget.dataset;
        const { gameId } = this.data;

        console.log('📝 选择分组:', { gameId, groupId, groupName });

        wx.navigateTo({
            url: `/pages/gameDetail/gameDetail?gameId=${gameId}&groupId=${groupId}`
        });
    },

    // 重试加载(返回上一页重新选择)
    retryLoad() {
        if (this.data.loading) return;

        wx.showToast({
            title: '请重新选择比赛',
            icon: 'none'
        });

        setTimeout(() => {
            wx.navigateBack();
        }, 1500);
    },

    // 下拉刷新(返回上一页重新选择)
    async onPullDownRefresh() {
        wx.stopPullDownRefresh();
        wx.showToast({
            title: '请重新选择比赛',
            icon: 'none'
        });

        setTimeout(() => {
            wx.navigateBack();
        }, 1500);
    }
}); 