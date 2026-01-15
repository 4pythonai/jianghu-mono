const app = getApp()

Page({
  data: {
    teamId: '',
    mode: 'view', // 'view' 或 'manage'
    members: [],
    loading: true,
    navBarHeight: 88
  },

  onLoad(options) {
    const { getNavBarHeight } = require('../../utils/systemInfo')
    const navBarHeight = getNavBarHeight()

    const teamId = options.teamId || options.id
    const mode = options.mode || 'view'

    if (!teamId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({ teamId, mode, navBarHeight })
    this.loadMembers()
  },

  onShow() {
    if (this.data.teamId) {
      this.loadMembers()
    }
  },

  async loadMembers() {
    this.setData({ loading: true })

    try {
      const res = await app.api.team.getTeamMembers({
        team_id: this.data.teamId
      })

      if (res.code === 200) {
        const members = (res.members || []).map(member => ({
          ...member,
          join_time_display: this.formatJoinTime(member.join_time)
        }))
        this.setData({ members, loading: false })
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (error) {
      console.error('加载成员列表失败', error)
      wx.showToast({ title: error.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  formatJoinTime(dateStr) {
    if (!dateStr) return ''
    const { parseDate } = require('../../utils/tool')
    const date = parseDate(dateStr)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}/${month}/${day} 加入`
  },

  onRemoveMember(e) {
    const { userId, shownName } = e.currentTarget.dataset
    const displayName = shownName || '该成员'

    wx.showModal({
      title: '确认移除',
      content: `确定要将"${displayName}"移出球队吗？`,
      confirmColor: '#f44336',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.api.team.removeMember({
              team_id: this.data.teamId,
              user_id: userId
            })

            if (result.code === 200) {
              wx.showToast({ title: '已移除', icon: 'success' })
              this.loadMembers()
            } else {
              throw new Error(result.message || '移除失败')
            }
          } catch (error) {
            wx.showToast({ title: error.message || '移除失败', icon: 'none' })
          }
        }
      }
    })
  }
})
