/**
 * 分组卡片组件
 * 显示分组信息和组内球员
 */
Component({
    properties: {
        /** 分组ID */
        groupId: {
            type: String,
            value: '',
            observer(newVal) {
                console.log('[GroupCard] groupId 收到:', newVal, typeof newVal)
                this.setData({ _groupId: newVal })
            }
        },
        /** 分组名称（如 G1, G2） */
        groupName: {
            type: String,
            value: '',
            observer(newVal) {
                console.log('[GroupCard] groupName 收到:', newVal)
            }
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
        defaultAvatar: '/assets/images/default-avatar.png',
        _groupId: ''
    },

    methods: {
        onTap() {
            const groupId = this.data._groupId || this.properties.groupId
            console.log('[GroupCard] onTap, groupId:', groupId)
            if (this.properties.clickable) {
                // 使用 grouptap 避免与原生 tap 事件冲突
                this.triggerEvent('grouptap', { groupId })
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
