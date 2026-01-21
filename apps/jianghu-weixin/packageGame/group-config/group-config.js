/**
 * 分组配置页面
 * 用于配置单个分组的成员
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'
import navigationHelper from '@/utils/navigationHelper'
import {
    buildPlayerGroupMap,
    buildSelectedPlayersForGroup,
    buildCurrentTagPlayers
} from '@/utils/teamGameUtils'

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
        const { getNavBarHeight } = require('@/utils/systemInfo')
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
        const groups = gameStore.groups || []

        console.log('[group-config] 原始 groups 数据:', JSON.stringify(groups, null, 2))

        const map = buildPlayerGroupMap(groups)

        this.setData({ playerGroupMap: map })
        console.log('[group-config] playerGroupMap:', map)
    },

    /**
     * 加载当前分组的球员
     */
    loadCurrentGroupPlayers() {
        const { groupId } = this.data
        const groups = gameStore.groups || []
        const selectedPlayers = buildSelectedPlayersForGroup(groups, groupId)
        this.setData({ selectedPlayers })
    },

    /**
     * 更新当前 TAG 下的球员列表
     */
    updateCurrentTagPlayers() {
        const { currentTagIndex, playerGroupMap, groupId, selectedPlayers } = this.data
        const gameTags = gameStore.gameTags || []
        const tagMembers = gameStore.tagMembers || []
        const players = buildCurrentTagPlayers({
            gameTags,
            tagMembers,
            currentTagIndex,
            playerGroupMap,
            groupId,
            selectedPlayers
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
                const newSelected = [...selectedPlayers, {
                    id: playerId,
                    user_id: player.user_id,
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
