/**
 * 球员头像组件
 * 显示球员头像、名字、所属球队、性别标识
 * 支持可选模式（带checkbox）
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
        /** 头像大小: small | medium | large */
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
        }
    },

    data: {
        defaultAvatar: '/assets/images/default-avatar.png'
    },

    methods: {
        onTap() {
            if (this.properties.selectable) {
                this.triggerEvent('select', { selected: !this.properties.selected })
            }
        }
    }
})
