// team.js
// 导入 API 模块
const app = getApp()
const api = app.globalData.api

Page({
    data: {
        teamList: [],
        loading: false,
        page: 1,
        pageSize: 10,
        hasMore: true
    },

    onLoad() {
        this.getTeamList()
    },

    onPullDownRefresh() {
        this.setData({
            page: 1,
            teamList: [],
            hasMore: true
        })
        this.getTeamList().then(() => {
            wx.stopPullDownRefresh()
        })
    },

    onReachBottom() {
        if (this.data.hasMore && !this.data.loading) {
            this.getTeamList(true)
        }
    },

    // 获取团队列表
    getTeamList(loadMore = false) {
        if (this.data.loading) return Promise.resolve()

        const page = loadMore ? this.data.page + 1 : 1

        this.setData({ loading: true })

        return api.team.getTeamList({
            page,
            pageSize: this.data.pageSize
        }).then(res => {
            const teamList = loadMore ? [...this.data.teamList, ...res.list] : res.list

            this.setData({
                teamList,
                page,
                loading: false,
                hasMore: res.list.length === this.data.pageSize
            })

            return res
        }).catch(err => {
            console.error('获取团队列表失败', err)
            this.setData({ loading: false })
        })
    },

    // 创建团队
    createTeam() {
        wx.navigateTo({
            url: '/pages/createTeam/createTeam'
        })
    },

    // 查看团队详情
    viewTeamDetail(e) {
        const teamId = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/teamDetail/teamDetail?id=${teamId}`
        })
    }
})