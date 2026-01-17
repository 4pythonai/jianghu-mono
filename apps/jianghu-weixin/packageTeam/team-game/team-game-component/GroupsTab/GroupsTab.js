/**
 * 分组Tab组件
 * 展示和管理比赛分组
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'

Component({
    properties: {
        /** 是否显示提示动画 */
        showHint: {
            type: Boolean,
            value: false
        },
        /** 是否启用拖拽排序 */
        enableDrag: {
            type: Boolean,
            value: true
        }
    },

    data: {
        // 拖拽相关状态
        dragging: false,
        dragIndex: -1,
        dragStartIndex: -1,
        dragStartY: 0,
        dragOffsetY: 0,
        itemHeight: 0, // 每个分组项的实际高度
        groupsWithDrag: [] // 带拖拽状态的分组列表
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

            // 初始化时获取元素高度
            this.initItemHeight()
        },
        detached() {
            if (this.storeBindings) {
                this.storeBindings.destroyStoreBindings()
            }
        }
    },

    observers: {
        'groups': function (groups) {
            // 同步 groups 到 groupsWithDrag，添加拖拽状态
            this.setData({
                groupsWithDrag: (groups || []).map((group, index) => ({
                    ...group,
                    dragIndex: index,
                    isDragging: false,
                    dragOffset: 0
                }))
            })

            // 如果高度未初始化，重新获取
            if (!this.data.itemHeight && groups && groups.length > 0) {
                setTimeout(() => this.initItemHeight(), 100)
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
        },

        /**
         * 拖拽开始
         */
        onDragStart(e) {
            if (!this.properties.enableDrag) return

            const index = e.currentTarget.dataset.index
            const touch = e.touches[0]

            // 记录初始位置和索引
            this.setData({
                dragging: true,
                dragIndex: index,
                dragStartY: touch.clientY,
                dragStartIndex: index
            })

            // 震动反馈
            wx.vibrateShort()
        },

        /**
         * 初始化获取分组项高度
         */
        initItemHeight() {
            setTimeout(() => {
                const query = this.createSelectorQuery()
                query.select('.groups-tab-group-item').boundingClientRect()
                query.exec((res) => {
                    if (res && res[0] && res[0].height) {
                        // 获取实际高度，加上 gap（24rpx ≈ 12px）
                        const height = res[0].height + 12
                        this.setData({
                            itemHeight: height
                        })
                        console.log('[GroupsTab] 分组项高度:', height)
                    } else {
                        // 如果获取失败，使用估算值（约300rpx = 150px）
                        this.setData({
                            itemHeight: 150
                        })
                    }
                })
            }, 300)
        },

        /**
         * 拖拽移动
         */
        onDragMove(e) {
            if (!this.data.dragging || this.data.dragIndex === -1) return

            const touch = e.touches[0]
            if (!touch) return

            const offsetY = touch.clientY - this.data.dragStartY

            // 更新拖拽项的位置
            const groups = [...this.data.groupsWithDrag]
            const dragItem = groups[this.data.dragIndex]

            if (dragItem) {
                // 计算目标位置（使用实际高度或估算值）
                const itemHeight = this.data.itemHeight || 150 // 默认150px（约300rpx）
                const targetIndex = Math.round(offsetY / itemHeight) + this.data.dragIndex
                const clampedIndex = Math.max(0, Math.min(targetIndex, groups.length - 1))

                // 如果位置发生变化，重新排序
                if (clampedIndex !== this.data.dragIndex && clampedIndex >= 0 && clampedIndex < groups.length) {
                    // 移除拖拽项
                    const [draggedItem] = groups.splice(this.data.dragIndex, 1)
                    // 插入到新位置
                    groups.splice(clampedIndex, 0, draggedItem)
                    // 更新索引和状态
                    groups.forEach((item, idx) => {
                        item.dragIndex = idx
                        item.isDragging = idx === clampedIndex
                        item.dragOffset = idx === clampedIndex ? offsetY : 0
                    })

                    this.setData({
                        groupsWithDrag: groups,
                        dragIndex: clampedIndex
                    })
                } else {
                    // 只更新拖拽项的偏移量
                    dragItem.dragOffset = offsetY
                    dragItem.isDragging = true
                    this.setData({
                        [`groupsWithDrag[${this.data.dragIndex}].dragOffset`]: offsetY,
                        [`groupsWithDrag[${this.data.dragIndex}].isDragging`]: true
                    })
                }
            }
        },

        /**
         * 拖拽结束
         */
        onDragEnd(e) {
            if (!this.data.dragging) return

            const finalIndex = this.data.dragIndex
            const startIndex = this.data.dragStartIndex
            const groups = [...this.data.groupsWithDrag]

            // 重置拖拽状态
            groups.forEach((item, index) => {
                item.isDragging = false
                item.dragOffset = 0
            })

            this.setData({
                dragging: false,
                dragIndex: -1,
                dragStartIndex: -1,
                dragStartY: 0,
                groupsWithDrag: groups
            })

            // 打印当前所有组数据
            const groupData = groups.map((g, index) => ({
                index: index + 1,
                id: g.id,
                name: g.name,
                players: g.players
            }))
            console.log("🔴🟢🔵", groupData)

            // 如果位置发生变化，通知主页面更新顺序
            if (finalIndex !== -1 && finalIndex !== startIndex) {
                const reorderedGroups = groups.map(g => ({
                    id: g.id,
                    name: g.name,
                    players: g.players
                }))
                this.triggerEvent('onGroupsReorder', { groups: reorderedGroups })
            }
        }
    }
})
