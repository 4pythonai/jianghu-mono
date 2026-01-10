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

        groups.forEach(group => {
            (group.players || []).forEach(player => {
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

        if (currentGroup && currentGroup.players) {
            this.setData({
                selectedPlayers: currentGroup.players.map(p => ({
                    id: String(p.id),
                    name: p.name,
                    avatar: p.avatar,
                    teamName: p.teamName || ''
                }))
            })
        }

        console.log('[group-config] selectedPlayers:', this.data.selectedPlayers)
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
                const playerId = String(m.id)
                const inGroupId = playerGroupMap[playerId]
                const isInCurrentGroup = selectedPlayers.some(p => String(p.id) === playerId)

                return {
                    id: playerId,
                    name: m.name,
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
        console.log('[group-config] currentTagPlayers:', players)
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
                const newSelected = [...selectedPlayers, {
                    id: playerId,
                    name: player.name,
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
