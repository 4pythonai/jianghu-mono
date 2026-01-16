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
            const result = await api.user.getGhostUsers({}, {
                loadingTitle: '加载中...'
            })

            if (result?.code === 200) {
                this.setData({ users: result.ghosts || [] })
            } else {
                wx.showToast({ title: '加载失败', icon: 'none' })
            }
        } catch (error) {
            console.error('加载非注册好友失败:', error)
            wx.showToast({ title: '网络错误', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    /**
     * 长按删除
     */
    onLongPress(e) {
        const user = e.currentTarget.dataset.user
        this.confirmDelete(user)
    },

    /**
     * 点击删除按钮
     */
    onDeleteTap(e) {
        const user = e.currentTarget.dataset.user
        this.confirmDelete(user)
    },

    /**
     * 确认删除
     */
    confirmDelete(user) {
        if (!user?.user_id) return

        wx.showModal({
            title: '确认删除',
            content: `确定要删除"${user.display_name || '该用户'}"吗？`,
            confirmColor: '#ff4d4f',
            success: (res) => {
                if (res.confirm) {
                    this.deleteGhostUser(user.user_id)
                }
            }
        })
    },

    /**
     * 执行删除
     */
    async deleteGhostUser(ghost_userid) {
        try {
            const result = await api.user.deleteGhostUser({ ghost_userid }, {
                loadingTitle: '删除中...'
            })

            if (result?.code === 200) {
                wx.showToast({ title: '删除成功', icon: 'success' })
                // 刷新列表
                this.loadData()
            } else {
                wx.showToast({ title: result?.message || '删除失败', icon: 'none' })
            }
        } catch (error) {
            console.error('删除非注册好友失败:', error)
            wx.showToast({ title: '网络错误', icon: 'none' })
        }
    },

    onPullDownRefresh() {
        this.loadData().finally(() => {
            wx.stopPullDownRefresh()
        })
    }
})
