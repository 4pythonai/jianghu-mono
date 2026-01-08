/**
 * 球队比赛详情页
 * game-type: single_team (队内赛) | cross_teams (队际赛)
 * 使用 gameStore 管理数据
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/game/gameStore'

Page({
    data: {
        navBarHeight: 88,       // 导航栏高度（状态栏 + 44px）

        // Tab 相关
        currentTab: 0,          // 0:赛事详情 1:报名人员 2:分组 3:讨论区
        tabs: ['赛事详情', '报名人员', '分组', '讨论区'],

        // 用户状态（本地）
        isRegistered: false,    // 是否已报名

        // 弹窗状态
        showMoreActions: false,

        // 默认值（防止 store 绑定前 WXML 报错）
        spectators: { count: 0, avatars: [] },
        subteams: [],
        tagMembers: [],
        groups: [],
        eventDetail: {}
    },

    onLoad(options) {
        const gameType = options['game-type'] || options.gameType || 'single_team'
        const gameId = options.game_id || options.gameId || null

        // 计算导航栏高度
        const systemInfo = wx.getSystemInfoSync()
        const statusBarHeight = systemInfo.statusBarHeight || 0
        const navBarHeight = statusBarHeight + 44

        this.setData({ navBarHeight })

        // 创建 store 绑定
        this.storeBindings = createStoreBindings(this, {
            store: gameStore,
            fields: [
                'loading',
                'gameType',
                'gameid',
                'eventDetail',
                'subteams',
                'tagMembers',
                'groups',
                'spectators',
                'groupingPermission',
                'isCreator'
            ],
            actions: [
                'fetchTeamGameDetail',
                'loadSubteams',
                'loadTagMembers',
                'loadGroups',
                'loadSpectators',
                'recordSpectator',
                'createGroup',
                'deleteGroup'
            ]
        })

        // 先尝试用缓存数据快速显示
        const cachedEvent = wx.getStorageSync('teamGameEventData')
        if (cachedEvent) {
            this.applyCachedData(cachedEvent)
            wx.removeStorageSync('teamGameEventData')
        }

        // 加载数据
        if (gameId) {
            this.initData(gameId, gameType)
        }
    },

    onUnload() {
        // 销毁 store 绑定
        if (this.storeBindings) {
            this.storeBindings.destroyStoreBindings()
        }
    },

    onShow() {
        // 页面显示时刷新数据（如果需要）
    },

    /**
     * 初始化数据
     */
    async initData(gameId, gameType) {
        try {
            // 并行加载所有数据
            await Promise.all([
                this.fetchTeamGameDetail(gameId, gameType),
                this.loadTagMembers(gameId),
                this.loadGroups(gameId),
                this.loadSpectators(gameId)
            ])

            // 强制同步 store 数据到页面（MobX 响应式更新可能有延迟）
            if (this.storeBindings) {
                this.storeBindings.updateStoreBindings()
            }

            // 打印调试信息
            console.log('[TeamGameDetail] initData 完成, groups:', JSON.stringify(this.data.groups))

            // 静默记录围观
            this.recordSpectator(gameId)
        } catch (err) {
            console.error('[TeamGameDetail] 初始化失败:', err)
            wx.showToast({ title: '加载失败', icon: 'none' })
        }
    },

    /**
     * 应用缓存数据（快速显示）
     */
    applyCachedData(cachedEvent) {
        const teamGameInfo = cachedEvent.extra_team_game_info || {}
        // 直接更新 store 的 eventDetail（临时方案）
        gameStore.eventDetail = {
            ...gameStore.eventDetail,
            title: teamGameInfo.team_game_title || cachedEvent.game_name || '未命名赛事',
            teamName: teamGameInfo.team_name || '',
            teamAvatar: teamGameInfo.team_avatar || '',
            teams: teamGameInfo.teams || [],
            location: cachedEvent.course || '待定',
            dateTime: cachedEvent.game_start || '',
            fee: cachedEvent.fee || '待定',
            deadline: cachedEvent.deadline || '',
            coverType: cachedEvent.coverType || 'default',
            covers: cachedEvent.covers || []
        }
    },

    /**
     * 返回上一页
     */
    handleBack() {
        wx.navigateBack({ delta: 1 })
    },

    /**
     * 切换 Tab
     */
    switchTab(e) {
        const index = e.currentTarget.dataset.index
        if (this.data.currentTab === index) return
        this.setData({ currentTab: index })
    },

    /**
     * 点击分享按钮
     */
    onShareTap() {
        wx.showToast({ title: '分享功能开发中', icon: 'none' })
    },

    /**
     * 点击报名/取消报名按钮
     */
    onRegisterTap() {
        if (this.data.isRegistered) {
            wx.showModal({
                title: '确认取消',
                content: '确定要取消报名吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.cancelRegistration()
                    }
                }
            })
        } else {
            this.register()
        }
    },

    /**
     * 报名
     */
    async register() {
        wx.showToast({ title: '报名功能开发中', icon: 'none' })
    },

    /**
     * 取消报名
     */
    async cancelRegistration() {
        wx.showToast({ title: '取消报名功能开发中', icon: 'none' })
    },

    /**
     * 点击更多按钮
     */
    onMoreTap() {
        this.setData({ showMoreActions: true })
    },

    /**
     * 关闭更多操作弹窗
     */
    onCloseMoreActions() {
        this.setData({ showMoreActions: false })
    },

    /**
     * 处理更多操作
     */
    onActionTap(e) {
        const action = e.currentTarget.dataset.action
        this.setData({ showMoreActions: false })

        const actionMessages = {
            registerForFriend: '替好友报名',
            closeRegistration: '关闭报名',
            managePlayer: '选手管理',
            editGame: '修改比赛',
            editGroup: '修改分组',
            manageFee: '收费管理',
            cancelGame: '取消比赛',
            startGame: '开始比赛',
            manageScore: '记分管理'
        }

        if (actionMessages[action]) {
            wx.showToast({ title: actionMessages[action], icon: 'none' })
        }
    },

    /**
     * 点击查看更多围观者
     */
    onSpectatorMore() {
        const gameName = encodeURIComponent(this.data.eventDetail?.title || '')
        wx.navigateTo({
            url: `/pages/spectators/spectators?game_id=${this.data.gameid}&game_name=${gameName}`
        })
    },

    /**
     * 点击分组卡片
     */
    onGroupTap(e) {
        console.log('[onGroupTap] e:', e)
        const { groupId } = e.detail
        console.log('[onGroupTap] groupId:', groupId)
        wx.showToast({ title: `查看分组 ${groupId}`, icon: 'none' })
    },

    /**
     * 删除分组
     */
    onGroupDelete(e) {
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
     * 添加球员到分组
     */
    onAddPlayerToGroup(e) {
        const { groupId } = e.detail
        wx.showToast({ title: `添加球员到分组 ${groupId}`, icon: 'none' })
    },

    /**
     * 添加新分组
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
    }
})
