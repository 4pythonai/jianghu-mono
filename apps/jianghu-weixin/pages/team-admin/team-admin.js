const app = getApp()

// 权限选项配置
const PERMISSION_OPTIONS = [
  { key: 'approve_join', label: '审批入队' },
  { key: 'invite_member', label: '拉入队员' },
  { key: 'remove_member', label: '踢出队员' },
  { key: 'mark_paid', label: '标注付费' },
  { key: 'create_game', label: '创建队内赛' }
]

Page({
  data: {
    teamId: '',
    members: [],
    admins: [],
    normalMembers: [],
    loading: true,
    navBarHeight: 88,
    // 权限弹窗
    showPermissionModal: false,
    editingMember: null,
    editingPermissions: {},
    permissionOptions: PERMISSION_OPTIONS
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const navBarHeight = statusBarHeight + 44

    const teamId = options.teamId || options.id
    if (!teamId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({ teamId, navBarHeight })
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
        const members = res.members || []
        const admins = members.filter(m => m.role === 'SuperAdmin' || m.role === 'admin')
        const normalMembers = members.filter(m => m.role === 'member')

        this.setData({
          members,
          admins,
          normalMembers,
          loading: false
        })
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (error) {
      console.error('加载成员列表失败', error)
      wx.showToast({ title: error.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 设为管理员
  onSetAdmin(e) {
    const { userId, nickname } = e.currentTarget.dataset
    const displayName = nickname || '该成员'

    wx.showModal({
      title: '设置管理员',
      content: `确定将"${displayName}"设为管理员吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.api.team.setMemberRole({
              team_id: this.data.teamId,
              user_id: userId,
              role: 'admin'
            })

            if (result.code === 200) {
              wx.showToast({ title: '设置成功', icon: 'success' })
              this.loadMembers()
            } else {
              throw new Error(result.message || '设置失败')
            }
          } catch (error) {
            wx.showToast({ title: error.message || '设置失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 取消管理员
  onRemoveAdmin(e) {
    const { userId, nickname } = e.currentTarget.dataset
    const displayName = nickname || '该成员'

    wx.showModal({
      title: '取消管理员',
      content: `确定取消"${displayName}"的管理员身份吗？`,
      confirmColor: '#f44336',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.api.team.setMemberRole({
              team_id: this.data.teamId,
              user_id: userId,
              role: 'member'
            })

            if (result.code === 200) {
              wx.showToast({ title: '已取消', icon: 'success' })
              this.loadMembers()
            } else {
              throw new Error(result.message || '操作失败')
            }
          } catch (error) {
            wx.showToast({ title: error.message || '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 编辑权限
  onEditPermissions(e) {
    const member = e.currentTarget.dataset.member
    // 解析已有权限
    let permissions = {}
    if (member.permissions) {
      try {
        permissions = typeof member.permissions === 'string' 
          ? JSON.parse(member.permissions) 
          : member.permissions
      } catch (e) {
        permissions = {}
      }
    }

    this.setData({
      showPermissionModal: true,
      editingMember: member,
      editingPermissions: { ...permissions }
    })
  },

  // 权限开关变化
  onPermissionChange(e) {
    const key = e.currentTarget.dataset.key
    const value = e.detail.value
    const permissions = this.data.editingPermissions
    permissions[key] = value
    this.setData({ editingPermissions: permissions })
  },

  // 关闭弹窗
  closePermissionModal() {
    this.setData({
      showPermissionModal: false,
      editingMember: null,
      editingPermissions: {}
    })
  },

  // 保存权限
  async savePermissions() {
    const { editingMember, editingPermissions } = this.data

    try {
      const result = await app.api.team.setAdminPermissions({
        team_id: this.data.teamId,
        user_id: editingMember.user_id,
        permissions: editingPermissions
      })

      if (result.code === 200) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.closePermissionModal()
        this.loadMembers()
      } else {
        throw new Error(result.message || '保存失败')
      }
    } catch (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  }
})
