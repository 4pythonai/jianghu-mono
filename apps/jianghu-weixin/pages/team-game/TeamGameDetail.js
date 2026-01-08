/**
 * 球队比赛详情页
 * game-type: single_team (队内赛) | cross_teams (队际赛)
 */
const app = getApp()
import { config } from '../../api/config'

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
        groupingPermission: 'admin', // 分组权限：admin/user

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

        this.setData({ gameType, gameId, navBarHeight }, () => {
            // setData 完成后再加载数据
            this.loadGameDetail()
            this.loadTagMembers()
            this.loadGroups()

            // 加载围观数据 & 记录围观
            if (gameId) {
                this.loadSpectators(gameId)
                this.recordSpectator(gameId)
            }
        })
    },

    onShow() {
        // 页面显示时刷新数据
    },

    /**
     * 加载比赛详情
     */
    async loadGameDetail() {
        const { gameId, gameType } = this.data

        // 先尝试用缓存数据快速显示
        const cachedEvent = wx.getStorageSync('teamGameEventData')
        if (cachedEvent) {
            this.applyCachedData(cachedEvent)
            wx.removeStorageSync('teamGameEventData')
        }

        // 调用 API 获取完整数据
        if (!gameId) {
            this.setData({ loading: false })
            return
        }

        try {
            // 根据比赛类型调用不同的 API
            const apiMethod = gameType === 'cross_teams'
                ? app.api.teamgame.getCrossTeamGameDetail
                : app.api.teamgame.getTeamGameDetail

            const result = await apiMethod({ game_id: gameId })

            if (result && result.code === 200 && result.data) {
                this.applyApiData(result.data)
            }
        } catch (error) {
            console.error('加载比赛详情失败:', error)
            // 如果有缓存数据已显示，不提示错误
            if (!cachedEvent) {
                wx.showToast({ title: '加载失败', icon: 'none' })
            }
        } finally {
            this.setData({ loading: false })
        }
    },

    /**
     * 应用缓存数据（快速显示）
     */
    applyCachedData(cachedEvent) {
        const teamGameInfo = cachedEvent.extra_team_game_info || {}

        this.setData({
            eventDetail: {
                ...this.data.eventDetail,
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
        })
    },

    /**
     * 应用 API 返回的完整数据
     */
    applyApiData(data) {
        const currentUserId = app.globalData?.userInfo?.userid

        // 解析 awards：支持字符串或数组
        let awards = []
        if (data.awards) {
            if (Array.isArray(data.awards)) {
                awards = data.awards
            } else if (typeof data.awards === 'string') {
                // 尝试按换行或逗号分割
                awards = data.awards.split(/[,，\n]/).map(s => s.trim()).filter(Boolean)
            }
        }

        // 解析 schedule：JSON字符串转数组
        let schedule = []
        if (data.schedule) {
            try {
                schedule = typeof data.schedule === 'string' ? JSON.parse(data.schedule) : data.schedule
            } catch (e) {
                console.error('解析赛事流程失败:', e)
                schedule = []
            }
        }

        // 格式化报名截止时间
        let deadline = this.data.eventDetail.deadline
        if (data.registration_deadline) {
            deadline = this.formatDeadline(data.registration_deadline)
        }

        const isCreator = currentUserId && data.creatorid == currentUserId
        const groupingPermission = data.grouping_permission || 'admin'
        console.log('[applyApiData] currentUserId:', currentUserId, 'creatorid:', data.creatorid, 'isCreator:', isCreator)
        console.log('[applyApiData] groupingPermission:', groupingPermission)

        this.setData({
            eventDetail: {
                ...this.data.eventDetail,
                title: data.team_game_title || data.name || this.data.eventDetail.title,
                teamName: data.team_name || this.data.eventDetail.teamName,
                teamAvatar: data.team_avatar || this.data.eventDetail.teamAvatar,
                location: data.course_name || this.data.eventDetail.location,
                dateTime: data.open_time || this.data.eventDetail.dateTime,
                fee: data.entry_fee ? `${data.entry_fee}元` : this.data.eventDetail.fee,
                deadline: deadline,
                schedule: schedule,
                remark: data.remark || '',
                awards: awards
            },
            isCreator,
            groupingPermission
        })
    },

    /**
     * 格式化报名截止时间
     */
    formatDeadline(dateStr) {
        if (!dateStr) return '暂无'
        try {
            const date = new Date(dateStr)
            const month = date.getMonth() + 1
            const day = date.getDate()
            const hours = date.getHours().toString().padStart(2, '0')
            const minutes = date.getMinutes().toString().padStart(2, '0')
            return `报名截止: ${month}月${day}日 ${hours}:${minutes}`
        } catch (e) {
            return dateStr
        }
    },

    /**
     * 解析分组数据
     */
    parseGroups(groups) {
        if (!Array.isArray(groups)) return []

        return groups.map((g, index) => {
            // API 返回的是 groupid，确保正确获取，并转为字符串
            const groupId = g.groupid || g.group_id || g.id || (index + 1)
            return {
                id: String(groupId),
                name: g.group_name || `第${index + 1}组`,
                players: (g.members || g.players || []).map(p => ({
                    id: p.userid || p.user_id,
                    name: p.nickname || p.user_name || '球友',
                    avatar: p.avatar || '',
                    teamName: p.tag_name || '',
                    tee: p.tee || ''
                }))
            }
        })
    },

    /**
     * 加载分组列表
     */
    async loadGroups() {
        const { gameId } = this.data
        if (!gameId) return

        try {
            const result = await app.api.teamgame.getGroups({ game_id: gameId })
            console.log('[loadGroups] API 返回:', result)

            if (result && result.code === 200 && result.data) {
                const groups = this.parseGroups(result.data)
                console.log('[loadGroups] 解析后的分组:', groups)
                this.setData({ groups })
            }
        } catch (error) {
            console.error('加载分组失败:', error)
        }
    },

    /**
     * 加载报名人员列表
     */
    async loadTagMembers() {
        const { gameId } = this.data
        if (!gameId) return

        try {
            const result = await app.api.teamgame.getTagMembers({ game_id: gameId })
            if (result && result.code === 200 && result.data) {
                const staticURL = config.staticURL
                const players = result.data.map(m => {
                    // 处理头像路径：相对路径拼接完整 URL
                    let avatar = m.avatar || ''
                    if (avatar && avatar.startsWith('/')) {
                        avatar = staticURL + avatar
                    }
                    return {
                        id: m.user_id,
                        seq: m.seq,
                        name: m.nickname || '球友',
                        avatar: avatar,
                        handicap: m.handicap,
                        tagName: m.tag_name || '',
                        tagColor: m.color || ''
                    }
                })
                this.setData({ players })
            }
        } catch (error) {
            console.error('加载报名人员失败:', error)
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
            content: `确定要删除该分组吗？`,
            success: async (res) => {
                if (res.confirm) {
                    try {
                        wx.showLoading({ title: '删除中...' })
                        const result = await app.api.teamgame.deleteGroup({
                            game_id: this.data.gameId,
                            group_id: groupId
                        })
                        wx.hideLoading()

                        if (result?.code === 200) {
                            wx.showToast({ title: '删除成功', icon: 'success' })
                            // 重新加载分组列表
                            this.loadGroups()
                        } else {
                            wx.showToast({ title: result?.message || '删除失败', icon: 'none' })
                        }
                    } catch (error) {
                        wx.hideLoading()
                        console.error('删除分组失败:', error)
                        wx.showToast({ title: '删除失败', icon: 'none' })
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
        try {
            wx.showLoading({ title: '创建中...' })
            const result = await app.api.teamgame.createGroup({
                game_id: this.data.gameId
            })
            wx.hideLoading()

            if (result?.code === 200) {
                wx.showToast({ title: '创建成功', icon: 'success' })
                // 重新加载分组列表
                this.loadGroups()
            } else {
                wx.showToast({ title: result?.message || '创建失败', icon: 'none' })
            }
        } catch (error) {
            wx.hideLoading()
            console.error('创建分组失败:', error)
            wx.showToast({ title: '创建失败', icon: 'none' })
        }
    }
})
