import api from '@/api/index'

Page({
    data: {
        users: [],
        loading: false
    },

    onLoad() {
        this.loadData()
    },

    async loadData() {
        if (this.data.loading) return
        this.setData({ loading: true })

        try {
            const result = await api.user.getFollowings({}, {
                loadingTitle: '加载中...'
            })

            if (result?.code === 200) {
                this.setData({ users: result.followings || [] })
            } else {
                wx.showToast({ title: '加载失败', icon: 'none' })
            }
        } catch (error) {
            console.error('加载关注列表失败:', error)
            wx.showToast({ title: '网络错误', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    goToUserProfile(e) {
        const user = e.currentTarget.dataset.user
        if (user?.userid) {
            wx.navigateTo({ url: `/pages/user-profile/user-profile?user_id=${user.userid}` })
        }
    },

    onPullDownRefresh() {
        this.loadData().finally(() => {
            wx.stopPullDownRefresh()
        })
    }
})
