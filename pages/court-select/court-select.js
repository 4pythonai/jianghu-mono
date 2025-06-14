const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        selectedCourse: null, // 选中的球场信息
        selectedCourt: '', // 选中的半场
        courtOptions: [
            {
                value: 'front_nine',
                name: '前九洞',
                description: '1-9洞，适合初学者和时间较短的比赛',
                holes: 9,
                price: 280
            },
            {
                value: 'back_nine',
                name: '后九洞',
                description: '10-18洞，挑战性更强，风景更佳',
                holes: 9,
                price: 320
            },
            {
                value: 'full_course',
                name: '全场',
                description: '1-18洞完整体验，标准高尔夫比赛',
                holes: 18,
                price: 580
            }
        ]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('选择半场页面加载，参数:', options)

        // 从页面参数中获取球场信息
        if (options.courseData) {
            try {
                const courseData = JSON.parse(decodeURIComponent(options.courseData))
                this.setData({
                    selectedCourse: courseData
                })
                console.log('接收到的球场信息 ❤️❤️❤️:', courseData)
                console.log('球场ID字段检查 ❤️❤️❤️:')
                console.log('- courseData.id:', courseData.id)
                console.log('- courseData.courseid:', courseData.courseid)
                console.log('- courseData.course_id:', courseData.course_id)
                console.log('- 所有字段:', Object.keys(courseData))
            } catch (error) {
                console.error('解析球场数据失败:', error)
                this.showErrorAndGoBack('球场信息获取失败')
            }
        } else {
            console.error('未接收到球场信息')
            this.showErrorAndGoBack('球场信息缺失')
        }

        // 根据球场信息动态调整半场选项和价格
        this.updateCourtOptions()
    },

    /**
     * 根据球场信息更新半场选项
     */
    updateCourtOptions() {
        const { selectedCourse } = this.data
        if (!selectedCourse) return

        // 这里可以根据不同球场调整价格和选项
        // 示例：根据球场等级调整价格
        let priceMultiplier = 1
        if (selectedCourse.level === 'premium') {
            priceMultiplier = 1.5
        } else if (selectedCourse.level === 'luxury') {
            priceMultiplier = 2
        }

        const updatedOptions = this.data.courtOptions.map(option => ({
            ...option,
            price: Math.round(option.price * priceMultiplier)
        }))

        this.setData({
            courtOptions: updatedOptions
        })
    },

    /**
     * 选择半场
     */
    onSelectCourt(e) {
        const court = e.currentTarget.dataset.court
        console.log('选择半场:', court)

        this.setData({
            selectedCourt: court.value
        })
    },

    /**
     * 确认选择
     */
    onConfirm() {
        const { selectedCourse, selectedCourt, courtOptions } = this.data

        if (!selectedCourt) {
            wx.showToast({
                title: '请选择半场',
                icon: 'none'
            })
            return
        }

        // 找到选中的半场详细信息
        const courtInfo = courtOptions.find(option => option.value === selectedCourt)

        // 组合完整的选择信息
        const selectionData = {
            course: selectedCourse,
            court: courtInfo,
            timestamp: Date.now()
        }

        console.log('确认选择的数据:', selectionData)

        // 将选择结果传递给上级页面
        const pages = getCurrentPages()
        const prevPage = pages[pages.length - 2] // 获取上一个页面

        if (prevPage?.setCourtSelection) {
            // 如果上一个页面有处理方法，调用它
            prevPage.setCourtSelection(selectionData)
        }

        // 返回到创建比赛页面（跳过球场选择页面）
        wx.navigateBack({
            delta: 2 // 返回两级页面
        })
    },

    /**
     * 显示错误并返回
     */
    showErrorAndGoBack(message) {
        wx.showToast({
            title: message,
            icon: 'none',
            duration: 2000,
            complete: () => {
                setTimeout(() => {
                    wx.navigateBack({
                        delta: 1
                    })
                }, 2000)
            }
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        console.log('选择半场页面渲染完成')
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 打印所有的数据:
        console.log('页面显示 ❤️❤️❤️ 所有的数据:', this.data)
        console.log('selectedCourse ❤️❤️❤️:', this.data.selectedCourse)
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉刷新
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    },

    /**
     * 处理半场确认事件
     */
    onCourtConfirm(e) {
        const { selectionData } = e.detail
        console.log('页面接收到确认选择:', selectionData)

        // 组合半场信息，将前九洞和后九洞合并为一个court对象
        const combinedCourt = {
            name: `${selectionData.frontNine?.courtname || '前九洞'} + ${selectionData.backNine?.courtname || '后九洞'}`,
            value: 'full_18_holes', // 18洞标识
            holes: 18, // 总洞数
            price: (selectionData.frontNine?.price || 0) + (selectionData.backNine?.price || 0), // 价格相加
            frontNine: selectionData.frontNine,
            backNine: selectionData.backNine,
            frontNineHoles: selectionData.frontNineHoles,
            backNineHoles: selectionData.backNineHoles
        }

        // 转换数据格式，匹配commonCreate期望的格式
        const formattedData = {
            course: selectionData.course,
            court: combinedCourt, // 这里是关键！将组合后的半场信息赋值给court
            timestamp: selectionData.timestamp
        }

        console.log('转换后的数据格式:', formattedData)

        // 将选择结果传递给commonCreate页面
        const pages = getCurrentPages()
        const commonCreatePage = pages[pages.length - 3] // 获取commonCreate页面（跳过course-select页面）

        console.log('=== 页面栈调试信息 ===')
        console.log('当前页面栈:', pages.map(p => p.route))
        console.log('页面栈长度:', pages.length)
        console.log('当前页面(最后一个):', pages[pages.length - 1]?.route)
        console.log('course-select页面(倒数第二个):', pages[pages.length - 2]?.route)
        console.log('commonCreate页面(倒数第三个):', commonCreatePage?.route)
        console.log('commonCreate页面是否存在:', !!commonCreatePage)
        console.log('commonCreate页面是否有setCourtSelection方法:', typeof commonCreatePage?.setCourtSelection)

        // 打印更多页面信息
        pages.forEach((page, index) => {
            console.log(`页面${index}: ${page.route}, 有setCourtSelection方法: ${typeof page.setCourtSelection}`)
        })

        // 调用commonCreate页面的方法
        if (commonCreatePage?.setCourtSelection) {
            console.log('调用commonCreate页面的setCourtSelection方法')
            commonCreatePage.setCourtSelection(formattedData)
        } else {
            console.error('commonCreate页面没有setCourtSelection方法或页面不存在')

            // 备用方案：尝试通过事件总线或者其他方式传递数据
            console.log('尝试备用方案...')
            // 可以尝试使用 wx.setStorageSync 临时存储数据
            wx.setStorageSync('selectedCourtData', formattedData)
            console.log('数据已存储到本地缓存')
        }

        // 返回到创建比赛页面（跳过球场选择页面）
        wx.navigateBack({
            delta: 2 // 返回两级页面
        })
    },

    /**
     * 处理半场选择事件
     */
    onCourtSelect(e) {
        const { court } = e.detail
        console.log('页面接收到半场选择:', court)
    },

    /**
     * 处理错误事件
     */
    onError(e) {
        const { type, message } = e.detail
        console.error('CourtSelector错误:', type, message)

        wx.showToast({
            title: message || '操作失败，请重试',
            icon: 'none'
        })
    },

    /**
     * 处理数据加载完成事件
     */
    onDataLoaded(e) {
        const { course, courts } = e.detail
        console.log('球场数据加载完成:', course, courts)
    },

    /**
     * 处理前九洞选择事件
     */
    onSelectFrontNine(e) {
        const { court, holes } = e.detail
        console.log('选择前九洞:', court, holes)
    },

    /**
     * 处理后九洞选择事件
     */
    onSelectBackNine(e) {
        const { court, holes } = e.detail
        console.log('选择后九洞:', court, holes)
    },

    /**
     * 处理选择完成事件
     */
    onSelectionComplete(e) {
        const { frontNine, backNine, frontNineHoles, backNineHoles } = e.detail
        console.log('选择完成:', {
            frontNine,
            backNine,
            frontNineHoles,
            backNineHoles
        })
    }
}) 