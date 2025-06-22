Page({
    data: {
        gameId: null
    },

    onLoad(options) {
        const gameId = options?.gameId;
        console.log('🎯 [Poster] 页面加载', { gameId });
        
        this.setData({
            gameId: gameId || '未获取到gameId'
        });
    },

    onShow() {
        console.log('🎯 [Poster] 页面显示');
    },

    onReady() {
        wx.setNavigationBarTitle({
            title: '海报'
        });
    }
});