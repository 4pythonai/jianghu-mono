/**
 * 分组Tab组件
 * 展示和管理比赛分组
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../../../stores/game/gameStore'

Component({
    properties: {
        /** 是否显示提示动画 */
        showHint: {
            type: Boolean,
            value: false
        }
    },

    lifetimes: {
        attached() {
            // 绑定 gameStore
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: [
                    'groups',
                    'groupingPermission',
                    'isCreator'
                ],
                actions: [
                    'createGroup',
                    'deleteGroup'
                ]
            })
        },
        detached() {
            if (this.storeBindings) {
                this.storeBindings.destroyStoreBindings()
            }
        }
    },

    methods: {
        /**
         * 点击分组卡片（需要导航，通过事件通知主页面）
         */
        onGroupTap(e) {
            const { groupId } = e.detail
            this.triggerEvent('onGroupTap', { groupId })
        },

        /**
         * 删除分组（直接调用 store action）
         */
        async onGroupDelete(e) {
            const { groupId } = e.detail
            wx.showModal({
                title: '确认删除',
                content: '确定要删除该分组吗？',
                success: async (res) => {
                    if (res.confirm) {
                        wx.showLoading({ title: '删除中...' })
                        const result = await this.deleteGroup(groupId)
                        wx.hideLoading()

                        if (result.success) {
                            wx.showToast({ title: '删除成功', icon: 'success' })
                        } else {
                            wx.showToast({ title: result.message || '删除失败', icon: 'none' })
                        }
                    }
                }
            })
        },

        /**
         * 添加分组（直接调用 store action）
         */
        async onAddGroup() {
            wx.showLoading({ title: '创建中...' })
            const result = await this.createGroup()
            wx.hideLoading()

            if (result.success) {
                wx.showToast({ title: '创建成功', icon: 'success' })
            } else {
                wx.showToast({ title: result.message || '创建失败', icon: 'none' })
            }
        },

        /**
         * 添加球员到分组（通过事件通知主页面）
         */
        onAddPlayer(e) {
            const { groupId } = e.detail
            this.triggerEvent('onAddPlayer', { groupId })
        }
    }
})
