Page({
    data: {
        gameId: null
    },

    onLoad(options) {
        const gameId = options?.gameId;
        console.log('💰 [PersonalBilingBook] 页面加载', { gameId });
        
        this.setData({
            gameId: gameId || '未获取到gameId'
        });
    },

    onShow() {
        console.log('💰 [PersonalBilingBook] 页面显示');
    },

    onReady() {
        wx.setNavigationBarTitle({
            title: '账本'
        });
    }
});