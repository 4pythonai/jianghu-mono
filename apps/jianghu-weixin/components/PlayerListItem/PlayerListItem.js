/**
 * 球员列表项组件
 * 用于报名人员列表，显示序号、头像、名字、差点等
 */
Component({
    properties: {
        /** 序号 */
        index: {
            type: Number,
            value: 0
        },
        /** 球员头像URL */
        avatar: {
            type: String,
            value: ''
        },
        /** 球员名字 */
        name: {
            type: String,
            value: ''
        },
        /** 江湖差点 */
        handicap: {
            type: null,
            value: null
        },
        /** 是否已付费 */
        paid: {
            type: Boolean,
            value: false
        }
    },

    data: {
        defaultAvatar: '/assets/images/default-avatar.png'
    },

    methods: {}
})
