import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'
import teamgameApi from '@/api/modules/teamgame'

const MIN_GROUP_SIZE = 2
const MAX_GROUP_SIZE = 4

/**
 * 游戏 Tab 组件
 * 虚拟组配置
 */
Component({
    data: {
        tagMembers: [],
        players: [],
        selectedIds: [],
        selectedPlayers: [],
        virtualGroups: [],
        nextGroupIndex: 1,
        saving: false
    },
    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['tagMembers', 'gameid']
            })

            this.syncSelection(this.data.tagMembers, this.data.selectedIds)
        },
        detached() {
            if (this.storeBindings) {
                this.storeBindings.destroyStoreBindings()
            }
        }
    },
    observers: {
        tagMembers(tagMembers) {
            this.syncSelection(tagMembers, this.data.selectedIds)
        },
        selectedIds(selectedIds) {
            this.syncSelection(this.data.tagMembers, selectedIds)
        }
    },
    methods: {
        syncSelection(tagMembers = [], selectedIds = []) {
            const memberList = Array.isArray(tagMembers) ? tagMembers : []
            const selectedSet = new Set((selectedIds || []).map(id => String(id)))
            const players = memberList.map(member => ({
                ...member,
                isSelected: selectedSet.has(String(member.user_id))
            }))
            const selectedPlayers = players.filter(member => member.isSelected)

            this.setData({
                players,
                selectedPlayers
            })
        },
        togglePlayerSelection(e) {
            const userId = e.currentTarget.dataset.userid
            if (!userId) {
                return
            }

            const selectedIds = new Set((this.data.selectedIds || []).map(id => String(id)))
            const key = String(userId)

            if (selectedIds.has(key)) {
                selectedIds.delete(key)
            } else {
                if (selectedIds.size >= MAX_GROUP_SIZE) {
                    wx.showToast({
                        title: `最多选择${MAX_GROUP_SIZE}人`,
                        icon: 'none'
                    })
                    return
                }
                selectedIds.add(key)
            }

            this.setData({
                selectedIds: Array.from(selectedIds)
            })
        },
        removeSelected(e) {
            const userId = e.currentTarget.dataset.userid
            if (!userId) {
                return
            }

            const selectedIds = (this.data.selectedIds || []).filter(
                id => String(id) !== String(userId)
            )
            this.setData({ selectedIds })
        },
        clearSelection() {
            this.setData({ selectedIds: [] })
        },
        buildGroupKey(members = []) {
            return members
                .map(member => String(member.user_id))
                .sort()
                .join('-')
        },
        async createVirtualGroup() {
            const members = this.data.selectedPlayers || []
            if (members.length < MIN_GROUP_SIZE) {
                wx.showToast({
                    title: `至少选择${MIN_GROUP_SIZE}人`,
                    icon: 'none'
                })
                return
            }

            if (members.length > MAX_GROUP_SIZE) {
                wx.showToast({
                    title: `最多选择${MAX_GROUP_SIZE}人`,
                    icon: 'none'
                })
                return
            }

            const groupKey = this.buildGroupKey(members)
            const exists = (this.data.virtualGroups || []).some(group => group.key === groupKey)
            if (exists) {
                wx.showToast({
                    title: '虚拟组成员已存在',
                    icon: 'none'
                })
                return
            }

            const groupName = `虚拟组 ${this.data.nextGroupIndex}`
            const memberIds = members.map(member => member.user_id)

            if (!this.data.gameid) {
                wx.showToast({
                    title: '缺少赛事信息',
                    icon: 'none'
                })
                return
            }

            this.setData({ saving: true })
            try {
                const res = await teamgameApi.createVirtualGroup({
                    game_id: this.data.gameid,
                    group_name: groupName,
                    member_ids: memberIds,
                    group_key: groupKey
                })
                if (res?.code !== 200) {
                    throw new Error(res?.message || '创建失败')
                }
            } catch (error) {
                wx.showToast({
                    title: error.message || '创建失败',
                    icon: 'none'
                })
                return
            } finally {
                this.setData({ saving: false })
            }

            const newGroup = {
                id: `virtual-${Date.now()}-${this.data.nextGroupIndex}`,
                name: groupName,
                key: groupKey,
                members: members.map(member => ({
                    user_id: member.user_id,
                    show_name: member.show_name,
                    avatar: member.avatar,
                    tagName: member.tagName,
                    tagColor: member.tagColor,
                    handicap: member.handicap
                }))
            }

            this.setData({
                virtualGroups: [...this.data.virtualGroups, newGroup],
                selectedIds: [],
                nextGroupIndex: this.data.nextGroupIndex + 1
            })

            wx.showToast({
                title: '创建成功',
                icon: 'success'
            })
        },
        removeVirtualGroup(e) {
            const groupId = e.currentTarget.dataset.groupid
            const group = (this.data.virtualGroups || []).find(item => item.id === groupId)
            if (!group) {
                return
            }

            wx.showModal({
                title: '删除虚拟组',
                content: `确定删除${group.name}吗？`,
                success: async (res) => {
                    if (!res.confirm) {
                        return
                    }

                    if (!this.data.gameid) {
                        wx.showToast({
                            title: '缺少赛事信息',
                            icon: 'none'
                        })
                        return
                    }

                    wx.showLoading({ title: '删除中...' })
                    try {
                        const result = await teamgameApi.deleteVirtualGroup({
                            game_id: this.data.gameid,
                            group_key: group.key
                        })
                        if (result?.code !== 200) {
                            throw new Error(result?.message || '删除失败')
                        }
                    } catch (error) {
                        wx.showToast({
                            title: error.message || '删除失败',
                            icon: 'none'
                        })
                        return
                    } finally {
                        wx.hideLoading()
                    }

                    const virtualGroups = (this.data.virtualGroups || []).filter(
                        item => item.id !== groupId
                    )
                    this.setData({ virtualGroups })
                    wx.showToast({
                        title: '删除成功',
                        icon: 'success'
                    })
                }
            })
        }
    }
});
