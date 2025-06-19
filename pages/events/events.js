// team.js
const app = getApp()


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
    },

    onPullDownRefresh() { },


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

        try {
            const { latitude, longitude } = this.data.location
            console.log("发送请求参数:", { latitude, longitude })

            const courseList = await app.api.course.getNearestCourses({ latitude, longitude }, {
                loadingTitle: '获取球场中...'
            })
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
            this.setData({ courseLoading: false })
        }
    },


})