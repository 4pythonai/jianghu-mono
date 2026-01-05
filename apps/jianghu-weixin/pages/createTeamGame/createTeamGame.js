/**
 * 创建队内赛入口页面
 * 用户进入后显示其所属球队列表供选择
 */
const app = getApp()

Page({
    data: {
        loading: true,
        myTeams: [],       // 用户所属的球队列表
        selectedTeam: null // 已选择的球队
    },

    async onLoad(options) {
        // 如果从球队页面进入，可能携带 team_id
        const teamId = options.team_id ? parseInt(options.team_id) : null

        await this.loadMyTeams()

        // 如果指定了球队，直接进入表单
        if (teamId && this.data.myTeams.length > 0) {
            const team = this.data.myTeams.find(t => t.id === teamId)
            if (team) {
                this.goToForm(team)
                return
            }
        }

        // 如果只有一个球队，直接进入表单
        if (this.data.myTeams.length === 1) {
            this.goToForm(this.data.myTeams[0])
        }
    },

    /**
     * 加载用户所属的球队列表
     */
    async loadMyTeams() {
        this.setData({ loading: true })

        try {
            // TODO: 调用获取用户球队列表的 API
            // const result = await app.api.team.getMyTeams()
            
            // 临时模拟数据，等待后端 API 实现
            const mockTeams = [
                { id: 1, team_name: '翠湖高尔夫俱乐部', team_avatar: '/images/default-team.png', role: 'admin' },
                { id: 2, team_name: '阳光高尔夫队', team_avatar: '/images/default-team.png', role: 'member' }
            ]

            this.setData({
                myTeams: mockTeams,
                loading: false
            })
        } catch (error) {
            console.error('加载球队列表失败:', error)
            this.setData({ loading: false })
            wx.showToast({
                title: '加载失败，请重试',
                icon: 'none'
            })
        }
    },

    /**
     * 选择球队
     */
    onTeamSelect(e) {
        const teamId = e.currentTarget.dataset.teamId
        const team = this.data.myTeams.find(t => t.id === teamId)
        
        if (team) {
            this.goToForm(team)
        }
    },

    /**
     * 跳转到队内赛表单页
     */
    goToForm(team) {
        // 缓存选中的球队信息
        wx.setStorageSync('selectedTeamForCreate', team)
        
        wx.navigateTo({
            url: `/pages/createTeamGame/teamGameForm/teamGameForm?team_id=${team.id}&team_name=${encodeURIComponent(team.team_name)}`
        })
    },

    /**
     * 返回上一页
     */
    handleBack() {
        wx.navigateBack({ delta: 1 })
    }
})

