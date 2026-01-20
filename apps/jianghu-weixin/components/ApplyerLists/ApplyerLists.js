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
        show_name: {
            type: String,
            value: ''
        },
        /** 用户ID，用于点击跳转 */
        userId: {
            type: Number,
            value: 0
        },
        /** 江湖差点 */
        handicap: {
            type: null,
            value: null
        },
        /** 是否付款 */
        payed: {
            type: String,
            value: ''
        },
        /** 付款金额 */
        pay_money: {
            type: null,
            value: null
        },
        /** 分队ID */
        tagId: {
            type: null,
            value: null
        },
        /** 分队名称 */
        tagName: {
            type: String,
            value: ''
        },
        /** 性别 */
        gender: {
            type: String,
            value: 'unknown'
        },
        /** 是否已付费 */
        paid: {
            type: Boolean,
            value: false
        },
        /** 显示模式 */
        mode: {
            type: String,
            value: 'display'
        }
    },

    data: {
        defaultAvatar: '/assets/images/default-avatar.png'
    },

    methods: {
        handleEditTap() {
            this.triggerEvent('edit', {
                member: {
                    userId: this.properties.userId,
                    showName: this.properties.show_name,
                    gender: this.properties.gender,
                    tagId: this.properties.tagId,
                    tagName: this.properties.tagName
                }
            })
        },
        handleFeeTap() {
            this.triggerEvent('fee', {
                member: {
                    userId: this.properties.userId,
                    showName: this.properties.show_name,
                    payed: this.properties.payed,
                    pay_money: this.properties.pay_money
                }
            })
        }
    }
})
