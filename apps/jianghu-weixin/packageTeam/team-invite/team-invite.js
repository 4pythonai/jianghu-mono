const app = getApp()

Page({
  data: {
    teamId: '',
    keyword: '',
    users: [],
    searching: false,
    hasSearched: false,
    navBarHeight: 88
  },

  onLoad(options) {
    const { getNavBarHeight } = require('@/utils/systemInfo')
    const navBarHeight = getNavBarHeight()

    const teamId = options.teamId || options.id
    if (!teamId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({ teamId, navBarHeight })
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  async onSearch() {
    const keyword = this.data.keyword.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      return
    }

    this.setData({ searching: true, hasSearched: true })

    try {
      const res = await app.api.team.searchUsersToInvite({
        team_id: this.data.teamId,
        keyword: keyword
      })

      if (res.code === 200) {
        const users = (res.users || []).map(user => ({
          ...user,
          inviting: false
        }))
        this.setData({ users, searching: false })
      } else {
        throw new Error(res.message || '搜索失败')
      }
    } catch (error) {
      console.error('搜索用户失败', error)
      wx.showToast({ title: error.message || '搜索失败', icon: 'none' })
      this.setData({ searching: false, users: [] })
    }
  },

  async onInvite(e) {
    const { userId, shownName, index } = e.currentTarget.dataset
    const displayName = shownName || '该用户'

    // 设置邀请中状态
    const users = this.data.users
    users[index].inviting = true
    this.setData({ users })

    try {
      const result = await app.api.team.inviteMember({
        team_id: this.data.teamId,
        user_id: userId
      })

      if (result.code === 200) {
        wx.showToast({ title: '已邀请', icon: 'success' })
        // 从列表中移除已邀请的用户
        users.splice(index, 1)
        this.setData({ users })
      } else {
        throw new Error(result.message || '邀请失败')
      }
    } catch (error) {
      wx.showToast({ title: error.message || '邀请失败', icon: 'none' })
      // 恢复按钮状态
      users[index].inviting = false
      this.setData({ users })
    }
  }
})
