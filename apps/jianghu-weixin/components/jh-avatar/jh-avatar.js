/**
 * 球员头像组件
 * 显示球员头像、名字、所属球队、性别标识
 * 支持可选模式（带checkbox）
 * 支持点击跳转用户主页
 */
const { imageUrl } = require('@/utils/image')

Component({
    properties: {
        /** 球员头像URL */
        avatar: {
            type: String,
            value: ''
        },

        show_name: {
            type: String,
            value: ''
        },
        /** 性别: 'male' 或 'female' */
        gender: {
            type: String,
            value: ''
        },
        /** 差点，如 "10.1" 或 10 */
        handicap: {
            type: String,
            value: ''
        },
        /** 头像大小: mini | xs | small | medium | large */
        size: {
            type: String,
            value: 'medium'
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
        user_id: {
            type: Number,
            value: 0
        },
        /** 是否可点击跳转用户主页（默认true，如果有user_id则自动跳转） */
        clickable: {
            type: Boolean,
            value: true
        },
        /** 是否只显示头像（不显示名字和球队） */
        avatar_only: {
            type: Boolean,
            value: false
        },
        /** 头像形状: round（圆形） | square（矩形圆角） */
        shape: {
            type: String,
            value: 'round'
        }
    },

    data: {
        defaultAvatar: '/assets/images/default-avatar.png',
        fullAvatarUrl: ''
    },

    observers: {
        'avatar': function (avatarPath) {
            // 将相对路径转换为完整 URL
            const fullUrl = avatarPath ? imageUrl(avatarPath) : ''
            this.setData({ fullAvatarUrl: fullUrl })
        },
        'user_id': function (user_id) {
        }
    },

    lifetimes: {
        attached() {
            // 组件挂载时初始化头像 URL
            if (this.properties.avatar) {
                this.setData({
                    fullAvatarUrl: imageUrl(this.properties.avatar)
                })
            }

            // 添加日志：检查接收到的 user_id 属性
        }
    },

    methods: {
        onTap() {
            // 可选模式：触发选择事件
            if (this.properties.selectable) {
                this.triggerEvent('select', { selected: !this.properties.selected })
                return
            }

            // 可点击模式：跳转用户主页
            if (this.properties.clickable && this.properties.user_id) {
                const app = getApp()
                const currentUserId = app?.globalData?.userInfo?.id

                // 如果是自己，跳转到"我的"页面（转为数字比较，避免类型不匹配）
                if (currentUserId && Number(this.properties.user_id) === Number(currentUserId)) {
                    wx.switchTab({
                        url: '/pages/mine/mine'
                    })
                } else {
                    wx.navigateTo({
                        url: `/packagePlayer/user-profile/user-profile?user_id=${this.properties.user_id}`
                    })
                }
                return
            }

            // 触发点击事件（供父组件处理）
            this.triggerEvent('tap')
        }
    }
})
