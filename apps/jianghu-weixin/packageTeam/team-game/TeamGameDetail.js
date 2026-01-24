/**
 * 球队比赛详情页
 * game-type: single_team (队内赛) | cross_teams (队际赛)
 * 使用 gameStore 管理数据
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'
import navigationHelper from '@/utils/navigationHelper'

Page({
    data: {
        navBarHeight: 88,       // 导航栏高度（状态栏 + 44px）
        gameType: 'single_team', // 默认值，防止组件报错

        // Tab 相关
        currentTab: 0,          // 0:赛事详情 1:报名人员 2:分组 3:讨论区
        tabs: ['赛事详情', '报名人员', '分组', '讨论区'],

        // 用户状态（本地）
        isRegistered: false,    // 是否已报名
        showGroupHint: false,   // 分组Tab提示动画

        // 默认值（防止 store 绑定前 WXML 报错）
        spectators: { count: 0, avatars: [] },
        gameTags: [],
        tagMembers: [],
        groups: [],
        eventDetail: {
            title: '',
            teamName: '',
            teamAvatar: '',
            teams: [],
            backgroundImage: '',
            coverType: '',
            covers: []
        }
    },

    onLoad(options) {
        const gameType = options.game_type || 'single_team'
        // URL 参数统一使用下划线命名: game_id
        const gameId = options.game_id || null

        // 计算导航栏高度
        const { getNavBarHeight } = require('@/utils/systemInfo')
        const navBarHeight = getNavBarHeight()

        // 先设置本地 gameType，确保页面立即显示正确的 title
        this.setData({ navBarHeight, gameType })

        // 创建 store 绑定
        this.storeBindings = createStoreBindings(this, {
            store: gameStore,
            fields: [
                'loading',
                'gameType',
                'gameid',
                'eventDetail',
                'gameTags',
                'tagMembers',
                'groups',
                'spectators',
                'groupingPermission',
                'isCreator',
                'isRegistered'
            ],
            actions: [
                'fetchTeamGameDetail',
                'loadGameTags',
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

        if (this.groupHintTimer) {
            clearTimeout(this.groupHintTimer)
            this.groupHintTimer = null
        }
    },

    onShow() {
        // 页面显示时刷新分组数据（从 group-config 返回后更新）
        const needsRefresh = wx.getStorageSync('teamGameDetailNeedsRefresh')
        if (needsRefresh && this.data.gameid) {
            wx.removeStorageSync('teamGameDetailNeedsRefresh')
            this.initData(this.data.gameid, this.data.gameType)
            return
        }

        if (this.data.gameid && this.storeBindings) {
            this.loadGroups(this.data.gameid)
            this.storeBindings.updateStoreBindings()
        }
    },


    /**
     * 初始化数据
     */
    async initData(gameId, gameType) {
        try {
            // 并行加载所有数据
            await Promise.all([
                this.fetchTeamGameDetail(gameId, gameType),
                this.loadGameTags(gameId),
                this.loadTagMembers(gameId),
                this.loadGroups(gameId),
                this.loadSpectators(gameId)
            ])

            // 强制同步 store 数据到页面（MobX 响应式更新可能有延迟）
            if (this.storeBindings) {
                this.storeBindings.updateStoreBindings()
            }

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
        // cachedEvent 来自列表页，包含 extra_team_game_info（由 Events/getExtraTeamGameInfo 返回）
        // extra_team_game_info 字段: team_game_title, team_avatar, team_name, teams
        // cachedEvent 字段: game_name, course, game_start 等（由 MDetailGame.getGameDetail 返回）
        const teamGameInfo = cachedEvent.extra_team_game_info || {}
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
     * 取消报名（EventDetailTab 事件）
     */
    async onCancelRegister() {
        wx.showLoading({ title: '取消中...' })

        try {
            const app = getApp()
            const result = await app.api.teamgame.cancelRegistration({
                game_id: this.data.gameid
            })

            wx.hideLoading()

            if (result.code === 200) {
                wx.showToast({ title: '已取消报名', icon: 'success' })
                this.setData({ isRegistered: false })
                // 刷新报名人员列表
                await this.loadTagMembers(this.data.gameid)
                if (this.storeBindings) {
                    this.storeBindings.updateStoreBindings()
                }
            } else {
                wx.showToast({ title: result.message || '取消失败', icon: 'none' })
            }
        } catch (err) {
            wx.hideLoading()
            console.error('[TeamGameDetail] 取消报名失败:', err)
            wx.showToast({ title: '取消失败，请稍后重试', icon: 'none' })
        }
    },

    /**
     * 提交报名（EventDetailTab 事件）
     */
    async onSubmitRegister(e) {
        const { tagId, formData } = e.detail
        wx.showLoading({ title: '报名中...' })

        try {
            const app = getApp()
            const result = await app.api.teamgame.registerSingleTeamGame({
                game_id: this.data.gameid,
                tag_id: tagId,
                show_name: formData.show_name,
                gender: formData.gender,
                mobile: formData.mobile
            })

            wx.hideLoading()

            if (result.code === 200) {
                wx.showToast({ title: '报名成功', icon: 'success' })
                this.setData({ isRegistered: true })
                // 刷新报名人员列表
                await this.loadTagMembers(this.data.gameid)
                if (this.storeBindings) {
                    this.storeBindings.updateStoreBindings()
                }
            } else {
                wx.showToast({ title: result.message || '报名失败', icon: 'none' })
            }
        } catch (err) {
            wx.hideLoading()
            console.error('[TeamGameDetail] 报名失败:', err)
            wx.showToast({ title: '报名失败，请稍后重试', icon: 'none' })
        }
    },

    /**
     * 处理更多操作（EventDetailTab 事件）
     */
    onActionTap(e) {
        const { action } = e.detail

        const actionHandlers = {
            closeRegistration: () => this.confirmGameAction('关闭报名', () => this.closeRegistration()),
            startGame: () => this.confirmGameAction('开始比赛', () => this.startGame()),
            cancelGame: () => this.confirmGameAction('取消比赛', () => this.cancelTeamGame()),
            editGroup: () => this.openGroupTabWithHint(),
            editGame: () => this.goToEditGame(),
            manageScore: () => this.goToScorePermissionManage(),
            managePlayer: () => this.goToTeamGamePlayerManage(),
            manageFee: () => this.goToTeamGameFeeManage(),
            registerForFriend: () => this.goToTeamGameAddFriend()
        }

        if (actionHandlers[action]) {
            actionHandlers[action]()
            return
        }

        const actionMessages = {
            editGroup: '修改分组'
        }

        if (actionMessages[action]) {
            wx.showToast({ title: actionMessages[action], icon: 'none' })
        }
    },

    /**
     * 确认后执行比赛操作
     */
    confirmGameAction(actionText, onConfirm) {
        wx.showModal({
            title: '确认操作',
            content: `确定${actionText} ?`,
            success: (res) => {
                if (res.confirm) {
                    onConfirm()
                }
            }
        })
    },

    /**
     * 前往编辑赛事
     */
    goToEditGame() {
        const gameId = this.data.gameid
        const gameType = this.data.gameType

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        navigationHelper.navigateTo(
            `/packageTeam/editTeamGame/editTeamGame?game_id=${gameId}&game_type=${gameType}`
        )
    },

    /**
     * 前往记分管理
     */
    goToScorePermissionManage() {
        const gameId = this.data.gameid
        const gameType = this.data.gameType

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        navigationHelper.navigateTo(
            `/packageTeam/scorePermissionManage/scorePermissionManage?game_id=${gameId}&game_type=${gameType}`
        )
    },

    /**
     * 前往替好友报名
     */
    goToTeamGameAddFriend() {
        const gameId = this.data.gameid
        const gameType = this.data.gameType

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        navigationHelper.navigateTo(
            `/packageTeam/teamGameAddFriend/teamGameAddFriend?game_id=${gameId}&game_type=${gameType}`
        )
    },

    /**
     * 前往选手管理
     */
    goToTeamGamePlayerManage() {
        const gameId = this.data.gameid

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        navigationHelper.navigateTo(
            `/packageTeam/teamGamePlayerManage/teamGamePlayerManage?game_id=${gameId}`
        )
    },

    /**
     * 前往收费管理
     */
    goToTeamGameFeeManage() {
        const gameId = this.data.gameid

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        navigationHelper.navigateTo(
            `/packageTeam/teamGamePlayerManage/teamGamePlayerManage?game_id=${gameId}&mode=fee`
        )
    },

    /**
     * 切换到分组 Tab 并显示提示
     */
    openGroupTabWithHint() {
        this.setData({ currentTab: 2, showGroupHint: true })
        if (this.groupHintTimer) {
            clearTimeout(this.groupHintTimer)
        }
        this.groupHintTimer = setTimeout(() => {
            this.setData({ showGroupHint: false })
            this.groupHintTimer = null
        }, 1500)
    },

    /**
     * 刷新赛事详情
     */
    async refreshGameDetail() {
        try {
            await this.fetchTeamGameDetail(this.data.gameid, this.data.gameType)
            if (this.storeBindings) {
                this.storeBindings.updateStoreBindings()
            }
        } catch (err) {
            console.error('[TeamGameDetail] 刷新赛事详情失败:', err)
        }
    },

    /**
     * 截止报名
     */
    async closeRegistration() {
        wx.showLoading({ title: '截止中...' })

        try {
            const app = getApp()
            const result = await app.api.teamgame.closeRegistration({
                game_id: this.data.gameid
            })

            wx.hideLoading()

            if (result.code === 200) {
                wx.showToast({ title: result.message || '报名已截止', icon: 'success' })
                this.refreshGameDetail()
            } else {
                wx.showToast({ title: result.message || '操作失败', icon: 'none' })
            }
        } catch (err) {
            wx.hideLoading()
            console.error('[TeamGameDetail] 截止报名失败:', err)
            wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' })
        }
    },

    /**
     * 开始比赛
     */
    async startGame() {
        wx.showLoading({ title: '开始中...' })

        try {
            const app = getApp()
            const result = await app.api.teamgame.startGame({
                game_id: this.data.gameid
            })

            wx.hideLoading()

            if (result.code === 200) {
                wx.showToast({ title: result.message || '比赛已开始', icon: 'success' })
                this.refreshGameDetail()
            } else {
                wx.showToast({ title: result.message || '操作失败', icon: 'none' })
            }
        } catch (err) {
            wx.hideLoading()
            console.error('[TeamGameDetail] 开始比赛失败:', err)
            wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' })
        }
    },

    /**
     * 取消比赛
     */
    async cancelTeamGame() {
        wx.showLoading({ title: '取消中...' })

        try {
            const app = getApp()
            const result = await app.api.teamgame.cancelGame({
                game_id: this.data.gameid
            })

            wx.hideLoading()

            if (result.code === 200) {
                wx.showToast({ title: result.message || '比赛已取消', icon: 'success' })
                this.refreshGameDetail()
            } else {
                wx.showToast({ title: result.message || '操作失败', icon: 'none' })
            }
        } catch (err) {
            wx.hideLoading()
            console.error('[TeamGameDetail] 取消比赛失败:', err)
            wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' })
        }
    },

    /**
     * 点击查看更多围观者
     */
    onSpectatorMore() {
        const gameName = encodeURIComponent(this.data.eventDetail?.title || '')
        wx.navigateTo({
            url: `/packageGame/spectators/spectators?game_id=${this.data.gameid}&game_name=${gameName}`
        })
    },

    /**
     * 点击分组卡片（GroupsTab 事件）
     */
    onGroupTap(e) {
        const { groupId } = e.detail
        const group = this.data.groups.find(g => String(g.id) === String(groupId))
        const groupName = encodeURIComponent(group?.name || `第${groupId}组`)

        navigationHelper.navigateTo(
            `/packageGame/group-config/group-config?group_id=${groupId}&group_name=${groupName}`
        )
    },

    /**
     * 删除分组（GroupsTab 事件）
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
     * 添加球员到分组（GroupsTab 事件）
     */
    onAddPlayerToGroup(e) {
        const { groupId } = e.detail
        wx.showToast({ title: `添加球员到分组 ${groupId}`, icon: 'none' })
    },

    /**
     * 分组排序变化（GroupsTab 事件）
     * 注意：如果后端有更新分组顺序的接口，可以在这里调用
     */
    onGroupsReorder(e) {
        const { groups } = e.detail
        console.log('[TeamGameDetail] 分组顺序变化:', groups)

        // TODO: 如果后端有更新分组顺序的接口，可以在这里调用
        // 例如：await gameStore.updateGroupOrder(gameId, groups.map(g => g.id))

        // 暂时只更新前端显示（gameStore 会自动同步）
        // 如果需要持久化，需要添加后端接口支持
        wx.showToast({
            title: '分组顺序已更新',
            icon: 'success',
            duration: 1500
        })
    },

    /**
     * 添加新分组（GroupsTab 事件）
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
