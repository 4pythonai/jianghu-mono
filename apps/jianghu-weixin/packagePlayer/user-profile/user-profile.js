/**
 * 用户主页
 * 显示其他用户的公开资料
 */
const app = getApp()

Page({
    data: {
        userId: null,
        userInfo: null,
        loading: true,
        error: null,
        // 是否是自己的主页
        isSelf: false,
        // 导航栏高度
        navBarHeight: 88,
        // 关系信息
        relationship: {
            is_self: false,
            is_following: false,
            is_blocked: false,
            is_blocked_by: false
        },
        // 统计数据
        stats: {
            gamesCount: 0,
            teamsCount: 0,
            followers_count: 0
        },
        // 操作中状态
        actionLoading: false,
        // 修改备注名弹窗
        showRemarkModal: false,
        remarkInput: '',
        // 当前显示的备注名
        currentRemark: null
    },

    onLoad(options) {
        // 计算导航栏高度
        const systemInfo = wx.getSystemInfoSync()
        const statusBarHeight = systemInfo.statusBarHeight || 0
        const navBarHeight = statusBarHeight + 44
        this.setData({ navBarHeight })
        console.log(options)

        const userId = parseInt(options.user_id, 10)
        if (!userId) {
            this.setData({
                loading: false,
                error: '用户ID无效'
            })
            return
        }

        const currentUserId = app.globalData.userInfo?.id
        this.setData({
            userId,
            isSelf: currentUserId === userId
        })

        this.loadUserProfile(userId)
    },

    // 加载用户资料
    async loadUserProfile(userId) {
        try {
            this.setData({ loading: true, error: null })

            const response = await app.api.user.getUserProfile({ user_id: userId })

            if (response.code !== 200) {
                throw new Error(response.message || '获取用户信息失败')
            }

            // 获取备注名（如果有）
            const remarkName = response.data.user.remark_name || null

            this.setData({
                userInfo: response.data.user,
                relationship: response.data.relationship || this.data.relationship,
                stats: response.data.stats || this.data.stats,
                currentRemark: remarkName,
                loading: false
            })
        } catch (err) {
            console.error('获取用户资料失败:', err)
            this.setData({
                loading: false,
                error: err.message || '获取用户信息失败'
            })
        }
    },

    // 下拉刷新
    onPullDownRefresh() {
        if (this.data.userId) {
            this.loadUserProfile(this.data.userId).finally(() => {
                wx.stopPullDownRefresh()
            })
        } else {
            wx.stopPullDownRefresh()
        }
    },

    // 返回上一页
    goBack() {
        wx.navigateBack()
    },

    // 关注/取消关注
    async toggleFollow() {
        if (this.data.actionLoading) return

        const { userId, relationship, stats } = this.data
        const isFollowing = relationship.is_following

        try {
            this.setData({ actionLoading: true })

            let response
            if (isFollowing) {
                response = await app.api.user.unfollowUser({ user_id: userId })
            } else {
                response = await app.api.user.followUser({ user_id: userId })
            }

            if (response.code !== 200) {
                throw new Error(response.message)
            }

            // 更新本地状态
            const newFollowersCount = isFollowing
                ? Math.max(0, stats.followers_count - 1)
                : stats.followers_count + 1

            this.setData({
                'relationship.is_following': !isFollowing,
                'stats.followers_count': newFollowersCount
            })

            wx.showToast({
                title: isFollowing ? '已取消关注' : '关注成功',
                icon: 'success'
            })
        } catch (err) {
            wx.showToast({
                title: err.message || '操作失败',
                icon: 'none'
            })
        } finally {
            this.setData({ actionLoading: false })
        }
    },

    // 查看共同参与的球局
    viewCommonGames() {
        wx.showToast({
            title: '功能开发中',
            icon: 'none'
        })
    },

    // 拉黑/取消拉黑
    async toggleBlock() {
        if (this.data.actionLoading) return

        const { userId, relationship } = this.data
        const isBlocked = relationship.is_blocked

        // 确认操作
        const actionText = isBlocked ? '取消拉黑' : '拉黑'
        const confirmResult = await new Promise((resolve) => {
            wx.showModal({
                title: '确认操作',
                content: `确定要${actionText}该用户吗？`,
                success: (res) => resolve(res.confirm),
                fail: () => resolve(false)
            })
        })

        if (!confirmResult) return

        try {
            this.setData({ actionLoading: true })

            const response = await app.api.user.blockUser({
                blocked_userid: userId
            })

            if (response.code !== 200) {
                throw new Error(response.message || '操作失败')
            }

            // 更新本地状态
            this.setData({
                'relationship.is_blocked': !isBlocked
            })

            wx.showToast({
                title: isBlocked ? '已取消拉黑' : '已拉黑',
                icon: 'success'
            })

            // 如果拉黑成功，刷新页面数据
            if (!isBlocked) {
                setTimeout(() => {
                    this.loadUserProfile(userId)
                }, 1000)
            }
        } catch (err) {
            wx.showToast({
                title: err.message || '操作失败',
                icon: 'none'
            })
        } finally {
            this.setData({ actionLoading: false })
        }
    },

    // 显示修改备注名弹窗
    openRemarkModal() {
        const currentRemark = this.data.currentRemark || ''
        this.setData({
            showRemarkModal: true,
            remarkInput: currentRemark
        })
    },

    // 关闭修改备注名弹窗
    closeRemarkModal() {
        this.setData({
            showRemarkModal: false,
            remarkInput: ''
        })
    },

    // 阻止弹窗内容点击事件冒泡
    preventClose() {
        // 空函数，用于阻止事件冒泡
    },

    // 备注名输入
    onRemarkInput(e) {
        this.setData({
            remarkInput: e.detail.value
        })
    },

    // 确认修改备注名
    async confirmRemark() {
        if (this.data.actionLoading) return

        const { userId } = this.data
        const remarkName = this.data.remarkInput.trim()

        // 验证长度（假设最大20字符，与display_name一致）
        if (remarkName.length > 20) {
            wx.showToast({
                title: '备注名不能超过20个字符',
                icon: 'none'
            })
            return
        }

        try {
            this.setData({ actionLoading: true })

            const response = await app.api.user.updateRemark({
                target_user_id: userId,
                remark_name: remarkName || null // 空字符串时传null表示删除备注
            })

            if (response.code !== 200) {
                throw new Error(response.message || '修改失败')
            }

            // 更新本地状态
            this.setData({
                currentRemark: remarkName || null
            })

            // 重新加载用户资料以获取正确的 show_name
            await this.loadUserProfile(userId)

            wx.showToast({
                title: remarkName ? '备注名已更新' : '备注名已删除',
                icon: 'success'
            })

            this.closeRemarkModal()
        } catch (err) {
            wx.showToast({
                title: err.message || '修改失败',
                icon: 'none'
            })
        } finally {
            this.setData({ actionLoading: false })
        }
    }
})
