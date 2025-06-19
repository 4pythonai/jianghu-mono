Page({
    usingComponents: {
        'bbs': './bbs/bbs',
        'gamble': './gamble/gamble',
        'scoring': './scoring/scoring'
    },
    data: {
        currentTab: 0, // 当前激活的tab索引
        gameId: '',
        gameData: null, // 原始比赛数据
        loading: false, // 加载状态
        error: null // 错误信息
    },

    onLoad(options) {
        // 获取app实例
        this.app = getApp()


        this.setData({
            gameId: options?.gameId || '未获取到gameId'
        });

        // 获取比赛详情
        if (options?.gameId) {
            console.log('🎮 开始加载比赛详情:', options.gameId)
            this.loadGameDetail(options.gameId)
        } else {
            console.warn('⚠️ 无效的比赛ID')
            wx.showToast({
                title: '比赛ID无效',
                icon: 'none'
            })
        }
    },

    // 加载比赛详情
    async loadGameDetail(gameId) {
        if (this.data.loading) {
            console.log('⏳ 正在加载中，跳过重复请求')
            return
        }



        this.setData({
            loading: true,
            error: null
        })

        console.log('🚀 发起获取比赛详情请求:', {
            gameId,
            timestamp: new Date().toISOString()
        })

        try {
            // 验证API实例
            if (!this.app?.api?.game?.getGameDetail) {
                throw new Error('API方法未定义: game.getGameDetail')
            }

            // 使用自定义loading文案
            const res = await this.app.api.game.getGameDetail({ gameId }, {
                loadingTitle: '加载比赛详情...',
                loadingMask: true
            })
            console.log(res.gameinfo)

            // 验证响应状态码和数据
            if (res?.code === 200) {
                this.setData({
                    gameData: res.gameinfo
                })
            }
        } catch (err) {
            console.error('❌ 获取比赛详情失败:', {
                error: err?.message || err,
                gameId,
                timestamp: new Date().toISOString()
            })

            const errorMsg = err?.message || '获取比赛详情失败'
            this.setData({
                error: errorMsg
            })

            wx.showToast({
                title: errorMsg,
                icon: 'none',
                duration: 2500
            })
        } finally {
            console.log('🏁 比赛详情加载完成')
            this.setData({ loading: false })

            // 移除手动hideLoading，API会自动处理
            // wx.hideLoading()
        }
    },

    // 重试加载
    retryLoad() {
        if (this.data.loading) return

        console.log('🔄 重试加载比赛详情')
        if (this.data.gameId) {
            // 清除错误状态
            this.setData({ error: null })
            this.loadGameDetail(this.data.gameId)
        }
    },

    // 切换tab页方法
    switchTab: function (e) {
        const newTab = Number.parseInt(e.currentTarget.dataset.tab)
        console.log('📑 切换到Tab:', newTab)

        this.setData({
            currentTab: newTab
        });
    },

    // 页面显示时检查数据
    onShow() {
        // 如果没有数据且不在加载中，自动重试
        if (!this.data.gameData && !this.data.loading && this.data.gameId) {
            console.log('📝 页面显示，检测到无数据，自动重试加载')
            this.loadGameDetail(this.data.gameId)
        }
    }
})