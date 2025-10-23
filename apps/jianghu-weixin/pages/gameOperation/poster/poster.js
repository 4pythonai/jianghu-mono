Page({
    data: {
        gameid: null
    },

    onLoad(options) {
        const gameid = options?.gameid;

        this.setData({
            gameid: gameid || '未获取到gameId'
        });
    },

    onShow() {
    },

    onReady() {
        wx.setNavigationBarTitle({
            title: '海报'
        });
    }
});