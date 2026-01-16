// showMode

const { imageUrl } = require('../../utils/image');

Component({
    properties: {
        /** 球员列表 [{id, avatar, name, ...}] */
        players: {
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
        moreCount: 0
    },

    observers: {
        'players, maxShow': function (players, maxShow) {
            // 保留完整的 player 对象，包含 id 用于跳转
            const showPlayers = players.slice(0, maxShow).map(p => ({
                id: p.user_id,
                avatar: imageUrl(p.avatar),
                name: p.display_name
            }))
            const moreCount = players.length - maxShow
            this.setData({
                showPlayers,
                moreCount: moreCount > 0 ? moreCount : 0
            })
        }
    }
})