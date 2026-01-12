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
        actionLoading: false
    },

    onLoad(options) {
        // 计算导航栏高度
        const systemInfo = wx.getSystemInfoSync()
        const statusBarHeight = systemInfo.statusBarHeight || 0
        const navBarHeight = statusBarHeight + 44
        this.setData({ navBarHeight })

        const userId = parseInt(options.userId, 10)
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

            this.setData({
                userInfo: response.data.user,
                relationship: response.data.relationship || this.data.relationship,
                stats: response.data.stats || this.data.stats,
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
    }
})
