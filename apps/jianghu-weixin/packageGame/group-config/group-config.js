/**
 * 分组配置页面
 * 用于配置单个分组的成员
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/game/gameStore'
import navigationHelper from '../../utils/navigationHelper'

Page({
    data: {
        navBarHeight: 88,
        groupId: '',
        groupName: '',

        // 已选球员（当前分组）
        selectedPlayers: [],

        // TAG 相关
        currentTagIndex: 0,
        showTagPopup: false,

        // 当前 TAG 下的球员列表
        currentTagPlayers: [],

        // 球员分组状态 { playerId: groupId }
        playerGroupMap: {},

        // 默认值（防止 store 绑定前报错）
        gameTags: [],
        tagMembers: [],
        groups: []
    },

    onLoad(options) {
        const groupId = options.group_id || ''
        const groupName = decodeURIComponent(options.group_name || '')

        // 计算导航栏高度
        const { getNavBarHeight } = require('../../utils/systemInfo')
        const navBarHeight = getNavBarHeight()

        this.setData({
            navBarHeight,
            groupId,
            groupName
        })

        // 创建 store 绑定
        this.storeBindings = createStoreBindings(this, {
            store: gameStore,
            fields: ['gameTags', 'tagMembers', 'groups', 'gameid'],
            actions: ['updateGroupMembers', 'loadGroups']
        })

        // 初始化数据
        this.initData()
    },

    onUnload() {
        if (this.storeBindings) {
            this.storeBindings.destroyStoreBindings()
        }
    },

    /**
     * 初始化数据
     */
    initData() {
        // 强制同步 store 数据
        if (this.storeBindings) {
            this.storeBindings.updateStoreBindings()
        }

        setTimeout(() => {
            this.buildPlayerGroupMap()
            this.loadCurrentGroupPlayers()
            this.updateCurrentTagPlayers()
        }, 100)
    },

    /**
     * 构建球员分组映射
     */
    buildPlayerGroupMap() {
        const map = {}
        const groups = gameStore.groups || []

        console.log('[group-config] 原始 groups 数据:', JSON.stringify(groups, null, 2))

        groups.forEach(group => {
            (group.players || []).forEach(player => {
                console.log('[group-config] player 原始数据:', player)
                map[String(player.id)] = String(group.id)
            })
        })

        this.setData({ playerGroupMap: map })
        console.log('[group-config] playerGroupMap:', map)
    },

    /**
     * 加载当前分组的球员
     */
    loadCurrentGroupPlayers() {
        const { groupId } = this.data
        const groups = gameStore.groups || []
        const currentGroup = groups.find(g => String(g.id) === String(groupId))

        console.log('[group-config] currentGroup:', currentGroup)

        if (currentGroup && currentGroup.players) {
            const selectedPlayers = currentGroup.players.map(p => {
                console.log('[group-config] 当前分组 player 原始:', p)

                // 验证 user_id 字段
                if (p.user_id === undefined || p.user_id === null) {
                    console.error('🔴🟢🔵 ERROR [group-config] loadCurrentGroupPlayers: player.user_id 不存在', p)
                } else if (typeof p.user_id !== 'number') {
                    console.error('🔴🟢🔵 ERROR [group-config] loadCurrentGroupPlayers: player.user_id 不是数字类型', {
                        user_id: p.user_id,
                        type: typeof p.user_id,
                        player: p
                    })
                }

                const user_id = typeof p.user_id === 'number' ? p.user_id : Number(p.user_id)
                if (isNaN(user_id) || user_id === 0) {
                    console.error('🔴🟢🔵 ERROR [group-config] loadCurrentGroupPlayers: user_id 转换失败', {
                        original: p.user_id,
                        converted: user_id,
                        player: p
                    })
                }

                return {
                    id: String(p.id),
                    user_id: user_id,
                    name: p.name,
                    avatar: p.avatar,
                    teamName: p.teamName || ''
                }
            })
            this.setData({ selectedPlayers })
        }
    },

    /**
     * 更新当前 TAG 下的球员列表
     */
    updateCurrentTagPlayers() {
        const { currentTagIndex, playerGroupMap, groupId, selectedPlayers } = this.data
        const gameTags = gameStore.gameTags || []
        const tagMembers = gameStore.tagMembers || []


        if (gameTags.length === 0) {
            this.setData({ currentTagPlayers: [] })
            return
        }

        const currentTag = gameTags[currentTagIndex]
        if (!currentTag) {
            this.setData({ currentTagPlayers: [] })
            return
        }

        // 过滤当前 TAG 下的球员
        const players = tagMembers
            .filter(m => m.tagName === currentTag.tagName)
            .map(m => {
                // 注意：m.id 是 tag-member 记录ID，m.user_id 才是实际用户ID

                // 验证 user_id 字段
                if (m.user_id === undefined || m.user_id === null) {
                    console.error('🔴🟢🔵 ERROR [group-config] updateCurrentTagPlayers: tagMember.user_id 不存在', m)
                } else if (typeof m.user_id !== 'number') {
                    console.error('🔴🟢🔵 ERROR [group-config] updateCurrentTagPlayers: tagMember.user_id 不是数字类型', {
                        user_id: m.user_id,
                        type: typeof m.user_id,
                        tagMember: m
                    })
                }

                const user_id = typeof m.user_id === 'number' ? m.user_id : Number(m.user_id)
                if (isNaN(user_id) || user_id === 0) {
                    console.error('🔴🟢🔵 ERROR [group-config] updateCurrentTagPlayers: user_id 转换失败', {
                        original: m.user_id,
                        converted: user_id,
                        tagMember: m
                    })
                }

                const playerId = String(user_id)
                const inGroupId = playerGroupMap[playerId]
                const isInCurrentGroup = selectedPlayers.some(p => String(p.id) === playerId)


                return {
                    id: playerId,
                    user_id: user_id,
                    show_name: m.show_name,
                    avatar: m.avatar,
                    handicap: m.handicap,
                    // 是否已在当前分组（选中）
                    isSelected: isInCurrentGroup,
                    // 是否已在其他分组（禁用）
                    isDisabled: inGroupId && String(inGroupId) !== String(groupId),
                    // 所在分组ID
                    inGroupId: inGroupId || null
                }
            })

        this.setData({ currentTagPlayers: players })
    },

    /**
     * 返回上一页
     */
    handleBack() {
        navigationHelper.navigateBack()
    },

    /**
     * 切换 TAG
     */
    onTagChange(e) {
        const index = e.currentTarget.dataset.index
        if (index === this.data.currentTagIndex) return

        this.setData({ currentTagIndex: index })
        this.updateCurrentTagPlayers()
    },

    /**
     * 显示 TAG 选择弹窗
     */
    onShowTagPopup() {
        this.setData({ showTagPopup: true })
    },

    /**
     * 关闭 TAG 选择弹窗
     */
    onCloseTagPopup() {
        this.setData({ showTagPopup: false })
    },

    /**
     * 从弹窗选择 TAG
     */
    onSelectTag(e) {
        const index = e.currentTarget.dataset.index
        this.setData({
            currentTagIndex: index,
            showTagPopup: false
        })
        this.updateCurrentTagPlayers()
    },

    /**
     * 点击球员 checkbox
     */
    onPlayerToggle(e) {
        const { id, disabled } = e.currentTarget.dataset
        if (disabled) {
            wx.showToast({ title: '该球员已在其他组', icon: 'none' })
            return
        }

        const { selectedPlayers, currentTagPlayers } = this.data
        const playerId = String(id)

        // 检查是否已选中
        const isSelected = selectedPlayers.some(p => String(p.id) === playerId)

        if (isSelected) {
            // 取消选中
            const newSelected = selectedPlayers.filter(p => String(p.id) !== playerId)
            this.setData({ selectedPlayers: newSelected })
        } else {
            // 选中（检查是否超过4人）
            if (selectedPlayers.length >= 4) {
                wx.showToast({ title: '每组最多4人', icon: 'none' })
                return
            }

            // 找到球员信息
            const player = currentTagPlayers.find(p => String(p.id) === playerId)
            if (player) {
                // 验证 user_id 字段
                if (player.user_id === undefined || player.user_id === null) {
                    console.error('🔴🟢🔵 ERROR [group-config] onPlayerToggle: player.user_id 不存在', player)
                } else if (typeof player.user_id !== 'number') {
                    console.error('🔴🟢🔵 ERROR [group-config] onPlayerToggle: player.user_id 不是数字类型', {
                        user_id: player.user_id,
                        type: typeof player.user_id,
                        player: player
                    })
                }

                const user_id = typeof player.user_id === 'number' ? player.user_id : Number(player.user_id)
                if (isNaN(user_id) || user_id === 0) {
                    console.error('🔴🟢🔵 ERROR [group-config] onPlayerToggle: user_id 转换失败', {
                        original: player.user_id,
                        converted: user_id,
                        player: player
                    })
                }

                const newSelected = [...selectedPlayers, {
                    id: playerId,
                    user_id: user_id,
                    name: player.show_name || player.name || '',
                    avatar: player.avatar,
                    teamName: this.data.gameTags[this.data.currentTagIndex]?.tagName || ''
                }]
                this.setData({ selectedPlayers: newSelected })
            }
        }

        // 更新球员列表的选中状态
        this.updateCurrentTagPlayers()
    },

    /**
     * 从已选区域移除球员
     */
    onRemovePlayer(e) {
        const { id } = e.currentTarget.dataset
        const playerId = String(id)
        const newSelected = this.data.selectedPlayers.filter(p => String(p.id) !== playerId)
        this.setData({ selectedPlayers: newSelected })
        this.updateCurrentTagPlayers()
    },

    /**
     * 取消
     */
    onCancel() {
        navigationHelper.navigateBack()
    },

    /**
     * 保存分组
     */
    async onSave() {
        const { groupId, selectedPlayers } = this.data
        const userIds = selectedPlayers.map(p => p.id)

        wx.showLoading({ title: '保存中...' })

        try {
            const result = await this.updateGroupMembers(groupId, userIds)

            wx.hideLoading()

            if (result.success) {
                wx.showToast({ title: '保存成功', icon: 'success' })
                setTimeout(() => {
                    navigationHelper.navigateBack()
                }, 1000)
            } else {
                wx.showToast({ title: result.message || '保存失败', icon: 'none' })
            }
        } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: '保存失败', icon: 'none' })
            console.error('[group-config] 保存失败:', err)
        }
    }
})
