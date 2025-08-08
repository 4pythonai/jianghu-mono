Page({
    data: {
        gameid: null
    },

    onLoad(options) {
        const gameid = options?.gameid;
        console.log('📝 [Feedback] 页面加载', { gameid });

        this.setData({
            gameid: gameid || '未获取到gameId'
        });
    },

    onShow() {
        console.log('📝 [Feedback] 页面显示');
    },

    onReady() {
        wx.setNavigationBarTitle({
            title: '反馈'
        });
    }
});