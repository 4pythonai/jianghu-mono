const app = getApp()

Page({
    data: {
        location: null,
        nearestCourse: null,
        currentTime: '',
        locationLoading: false,
        createLoading: false,
        locationError: false
    },

    onLoad() {
        this.updateCurrentTime()
        this.timeInterval = setInterval(() => {
            this.updateCurrentTime()
        }, 1000)
    },

    onUnload() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval)
        }
    },

    updateCurrentTime() {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hour = String(now.getHours()).padStart(2, '0')
        const minute = String(now.getMinutes()).padStart(2, '0')
        this.setData({
            currentTime: `${year}-${month}-${day} ${hour}:${minute}`
        })
    },

    onGetLocation() {
        if (this.data.locationLoading) return
        this.setData({ locationLoading: true, locationError: false })

        wx.getSetting({
            success: (res) => {
                if (!res.authSetting['scope.userLocation']) {
                    wx.authorize({
                        scope: 'scope.userLocation',
                        success: () => {
                            this.startLocationRequest()
                        },
                        fail: () => {
                            wx.showModal({
                                title: '需要位置权限',
                                content: '请授权访问您的位置信息，以便获取附近球场',
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
                    this.startLocationRequest()
                }
            },
            fail: () => {
                wx.showToast({ title: '获取权限失败', icon: 'none' })
                this.setData({ locationLoading: false, locationError: true })
            }
        })
    },

    startLocationRequest() {
        wx.showLoading({ title: '获取位置中...' })

        wx.getLocation({
            type: 'gcj02',
            success: (res) => {
                const { latitude, longitude } = res
                this.setData({
                    location: { latitude, longitude }
                })
                this.getNearestCourse(latitude, longitude)
            },
            fail: () => {
                wx.hideLoading()
                wx.showToast({ title: '获取位置失败', icon: 'none' })
                this.setData({ locationLoading: false, locationError: true })
            }
        })
    },

    async getNearestCourse(latitude, longitude) {
        try {
            const result = await app.api.course.getNearestCourses({ latitude, longitude })
            wx.hideLoading()

            if (result.code === 200 && result.data && result.data.length > 0) {
                const course = result.data[0]
                this.setData({
                    nearestCourse: course,
                    locationLoading: false,
                    locationError: false
                })
            } else {
                wx.showToast({ title: '附近没有球场', icon: 'none' })
                this.setData({ locationLoading: false, locationError: true })
            }
        } catch (error) {
            wx.hideLoading()
            wx.showToast({ title: '获取球场失败', icon: 'none' })
            this.setData({ locationLoading: false, locationError: true })
        }
    },

    async onStartGame() {
        if (!this.data.nearestCourse) {
            wx.showToast({ title: '请先获取位置', icon: 'none' })
            return
        }

        if (this.data.createLoading) return
        this.setData({ createLoading: true })

        wx.showLoading({ title: '创建比赛中...' })

        try {
            const uuid = this.generateUUID()

            // 1. 创建空白比赛
            const createResult = await app.api.game.createBlankGame({ uuid, create_source: 'quick' })
            if (createResult.code !== 200) {
                throw new Error(createResult.message || '创建比赛失败')
            }
            const { gameid } = createResult

            // 2. 获取球场详情（获取场地信息）
            const courseDetail = await app.api.course.getCourseDetail({
                courseid: this.data.nearestCourse.courseid
            })
            if (courseDetail.code !== 200 || !courseDetail.courts || courseDetail.courts.length < 2) {
                throw new Error('获取球场场地失败')
            }
            const frontNineCourtId = courseDetail.courts[0].courtid
            const backNineCourtId = courseDetail.courts[1].courtid

            // 3. 设置球场和场地
            const updateResult = await app.api.game.updateGameCourseCourt({
                uuid,
                courseid: this.data.nearestCourse.courseid,
                frontNineCourtId,
                backNineCourtId
            })
            if (updateResult.code !== 200) {
                throw new Error(updateResult.message || '设置球场失败')
            }

            // 4. 当前用户加入比赛
            const joinResult = await app.api.game.joinGame({ gameid })
            if (joinResult.code !== 200 && joinResult.code !== 409) {
                throw new Error(joinResult.message || '加入比赛失败')
            }
            const groupid = joinResult.data?.groupid || 1

            wx.hideLoading()
            this.setData({ createLoading: false })

            // 5. 跳转到记分页面
            wx.navigateTo({
                url: `/packageGame/gameDetail/gameDetail?gameid=${gameid}&groupid=${groupid}`
            })

        } catch (error) {
            wx.hideLoading()
            wx.showToast({ title: error.message || '创建失败', icon: 'none' })
            this.setData({ createLoading: false })
        }
    },

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0
            const v = c === 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
    },

    handleBack() {
        wx.navigateBack({ delta: 1 })
    }
})
