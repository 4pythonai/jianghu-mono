/**
 * 围观人数组件
 * 显示围观人数和头像列表
 */
Component({
    properties: {
        /** 围观人数 */
        count: {
            type: Number,
            value: 0
        },
        /** 围观者头像列表 */
        avatars: {
            type: Array,
            value: []
        },
        /** 最多显示多少个头像 */
        maxShow: {
            type: Number,
            value: 8
        }
    },

    data: {
        defaultAvatar: '/assets/images/default-avatar.png'
    },

    methods: {
        onMoreTap() {
            this.triggerEvent('more')
        }
    }
})
