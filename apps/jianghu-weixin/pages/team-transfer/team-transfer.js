const app = getApp()

Page({
    data: {
        teamId: '',
        members: [],
        loading: true,
        transferring: false,
        navBarHeight: 88
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

    async loadMembers() {
        this.setData({ loading: true })

        try {
            const res = await app.api.team.getTeamMembers({
                team_id: this.data.teamId
            })

            if (res.code === 200) {
                // 过滤掉超级管理员，只显示可以转让的成员
                const members = (res.members || [])
                    .filter(member => member.role !== 'SuperAdmin')
                    .map(member => ({
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
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        return `${year}/${month}/${day} 加入`
    },

    onSelectMember(e) {
        if (this.data.transferring) return

        const { userId, nickname } = e.currentTarget.dataset
        const displayName = nickname || '该成员'

        wx.showModal({
            title: '确认转让',
            content: `确定要将超级管理员权限转让给"${displayName}"吗？\n\n转让后，您将变为普通成员。`,
            confirmText: '确认转让',
            confirmColor: '#e65100',
            success: async (res) => {
                if (res.confirm) {
                    await this.doTransfer(userId, displayName)
                }
            }
        })
    },

    async doTransfer(userId, displayName) {
        this.setData({ transferring: true })

        try {
            const result = await app.api.team.transferOwner({
                team_id: this.data.teamId,
                new_owner_id: userId
            })

            if (result.code === 200) {
                wx.showToast({
                    title: `已转让给${displayName}`,
                    icon: 'success',
                    duration: 2000
                })
                // 返回球队管理页面，让其刷新
                setTimeout(() => {
                    wx.navigateBack()
                }, 1500)
            } else {
                throw new Error(result.message || '转让失败')
            }
        } catch (error) {
            console.error('转让超管失败', error)
            wx.showToast({ title: error.message || '转让失败', icon: 'none' })
        } finally {
            this.setData({ transferring: false })
        }
    }
})
