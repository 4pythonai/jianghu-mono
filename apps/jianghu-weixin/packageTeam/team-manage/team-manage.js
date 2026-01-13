import { config } from '../../api/config'

const app = getApp()

// 权限常量定义
const ALL_PERMISSIONS = {
  approve_join: true,    // 审批入队
  invite_member: true,   // 拉入队员
  remove_member: true,   // 踢出队员
  mark_paid: true,       // 标注付费
  create_game: true      // 创建队内赛
}

Page({
  data: {
    teamId: '',
    teamInfo: {},
    myRole: '',           // 
    myPermissions: null,  // 原始权限数据
    permissions: {},      // 计算后的权限（用于UI判断）
    pendingCount: 0,      // 待审批人数
    loading: true,
    navBarHeight: 88      // 导航栏高度（状态栏 + 导航栏）
  },

  onLoad(options) {
    // 计算导航栏高度
    const { getNavBarHeight } = require('../../utils/systemInfo')
    const navBarHeight = getNavBarHeight()

    const teamId = options.id || options.teamId
    if (!teamId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ teamId, navBarHeight })
    this.loadTeamManageInfo()
  },

  onShow() {
    if (this.data.teamId) {
      this.loadTeamManageInfo()
    }
  },

  async loadTeamManageInfo() {
    this.setData({ loading: true })

    try {
      const res = await app.api.team.getTeamManageInfo({
        team_id: this.data.teamId
      })

      if (res.code === 200) {
        const { team, my_role, my_permissions, pending_count } = res

        // 计算实际权限
        const permissions = this.calculatePermissions(my_role, my_permissions)

        this.setData({
          teamInfo: team || {},
          myRole: my_role || 'member',
          myPermissions: my_permissions,
          permissions,
          pendingCount: pending_count || 0,
          loading: false
        })
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (error) {
      console.error('加载球队管理信息失败', error)
      wx.showToast({ title: error.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 计算权限：超管拥有全部权限，普通管理员按配置，成员无权限
  calculatePermissions(role, permissionsData) {
    if (role === 'SuperAdmin') {
      return { ...ALL_PERMISSIONS }
    }

    if (role === 'admin' && permissionsData) {
      return {
        approve_join: !!permissionsData.approve_join,
        invite_member: !!permissionsData.invite_member,
        remove_member: !!permissionsData.remove_member,
        mark_paid: !!permissionsData.mark_paid,
        create_game: !!permissionsData.create_game
      }
    }

    // 普通成员无管理权限
    return {
      approve_join: false,
      invite_member: false,
      remove_member: false,
      mark_paid: false,
      create_game: false
    }
  },

  // 审批入队
  goApproveJoin() {
    wx.navigateTo({
      url: `/packageTeam/team-approve/team-approve?teamId=${this.data.teamId}`
    })
  },

  // 邀请队员
  goInviteMember() {
    wx.navigateTo({
      url: `/packageTeam/team-invite/team-invite?teamId=${this.data.teamId}`
    })
  },

  // 队员管理
  goMemberManage() {
    wx.navigateTo({
      url: `/packageTeam/team-members/team-members?teamId=${this.data.teamId}&mode=manage`
    })
  },

  // 创建队内赛
  goCreateGame() {
    wx.navigateTo({
      url: `/packageTeam/createTeamGame/createTeamGame?teamId=${this.data.teamId}`
    })
  },

  // 管理员设置
  goAdminManage() {
    wx.navigateTo({
      url: `/packageTeam/team-admin/team-admin?teamId=${this.data.teamId}`
    })
  },

  // 转让超管
  goTransferOwner() {
    wx.navigateTo({
      url: `/packageTeam/team-transfer/team-transfer?teamId=${this.data.teamId}`
    })
  },

  // 编辑球队信息（复用 create-team 页面）
  goEditTeam() {
    wx.navigateTo({
      url: `/packageTeam/create-team/create-team?teamId=${this.data.teamId}`
    })
  },

  // 查看队员列表
  goMemberList() {
    wx.navigateTo({
      url: `/packageTeam/team-members/team-members?teamId=${this.data.teamId}&mode=view`
    })
  },

  // 退出球队
  onQuitTeam() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出该球队吗？',
      confirmColor: '#f44336',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.api.team.quitTeam({
              team_id: this.data.teamId
            })
            if (result.code === 200) {
              wx.showToast({ title: '已退出球队', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            } else {
              throw new Error(result.message || '退出失败')
            }
          } catch (error) {
            wx.showToast({ title: error.message || '退出失败', icon: 'none' })
          }
        }
      }
    })
  }
})
