// team.js
const app = getApp()
const { api } = app.globalData

Page({
    data: {
        teamList: [],
        loading: false,
        page: 1,
        pageSize: 10,
        hasMore: true,
        location: null,
        locationLoading: false,
        courseList: [],
        courseLoading: false
    },

    onLoad() {
        // 页面加载时获取位置和加载团队列表
        this.getLocation()
        this.loadTeamList()
    },

    onPullDownRefresh() {
        // 下拉刷新
        this.setData({
            page: 1,
            hasMore: true,
            teamList: []
        }, () => {
            this.loadTeamList().then(() => {
                wx.stopPullDownRefresh()
            })
        })
    },

    onReachBottom() {
        // 上拉加载更多
        if (this.data.hasMore && !this.data.loading) {
            this.loadTeamList()
        }
    },

    // 加载团队列表
    async loadTeamList() {
        if (this.data.loading || !this.data.hasMore) return

        this.setData({ loading: true })

        try {
            const { page, pageSize } = this.data
            const res = await api.team.list({ page, pageSize })

            // 处理返回数据
            const newList = this.data.page === 1 ? res.list : [...this.data.teamList, ...res.list]

            this.setData({
                teamList: newList,
                page: page + 1,
                hasMore: res.list.length === pageSize,
                loading: false
            })
        } catch (error) {
            console.error('加载团队列表失败：', error)
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            })
            this.setData({ loading: false })
        }
    },

    getLocation() {
        if (this.data.locationLoading) return
        this.setData({ locationLoading: true })

        // 先检查位置权限
        wx.getSetting({
            success: (res) => {
                if (!res.authSetting['scope.userLocation']) {
                    // 如果没有权限，请求授权
                    wx.authorize({
                        scope: 'scope.userLocation',
                        success: () => {
                            this.startLocationRequest()
                        },
                        fail: () => {
                            // 用户拒绝授权，显示打开设置页面的对话框
                            wx.showModal({
                                title: '需要位置权限',
                                content: '请授权访问您的位置信息，以便获取当前位置',
                                confirmText: '去设置',
                                success: (modalRes) => {
                                    if (modalRes.confirm) {
                                        wx.openSetting()
                                    }
                                },
                                complete: () => {
                                    this.setData({ locationLoading: false })
                                }
                            })
                        }
                    })
                } else {
                    // 已有权限，直接获取位置
                    this.startLocationRequest()
                }
            },
            fail: () => {
                wx.showToast({
                    title: '获取权限失败',
                    icon: 'none'
                })
                this.setData({ locationLoading: false })
            }
        })
    },

    startLocationRequest() {
        wx.showLoading({
            title: '获取位置中...',
        })

        wx.getLocation({
            type: 'gcj02',
            success: (res) => {
                const { latitude, longitude } = res

                this.setData({
                    location: {
                        latitude,
                        longitude,
                        updateTime: new Date().toLocaleString('zh-CN')
                    }
                })

                // 成功获取位置后自动获取附近球场
                this.getNearestCourses()

                wx.showToast({
                    title: '位置更新成功',
                    icon: 'success',
                    duration: 1500
                })
            },
            fail: (err) => {
                console.error('获取位置失败：', err)
                this.handleLocationError('获取位置失败')
            },
            complete: () => {
                wx.hideLoading()
                this.setData({ locationLoading: false })
            }
        })
    },

    handleLocationError(errorMsg, coords = null) {
        wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
        })

        if (coords) {
            this.setData({
                location: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    updateTime: new Date().toLocaleString('zh-CN')
                }
            })
        }

        wx.showModal({
            title: '位置获取失败',
            content: '是否重试？',
            success: (res) => {
                if (res.confirm) {
                    setTimeout(() => {
                        this.getLocation()
                    }, 1000)
                }
            }
        })
    },

    // 获取最近的球场列表
    async getNearestCourses() {
        if (!this.data.location) {
            wx.showToast({
                title: '请先获取位置',
                icon: 'none'
            })
            return
        }



        this.setData({ courseLoading: true })
        wx.showLoading({ title: '获取球场中...' })

        try {
            const { latitude, longitude } = this.data.location
            console.log("发送请求参数:", { latitude, longitude })

            const courseList = await api.course.getNearestCourses({ latitude, longitude })
            console.log("API响应:", courseList)

            this.setData({ courseList: courseList.data })
            wx.showToast({
                title: '获取球场成功',
                icon: 'success'
            })
        } catch (error) {
            console.error('获取球场失败：', error)
            console.error('错误详情：', {
                message: error.message,
                stack: error.stack,
                errMsg: error.errMsg
            })
            wx.showToast({
                title: '获取球场失败',
                icon: 'none'
            })
        } finally {
            wx.hideLoading()
            this.setData({ courseLoading: false })
        }
    },

    // 查看团队详情
    viewTeamDetail(e) {
        const teamId = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/teamDetail/teamDetail?id=${teamId}`
        })
    }
})