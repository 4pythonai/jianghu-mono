/**
 * 球队比赛详情页
 * game-type: single_team (队内赛) | cross_teams (队际赛)
 * 使用 gameStore 管理数据
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/game/gameStore'
import navigationHelper from '../../utils/navigationHelper'

Page({
    data: {
        navBarHeight: 88,       // 导航栏高度（状态栏 + 44px）
        gameType: 'single_team', // 默认值，防止组件报错

        // Tab 相关
        currentTab: 0,          // 0:赛事详情 1:报名人员 2:分组 3:讨论区
        tabs: ['赛事详情', '报名人员', '分组', '讨论区'],

        // 用户状态（本地）
        isRegistered: false,    // 是否已报名

        // 弹窗状态
        showMoreActions: false,
        showRegisterPopup: false,   // 报名弹窗
        selectedTagId: null,        // 选中的分队ID
        registerForm: {             // 报名表单数据
            nickname: '',
            mobile: '',
            gender: 'unknown',
            genderText: '未知'
        },

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
        const { getNavBarHeight } = require('../../utils/systemInfo')
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
                'isCreator'
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
    },

    onShow() {
        // 页面显示时刷新分组数据（从 group-config 返回后更新）
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

            // 检查当前用户是否已报名（直接从 store 读取，避免绑定延迟）
            const app = getApp()
            const currentUserId = app?.globalData?.userInfo?.id
            const tagMembers = gameStore.tagMembers
            const isRegistered = tagMembers.some(m => String(m.id) === String(currentUserId))
            console.log('[TeamGameDetail] 报名检查:', {
                currentUserId,
                tagMembersCount: tagMembers.length,
                tagMemberIds: tagMembers.map(m => m.id),
                isRegistered
            })
            this.setData({ isRegistered })

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
     * 报名 - 打开报名弹窗
     */
    async register() {
        const app = getApp()
        const userInfo = app?.globalData?.userInfo

        if (!userInfo) {
            wx.showToast({ title: '请先登录', icon: 'none' })
            return
        }

        // 获取性别文本
        // userInfo 已通过 normalizeUserInfo 标准化，gender 字段: 'male', 'female', 'unknown'
        const genderMap = { male: '男', female: '女', unknown: '未知' }
        const gender = userInfo.gender || 'unknown'
        const genderText = genderMap[gender] || '未知'

        // 填充表单数据
        // userInfo 已通过 normalizeUserInfo 标准化，nickname 字段必存在
        this.setData({
            showRegisterPopup: true,
            selectedTagId: null,
            registerForm: {
                nickname: userInfo.nickname || '未设置',
                mobile: userInfo.mobile || '',
                gender: gender,
                genderText: genderText
            }
        })
    },

    /**
     * 关闭报名弹窗
     */
    onCloseRegisterPopup() {
        this.setData({
            showRegisterPopup: false,
            selectedTagId: null
        })
    },

    /**
     * 选择分队
     */
    onSelectTag(e) {
        const tagId = e.currentTarget.dataset.tagId
        this.setData({ selectedTagId: tagId })
    },

    /**
     * 选择性别
     */
    onGenderSelect(e) {
        const gender = e.currentTarget.dataset.gender  // 'male' 或 'female'
        this.setData({ 'registerForm.gender': gender })
    },

    /**
     * 昵称输入
     */
    onNicknameInput(e) {
        this.setData({ 'registerForm.nickname': e.detail.value })
    },

    /**
     * 手机号输入
     */
    onMobileInput(e) {
        this.setData({ 'registerForm.mobile': e.detail.value })
    },

    /**
     * 提交报名
     */
    async onSubmitRegister() {
        const { selectedTagId, gameid, registerForm } = this.data

        if (!selectedTagId) {
            wx.showToast({ title: '请选择分队', icon: 'none' })
            return
        }

        wx.showLoading({ title: '报名中...' })

        try {
            const app = getApp()
            // gender 已经是字符串: 'male', 'female', 'unknown'
            const result = await app.api.teamgame.registerGame({
                game_id: gameid,
                tag_id: selectedTagId,
                nickname: registerForm.nickname,
                gender: registerForm.gender,
                mobile: registerForm.mobile
            })

            wx.hideLoading()

            if (result.code === 200) {
                wx.showToast({ title: '报名成功', icon: 'success' })
                this.setData({
                    showRegisterPopup: false,
                    selectedTagId: null,
                    isRegistered: true
                })
                // 刷新报名人员列表
                this.loadTagMembers(gameid)
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
     * 取消报名
     */
    async cancelRegistration() {
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
                this.loadTagMembers(this.data.gameid)
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
            url: `/packageGame/spectators/spectators?game_id=${this.data.gameid}&game_name=${gameName}`
        })
    },

    /**
     * 点击分组卡片
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
