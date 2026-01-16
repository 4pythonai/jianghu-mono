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
        /** 围观者列表 [{id/user_id, avatar, display_name}] 或纯头像URL数组（兼容旧数据） */
        spectators: {
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
        defaultAvatar: '/assets/images/default-avatar.png',
        displaySpectators: []
    },

    observers: {
        'spectators': function (spectators) {
            // 兼容旧数据格式（纯URL数组）和新格式（对象数组）
            const displaySpectators = spectators.slice(0, this.properties.maxShow).map(item => {
                if (typeof item === 'string') {
                    // 旧格式：纯 URL
                    return { avatar: item, id: 0 }
                }
                // 新格式：对象
                return {
                    id: item.user_id,
                    avatar: item.avatar
                }
            })
            this.setData({ displaySpectators })
        }
    },

    methods: {
        onMoreTap() {
            this.triggerEvent('more')
        }
    }
})
