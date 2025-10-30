// groupsList.js
const app = getApp()

Page({
    data: {
        gameid: '',
        gameName: '',
        course: '',
        groups: [],
        loading: false,
        error: null
    },

    onLoad(options) {
        const { gameid } = options;
        if (gameid) {
            this.setData({ gameid });
            this.loadGameGroupsFromGlobal(gameid);
        } else {
            console.error('❌ 缺少 gameid 参数');
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
    loadGameGroupsFromGlobal(gameid) {
        try {
            this.setData({ loading: true, error: null });

            // 从全局数据获取 groups 信息
            const globalData = app.globalData?.currentGameGroups;

            if (globalData?.gameid === gameid && globalData?.groups) {
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
        const { groupid, groupName } = e.currentTarget.dataset;
        const { gameid } = this.data;

        console.log('📝 选择分组:', { gameid, groupid, groupName });

        wx.navigateTo({
            url: `/pages/gameDetail/score/score?gameid=${gameid}&groupid=${groupid}`
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
