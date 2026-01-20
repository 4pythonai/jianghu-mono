Page({
    data: {
        gameId: null,
        mode: 'edit',
        pageTitle: '选手管理'
    },

    onLoad(options) {
        const gameId = Number(options.game_id)
        const mode = options.mode === 'fee' ? 'fee' : 'edit'
        const pageTitle = mode === 'fee' ? '收费管理' : '选手管理'

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        this.setData({ gameId, mode, pageTitle })
    }
})
