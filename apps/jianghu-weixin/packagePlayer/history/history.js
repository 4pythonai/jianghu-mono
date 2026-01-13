import api from '@/api/index'

Page({
    data: {
        games: [],
        loading: false
    },

    onLoad() {
        this.loadData()
    },

    onShow() {
        this.loadData()
    },

    async loadData() {
        if (this.data.loading) return
        this.setData({ loading: true })

        try {
            const result = await api.user.getGameHistory({}, {
                loadingTitle: '加载中...'
            })

            if (result?.code === 200) {
                this.setData({ games: result.games || [] })
            } else {
                wx.showToast({ title: '加载失败', icon: 'none' })
            }
        } catch (error) {
            console.error('加载历史成绩失败:', error)
            wx.showToast({ title: '网络错误', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    /**
     * 获取分数圆形的样式类
     * 黑色: 优秀成绩 (<80)
     * 黄色: 一般成绩 (80-100)
     * 红色: 特殊/其他
     */
    getScoreClass(score) {
        if (score < 80) return 'score-excellent'
        if (score <= 100) return 'score-normal'
        return 'score-special'
    },

    /**
     * 格式化差杆显示
     */
    formatOverPar(overPar) {
        if (overPar > 0) return '+' + overPar
        if (overPar < 0) return String(overPar)
        return 'E'
    },

    /**
     * 格式化时间显示
     */
    formatTime(timeStr) {
        if (!timeStr) return ''
        const date = new Date(timeStr)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        const hours = date.getHours()
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const ampm = hours < 12 ? '上午' : '下午'
        const displayHours = hours <= 12 ? hours : hours - 12
        return `${year}年${month}月${day}日 ${ampm} ${displayHours}:${minutes}`
    },

    /**
     * 跳转到比赛详情
     */
    goToGameDetail(e) {
        const gameId = e.currentTarget.dataset.gameid
        if (gameId) {
            wx.navigateTo({ url: `/packageGame/gameDetail/gameDetail?gameid=${gameId}` })
        }
    },

    onPullDownRefresh() {
        this.loadData().finally(() => {
            wx.stopPullDownRefresh()
        })
    }
})
