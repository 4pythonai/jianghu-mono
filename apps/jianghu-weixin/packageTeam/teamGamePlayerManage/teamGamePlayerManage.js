Page({
    data: {
        gameId: null
    },

    onLoad(options) {
        const gameId = Number(options.game_id)

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        this.setData({ gameId })
    }
})
