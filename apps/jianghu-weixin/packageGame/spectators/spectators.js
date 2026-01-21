/**
 * 围观者列表页
 * 显示比赛的所有围观者
 */
const app = getApp()

Page({
    data: {
        loading: true,
        gameId: null,
        gameName: '',
        spectators: [],
        total: 0,
        page: 1,
        pageSize: 20,
        hasMore: true,
        loadingMore: false,
        navBarHeight: 88,
        defaultAvatar: '/assets/images/default-avatar.png'
    },

    onLoad(options) {
        // URL 参数统一使用下划线命名: game_id, game_name
        const gameId = options.game_id || null
        const gameName = decodeURIComponent(options.game_name || '')

        // 计算导航栏高度
        const { getNavBarHeight } = require('@/utils/systemInfo')
        const navBarHeight = getNavBarHeight()

        this.setData({ gameId, gameName, navBarHeight })

        if (gameId) {
            this.loadSpectators()
        } else {
            this.setData({ loading: false })
        }
    },

    /**
     * 加载围观者列表
     */
    async loadSpectators(loadMore = false) {
        if (loadMore) {
            if (this.data.loadingMore || !this.data.hasMore) return
            this.setData({ loadingMore: true })
        } else {
            this.setData({ loading: true, page: 1 })
        }

        try {
            const result = await app.api.events.getSpectatorList({
                game_id: this.data.gameId,
                page: this.data.page,
                page_size: this.data.pageSize
            })

            if (result && result.code === 200) {
                const newSpectators = result.list || []
                const total = result.total || 0

                this.setData({
                    spectators: loadMore
                        ? [...this.data.spectators, ...newSpectators]
                        : newSpectators,
                    total,
                    hasMore: this.data.spectators.length + newSpectators.length < total,
                    page: this.data.page + 1
                })
            }
        } catch (error) {
            console.error('加载围观者列表失败:', error)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({
                loading: false,
                loadingMore: false
            })
        }
    },

    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        this.loadSpectators().finally(() => {
            wx.stopPullDownRefresh()
        })
    },

    /**
     * 上拉加载更多
     */
    onReachBottom() {
        this.loadSpectators(true)
    },

    /**
     * 返回上一页
     */
    handleBack() {
        wx.navigateBack({ delta: 1 })
    },

    /**
     * 点击围观者
     */
    onSpectatorTap(e) {
        const { user_id } = e.currentTarget.dataset
        // 可以跳转到用户主页或显示用户信息
        console.log('点击围观者:', user_id)
    }
})

