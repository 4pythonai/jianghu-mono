// live.js
const app = getApp()

Page({
    data: {
        currentTab: 0,  // 当前选中的Tab索引
        games: [],      // 游戏数据
        loading: false, // 加载状态
        isEmpty: false, // 是否为空
        navbarWrapperHeight: 0 // 导航栏容器高度（屏幕1/4）
    },

    // 是否已完成首次加载
    _hasLoaded: false,

    // 搜索处理函数
    handleSearch() {
        console.log('🔍 点击搜索框')
        // TODO: 跳转到搜索页面或显示搜索界面
        wx.showToast({
            title: '搜索功能开发中',
            icon: 'none',
            duration: 2000
        })
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
                title: '加载失败, 请重试',
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

        // 计算导航栏容器高度为屏幕的1/4
        const app = getApp()
        const screenHeight = app.globalSystemInfo?.screenHeight || app.globalData.systemInfo?.screenHeight || 667
        const navbarWrapperHeight = screenHeight / 4
        this.setData({
            navbarWrapperHeight: navbarWrapperHeight
        })
        console.log('📏 导航栏容器高度设置为屏幕1/4:', navbarWrapperHeight + 'px')

        this._hasLoaded = false
        this.loadGames().then(() => {
            this._hasLoaded = true
        })
    },

    onShow() {
        // 页面显示时执行
        console.log('👁️ Live页面显示')
        // 仅在非首次显示时刷新（从其他页面返回时）
        if (this._hasLoaded) {
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