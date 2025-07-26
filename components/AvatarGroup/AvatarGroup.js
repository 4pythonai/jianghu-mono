// showMode


Component({
    properties: {
        players: {
            type: Array,
            value: []
        },
        maxShow: {
            type: Number,
            value: 4
        },
        showMode: {
            type: String,
            value: 'group'
        }
    },

    data: {
        showAvatars: [],
        moreCount: 0
    },

    observers: {
        'players, maxShow': function (players, maxShow) {
            const avatarUrls = players.map(p => p.avatar)
            const showAvatars = avatarUrls.slice(0, maxShow)
            const moreCount = avatarUrls.length - maxShow
            this.setData({
                showAvatars,
                moreCount: moreCount > 0 ? moreCount : 0
            })
        }
    }
})