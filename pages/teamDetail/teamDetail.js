// teamDetail.js
const app = getApp()
const { api } = app.globalData

Page({
    data: {
        teamId: '',
        teamInfo: null,
        members: [],
        games: [],
        loading: false,
        isAdmin: false,
        isMember: false
    },

    onLoad(options) {
        if (options.id) {
            this.setData({ teamId: options.id })
            this.loadTeamDetail()
        } else {
            wx.showToast({
                title: '参数错误',
                icon: 'error'
            })
            setTimeout(() => {
                wx.navigateBack()
            }, 1500)
        }
    },

    onPullDownRefresh() {
        this.loadTeamDetail().then(() => {
            wx.stopPullDownRefresh()
        })
    },

    // 加载团队详情
    async loadTeamDetail() {
        if (this.data.loading) return

        this.setData({ loading: true })
        wx.showLoading({ title: '加载中...' })

        try {
            const [teamInfo, members, games] = await Promise.all([
                api.team.detail(this.data.teamId),
                api.team.getMembers(this.data.teamId),
                api.team.getGames(this.data.teamId)
            ])

            // 检查当前用户是否为管理员
            const userInfo = app.globalData.userInfo
            const isAdmin = userInfo && teamInfo.adminId === userInfo.id
            const isMember = members.some(member => member.id === userInfo?.id)

            this.setData({
                teamInfo,
                members,
                games,
                isAdmin,
                isMember
            })
        } catch (error) {
            console.error('加载团队详情失败：', error)
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            })
        } finally {
            wx.hideLoading()
            this.setData({ loading: false })
        }
    },

    // 加入团队
    async joinTeam() {
        if (!app.globalData.userInfo) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            })
            return
        }

        wx.showLoading({ title: '处理中...' })

        try {
            await api.team.join(this.data.teamId)
            wx.showToast({
                title: '加入成功',
                icon: 'success'
            })
            // 重新加载团队信息
            this.loadTeamDetail()
        } catch (error) {
            console.error('加入团队失败：', error)
            wx.showToast({
                title: '加入失败',
                icon: 'none'
            })
        } finally {
            wx.hideLoading()
        }
    },

    // 退出团队
    leaveTeam() {
        wx.showModal({
            title: '确认退出',
            content: '确定要退出该团队吗？',
            success: async (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: '处理中...' })
                    try {
                        await api.team.leave(this.data.teamId)
                        wx.showToast({
                            title: '已退出团队',
                            icon: 'success'
                        })
                        // 返回上一页
                        setTimeout(() => {
                            wx.navigateBack()
                        }, 1500)
                    } catch (error) {
                        console.error('退出团队失败：', error)
                        wx.showToast({
                            title: '退出失败',
                            icon: 'none'
                        })
                    } finally {
                        wx.hideLoading()
                    }
                }
            }
        })
    },

    // 编辑团队信息
    editTeam() {
        if (!this.data.isAdmin) {
            wx.showToast({
                title: '无权限',
                icon: 'none'
            })
            return
        }

        wx.navigateTo({
            url: `/pages/editTeam/editTeam?id=${this.data.teamId}`
        })
    },

    // 查看成员详情
    viewMemberDetail(e) {
        const memberId = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/userDetail/userDetail?id=${memberId}`
        })
    },

    // 查看比赛详情
    viewGameDetail(e) {
        const gameId = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/gameDetail/gameDetail?id=${gameId}`
        })
    },

    // 创建新比赛
    createGame() {
        if (!this.data.isAdmin) {
            wx.showToast({
                title: '仅管理员可创建比赛',
                icon: 'none'
            })
            return
        }

        wx.navigateTo({
            url: `/pages/createGame/createGame?teamId=${this.data.teamId}`
        })
    },

    // 分享
    onShareAppMessage() {
        const { teamInfo } = this.data
        return {
            title: `邀请你加入${teamInfo?.name || ''}球队`,
            path: `/pages/teamDetail/teamDetail?id=${this.data.teamId}`
        }
    }
})