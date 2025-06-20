// live.js
const app = getApp()

Page({
    data: {
        currentTab: 0,  // 当前选中的Tab索引
        games: [],      // 游戏数据
        loading: false, // 加载状态
        isEmpty: false  // 是否为空
    },

    // Tab切换处理函数
    switchTab(e) {
        const index = Number.parseInt(e.currentTarget.dataset.index)
        if (this.data.currentTab === index) {
            return
        }

        this.setData({
            currentTab: index
        })

        // 切换Tab时重新加载数据
        this.loadGames()
    },

    // 加载游戏数据
    async loadGames() {
        try {
            this.setData({ loading: true })

            const response = await app.api.feed.myFeeds({
                tab: this.data.currentTab // 传递当前Tab参数
            })

            console.log('📊 我的动态数据:', response)

            if (response?.games) {
                this.setData({
                    games: response.games,
                    isEmpty: response.games.length === 0
                })
            } else {
                this.setData({
                    games: [],
                    isEmpty: true
                })
            }

        } catch (error) {
            console.error('❌ 加载动态数据失败:', error)
            wx.showToast({
                title: '加载失败，请重试',
                icon: 'none',
                duration: 2000
            })
            this.setData({
                games: [],
                isEmpty: true
            })
        } finally {
            this.setData({ loading: false })
        }
    },

    onLoad() {
        // 页面加载时执行
        console.log('🎮 Live页面加载')
        this.loadGames()
    },

    onShow() {
        // 页面显示时执行
        console.log('👁️ Live页面显示')
        // 如果数据为空且不在加载中，重新加载
        if (this.data.games.length === 0 && !this.data.loading) {
            this.loadGames()
        }
    },

    async onPullDownRefresh() {
        // 下拉刷新
        console.log('🔄 下拉刷新Live页面')
        try {
            await this.loadGames()
        } catch (error) {
            console.error('❌ 刷新失败:', error)
        } finally {
            wx.stopPullDownRefresh()
        }
    }
})