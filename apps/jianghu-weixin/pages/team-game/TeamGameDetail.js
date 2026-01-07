/**
 * 球队比赛详情页
 * game-type: single_team (队内赛) | cross_teams (队际赛)
 */
const app = getApp()

Page({
    data: {
        loading: true,
        gameType: '',           // single_team | cross_teams
        gameId: null,
        gameInfo: null,
        navBarHeight: 88,       // 导航栏高度（状态栏 + 44px）

        // Tab 相关
        currentTab: 0,          // 0:赛事详情 1:报名人员 2:分组 3:讨论区
        tabs: ['赛事详情', '报名人员', '分组', '讨论区'],

        // 赛事详情数据
        eventDetail: {
            title: '',
            teamName: '',
            teamAvatar: '',
            teams: [],
            backgroundImage: '',
            location: '',
            dateTime: '',
            fee: '',
            deadline: '',
            schedule: [],
            awards: [],
            // 封面数据（与 TeamGameItem 一致）
            coverType: 'default',
            covers: []
        },

        // 报名人员数据
        players: [],

        // 分组数据
        groups: [],

        // 围观数据
        spectatorCount: 0,
        spectatorAvatars: [],

        // 用户状态
        isRegistered: false,    // 是否已报名
        isCreator: false,       // 是否是创建者

        // 弹窗状态
        showMoreActions: false
    },

    onLoad(options) {
        const gameType = options['game-type'] || options.gameType || 'single_team'
        const gameId = options.game_id || options.gameId || null

        // 计算导航栏高度
        const systemInfo = wx.getSystemInfoSync()
        const statusBarHeight = systemInfo.statusBarHeight || 0
        const navBarHeight = statusBarHeight + 44

        this.setData({ gameType, gameId, navBarHeight })
        this.loadGameDetail()

        // 加载围观数据 & 记录围观
        if (gameId) {
            this.loadSpectators(gameId)
            this.recordSpectator(gameId)
        }
    },

    onShow() {
        // 页面显示时刷新数据
    },

    /**
     * 加载比赛详情
     */
    async loadGameDetail() {
        this.setData({ loading: true })

        try {
            // 从缓存读取 events 页面传递的数据
            const cachedEvent = wx.getStorageSync('teamGameEventData')

            if (cachedEvent) {
                // 使用缓存数据填充页面
                const teamGameInfo = cachedEvent.extra_team_game_info || {}

                this.setData({
                    loading: false,
                    eventDetail: {
                        // 标题：优先使用 team_game_title
                        title: teamGameInfo.team_game_title || cachedEvent.game_name || '未命名赛事',
                        // 球队信息
                        teamName: teamGameInfo.team_name || '',
                        teamAvatar: teamGameInfo.team_avatar || '',
                        teams: teamGameInfo.teams || [],
                        backgroundImage: '',
                        // 基本信息
                        location: cachedEvent.course || '待定',
                        dateTime: cachedEvent.game_start || '',
                        fee: cachedEvent.fee || '待定',
                        deadline: cachedEvent.deadline || '',
                        // 封面数据（与 TeamGameItem 一致）
                        coverType: cachedEvent.coverType || 'default',
                        covers: cachedEvent.covers || [],
                        // 其他
                        schedule: [],
                        awards: []
                    },
                    isRegistered: false,
                    isCreator: false
                })

                // 清除缓存
                wx.removeStorageSync('teamGameEventData')

                // TODO: 后续可以调用 API 获取更详细的数据（如 schedule, awards, players, groups）
                return
            }

            // 如果没有缓存数据，调用 API 获取
            // TODO: 调用 API 获取比赛详情
            // const result = await app.api.events.getTeamGameDetail({ gameId: this.data.gameId })

            // 模拟数据（作为 fallback）
            setTimeout(() => {
                this.setData({
                    loading: false,
                    eventDetail: {
                        title: '未命名赛事',
                        teamName: '',
                        teamAvatar: '',
                        teams: [],
                        backgroundImage: '',
                        location: '待定',
                        dateTime: '',
                        fee: '待定',
                        deadline: '',
                        coverType: 'default',
                        covers: [],
                        schedule: [],
                        awards: []
                    },
                    players: [],
                    groups: [],
                    isRegistered: false,
                    isCreator: false
                })
            }, 500)
        } catch (error) {
            console.error('加载比赛详情失败:', error)
            this.setData({ loading: false })
            wx.showToast({ title: '加载失败', icon: 'none' })
        }
    },

    /**
     * 加载围观数据
     */
    async loadSpectators(gameId) {
        try {
            const result = await app.api.events.getSpectatorList({ game_id: gameId, page: 1, page_size: 8 })
            if (result && result.code === 200) {
                // 从 list 中提取头像
                const avatars = (result.list || []).map(item => item.avatar)
                this.setData({
                    spectatorCount: result.total || 0,
                    spectatorAvatars: avatars
                })
            }
        } catch (error) {
            console.error('加载围观数据失败:', error)
        }
    },

    /**
     * 记录围观（静默调用，不影响用户体验）
     */
    async recordSpectator(gameId) {
        try {
            await app.api.events.addSpectator({ game_id: gameId })
        } catch (error) {
            // 静默失败，不提示用户
            console.error('记录围观失败:', error)
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
        // 触发微信分享
        // TODO: 实现分享逻辑
        wx.showToast({ title: '分享功能开发中', icon: 'none' })
    },

    /**
     * 点击报名/取消报名按钮
     */
    onRegisterTap() {
        if (this.data.isRegistered) {
            // 取消报名
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
            // 报名
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

        switch (action) {
            case 'registerForFriend':
                wx.showToast({ title: '替好友报名', icon: 'none' })
                break
            case 'closeRegistration':
                wx.showToast({ title: '关闭报名', icon: 'none' })
                break
            case 'managePlayer':
                wx.showToast({ title: '选手管理', icon: 'none' })
                break
            case 'editGame':
                wx.showToast({ title: '修改比赛', icon: 'none' })
                break
            case 'editGroup':
                wx.showToast({ title: '修改分组', icon: 'none' })
                break
            case 'manageFee':
                wx.showToast({ title: '收费管理', icon: 'none' })
                break
            case 'cancelGame':
                wx.showToast({ title: '取消比赛', icon: 'none' })
                break
            case 'startGame':
                wx.showToast({ title: '开始比赛', icon: 'none' })
                break
            case 'manageScore':
                wx.showToast({ title: '记分管理', icon: 'none' })
                break
            default:
                break
        }
    },

    /**
     * 点击查看更多围观者
     */
    onSpectatorMore() {
        const { gameId, eventDetail } = this.data
        const gameName = encodeURIComponent(eventDetail.title || '')
        wx.navigateTo({
            url: `/pages/spectators/spectators?game_id=${gameId}&game_name=${gameName}`
        })
    },

    /**
     * 点击分组卡片
     */
    onGroupTap(e) {
        const { groupId } = e.detail
        wx.showToast({ title: `查看分组 ${groupId}`, icon: 'none' })
    },

    /**
     * 删除分组
     */
    onGroupDelete(e) {
        const { groupId } = e.detail
        wx.showModal({
            title: '确认删除',
            content: `确定要删除分组 G${groupId} 吗？`,
            success: (res) => {
                if (res.confirm) {
                    const groups = this.data.groups.filter(g => g.id !== groupId)
                    this.setData({ groups })
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
    onAddGroup() {
        const newId = this.data.groups.length + 1
        const newGroup = {
            id: newId,
            name: `G${newId}`,
            players: []
        }
        this.setData({
            groups: [...this.data.groups, newGroup]
        })
    }
})
