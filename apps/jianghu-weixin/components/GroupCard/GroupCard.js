/**
 * 分组卡片组件
 * 显示分组信息和组内球员
 */
Component({
    properties: {
        /** 分组ID */
        groupId: {
            type: Number,
            value: 0
        },
        /** 分组名称（如 G1, G2） */
        groupName: {
            type: String,
            value: ''
        },
        /** 组内球员列表 [{avatar, name, teamName, gender}] */
        players: {
            type: Array,
            value: []
        },
        /** 是否可删除 */
        deletable: {
            type: Boolean,
            value: true
        },
        /** 是否可点击查看详情 */
        clickable: {
            type: Boolean,
            value: true
        }
    },

    data: {
        defaultAvatar: '/assets/images/default-avatar.png'
    },

    methods: {
        onTap() {
            if (this.properties.clickable) {
                this.triggerEvent('tap', { groupId: this.properties.groupId })
            }
        },

        onDelete() {
            this.triggerEvent('delete', { groupId: this.properties.groupId })
        },

        onAddPlayer() {
            this.triggerEvent('addPlayer', { groupId: this.properties.groupId })
        }
    }
})
