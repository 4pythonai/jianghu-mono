/**
 * 球员头像组件
 * 显示球员头像、名字、所属球队、性别标识
 * 支持可选模式（带checkbox）
 * 支持点击跳转用户主页
 */
Component({
    properties: {
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
        /** 所属球队名称 */
        teamName: {
            type: String,
            value: ''
        },
        /** 性别: male | female */
        gender: {
            type: String,
            value: 'male'
        },
        /** 头像大小: mini | xs | small | medium | large */
        size: {
            type: String,
            value: 'medium'
        },
        /** 是否显示球队名称 */
        showTeam: {
            type: Boolean,
            value: true
        },
        /** 是否显示名字 */
        showName: {
            type: Boolean,
            value: true
        },
        /** 是否为可选模式 */
        selectable: {
            type: Boolean,
            value: false
        },
        /** 是否选中（selectable模式下） */
        selected: {
            type: Boolean,
            value: false
        },
        /** 用户ID，用于点击跳转用户主页 */
        userId: {
            type: Number,
            value: 0
        },
        /** 是否可点击跳转用户主页（默认true，如果有userId则自动跳转） */
        clickable: {
            type: Boolean,
            value: true
        },
        /** 是否只显示头像（不显示名字和球队） */
        avatarOnly: {
            type: Boolean,
            value: false
        },
        /** 头像形状: round（圆形） | square（矩形圆角） */
        shape: {
            type: String,
            value: 'square'
        }
    },

    data: {
        defaultAvatar: '/assets/images/default-avatar.png'
    },

    methods: {
        onTap() {
            // 可选模式：触发选择事件
            if (this.properties.selectable) {
                this.triggerEvent('select', { selected: !this.properties.selected })
                return
            }

            // 可点击模式：跳转用户主页
            if (this.properties.clickable && this.properties.userId) {
                const app = getApp()
                const currentUserId = app?.globalData?.userInfo?.id

                // 如果是自己，跳转到"我的"页面（转为数字比较，避免类型不匹配）
                if (currentUserId && Number(this.properties.userId) === Number(currentUserId)) {
                    wx.switchTab({
                        url: '/pages/mine/mine'
                    })
                } else {
                    wx.navigateTo({
                        url: `/pages/user-profile/user-profile?userId=${this.properties.userId}`
                    })
                }
                return
            }

            // 触发点击事件（供父组件处理）
            this.triggerEvent('tap')
        }
    }
})
