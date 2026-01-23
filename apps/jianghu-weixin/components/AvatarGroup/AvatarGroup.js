// showMode

const { imageUrl } = require('@/utils/image');

Component({
    properties: {
        /** 球员列表 [{id, avatar, name, ...}] */
        players: {
            type: Array,
            value: []
        },
        /** 图片 URL 数组（用于直接显示图片，如团队 logo） */
        avatars: {
            type: Array,
            value: []
        },
        /** 最多显示几个头像 */
        maxShow: {
            type: Number,
            value: 4
        },
        /** 显示模式 */
        showMode: {
            type: String,
            value: 'group'
        },
        /** 是否可点击跳转用户主页 */
        clickable: {
            type: Boolean,
            value: true
        }
    },

    data: {
        showPlayers: [],
        showAvatars: [],
        moreCount: 0,
        useAvatarsMode: false
    },

    observers: {
        'avatars, maxShow': function (avatars, maxShow) {
            if (!avatars || avatars.length === 0) {
                this.setData({ useAvatarsMode: false, showAvatars: [] })
                return
            }
            // 直接使用图片 URL 数组模式
            const showAvatars = avatars.slice(0, maxShow).map(url => imageUrl(url))
            const moreCount = avatars.length - maxShow
            this.setData({
                useAvatarsMode: true,
                showAvatars,
                moreCount: moreCount > 0 ? moreCount : 0
            })
        },
        'players, maxShow': function (players, maxShow) {
            if (!players || players.length === 0) return
            // 保留完整的 player 对象，包含 id 用于跳转
            const showPlayers = players.slice(0, maxShow).map(p => ({
                id: p.user_id,
                avatar: imageUrl(p.avatar),
                name: p.show_name
            }))
            const moreCount = players.length - maxShow
            this.setData({
                showPlayers,
                moreCount: moreCount > 0 ? moreCount : 0
            })
        }
    }
})