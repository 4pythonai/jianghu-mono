Component({
    properties: {
        avatars: {
            type: Array,
            value: []
        },
        maxShow: {
            type: Number,
            value: 4
        }
    },

    data: {
        showAvatars: [],
        moreCount: 0
    },

    observers: {
        'avatars, maxShow': function (avatars, maxShow) {
            const showAvatars = avatars.slice(0, maxShow)
            const moreCount = avatars.length - maxShow
            this.setData({
                showAvatars,
                moreCount: moreCount > 0 ? moreCount : 0
            })
        }
    }
})