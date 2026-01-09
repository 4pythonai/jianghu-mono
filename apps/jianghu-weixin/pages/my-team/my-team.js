import { config } from '../../api/config'

const app = getApp()

Page({
  data: {
    searchKeyword: '',
    joinedTeams: [],
    activityTeams: [],
    loading: true
  },

  onLoad() {
    this.loadMyTeams()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadMyTeams()
  },

  // 加载我的球队列表
  async loadMyTeams() {
    this.setData({ loading: true })

    try {
      const res = await app.api.team.getMyTeams({
        user_id: app.globalData.userInfo?.id
      })

      if (res.code === 200) {
        // 后端返回 teams 数组，映射字段名
        const teams = res.teams || []
        const joinedTeams = teams.map(team => ({
          id: team.id,
          name: team.team_name,
          logo: team.team_avatar ? config.staticURL + team.team_avatar : '',
          slogan: team.sologan,
          description: team.description,
          created_at: this.formatDate(team.create_date),
          super_admin_name: team.super_admin_name || '',
          admin_names: team.admin_names || '',
          member_count: team.member_count,
          role: team.role
        }))

        this.setData({ joinedTeams, activityTeams: [] })
      }
    } catch (error) {
      console.error('加载球队列表失败', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '--'
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })

    // 可以添加搜索防抖逻辑
    if (this.searchTimer) clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.searchTeams(keyword)
    }, 500)
  },

  // 搜索球队
  async searchTeams(keyword) {
    if (!keyword.trim()) {
      this.loadMyTeams()
      return
    }

    try {
      const res = await app.api.team.searchTeams({ keyword })
      if (res.code === 200) {
        // 注意：后端返回 res.teams，不是 res.data.teams
        const teams = (res.teams || []).map(team => ({
          id: team.id,
          name: team.team_name,
          logo: team.team_avatar ? config.staticURL + team.team_avatar : '',
          slogan: team.sologan,
          description: team.description,
          created_at: this.formatDate(team.create_date),
          super_admin_name: team.super_admin_name || '',
          admin_names: team.admin_names || '',
          member_count: team.member_count,
          is_member: team.is_member
        }))
        this.setData({
          joinedTeams: teams.filter(t => t.is_member),
          activityTeams: teams.filter(t => !t.is_member)
        })
      }
    } catch (error) {
      console.error('搜索球队失败', error)
    }
  },

  // 跳转到球队管理
  goToTeamDetail(e) {
    const team = e.currentTarget.dataset.team
    wx.navigateTo({
      url: `/pages/team-manage/team-manage?id=${team.id}`
    })
  },

  // 跳转到创建球队
  goToCreateTeam() {
    wx.navigateTo({
      url: '/pages/create-team/create-team'
    })
  }
})

