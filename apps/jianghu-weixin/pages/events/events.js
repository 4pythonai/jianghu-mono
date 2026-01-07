/**
 * 赛事页面
 * 包含轮播banner和两个tab：可报名赛事、已报名赛事
 */
const app = getApp()

Page({
    data: {
        // 轮播图
        banners: [],
        currentBannerIndex: 0,

        // Tab
        currentTab: 0,  // 0: 可报名赛事, 1: 已报名赛事

        // 赛事列表
        eventList: [],
        loading: false,
        isEmpty: false
    },

    // 是否已完成首次加载
    _hasLoaded: false,

    onLoad() {
        this._hasLoaded = false
        this.loadBanners()
        this.loadEvents().then(() => {
            this._hasLoaded = true
        })
    },

    onShow() {
        // 仅在非首次显示时刷新（从其他页面返回时）
        if (this._hasLoaded) {
            this.loadEvents()
        }
    },

    async onPullDownRefresh() {
        try {
            await Promise.all([
                this.loadBanners(),
                this.loadEvents()
            ])
        } catch (error) {
            console.error('刷新失败:', error)
        } finally {
            wx.stopPullDownRefresh()
        }
    },

    /**
     * 加载轮播图
     */
    async loadBanners() {
        try {
            const response = await app.api.events.getEventBanners()
            if (response?.banners) {
                this.setData({
                    banners: response.banners
                })
            }
        } catch (error) {
            console.error('加载轮播图失败:', error)
        }
    },

    /**
     * 轮播图切换
     */
    onBannerChange(e) {
        this.setData({
            currentBannerIndex: e.detail.current
        })
    },

    /**
     * 轮播图点击
     */
    onBannerTap(e) {
        const banner = e.currentTarget.dataset.banner
        console.log('点击轮播图:', banner)
        // TODO: 跳转到对应的赛事详情页
    },

    /**
     * Tab切换
     */
    switchTab(e) {
        const index = Number.parseInt(e.currentTarget.dataset.index)
        if (this.data.currentTab === index) {
            return
        }

        this.setData({
            currentTab: index
        })

        this.loadEvents()
    },

    /**
     * 加载赛事列表
     */
    async loadEvents() {
        try {
            this.setData({ loading: true })

            let response
            if (this.data.currentTab === 0) {
                // 可报名赛事
                response = await app.api.events.getAvailableEvents()
            } else {
                // 已报名赛事
                response = await app.api.events.getMyEvents()
            }

            if (response?.events) {
                this.setData({
                    eventList: response.events,
                    isEmpty: response.events.length === 0
                })
            } else {
                this.setData({
                    eventList: [],
                    isEmpty: true
                })
            }

        } catch (error) {
            console.error('加载赛事列表失败:', error)
            this.setData({
                eventList: [],
                isEmpty: true
            })
        } finally {
            this.setData({ loading: false })
        }
    },

    /**
     * 点击赛事卡片
     * 根据赛事类型跳转到对应详情页
     */
    onEventTap(e) {
        const event = e.currentTarget.dataset.event
        const gameid = event.gameid
        console.log('点击赛事:', event)

        const navigationHelper = require('@/utils/navigationHelper.js')

        // 判断是否是球队比赛（队内赛/队际赛）
        const teamGameInfo = event.extra_team_game_info
        if (teamGameInfo && teamGameInfo.game_type) {
            // 队内赛: single_team, 队际赛: cross_teams
            const gameType = teamGameInfo.game_type
            navigationHelper.navigateTo(`/pages/team-game/TeamGameDetail?game_id=${gameid}&game-type=${gameType}`)
            return
        }

        // 普通比赛跳转到记分卡页面
        navigationHelper.navigateTo(`/pages/gameDetail/score/score?gameid=${gameid}`)
    }
})
