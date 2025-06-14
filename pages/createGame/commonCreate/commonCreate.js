Page({
    data: {
        selectedCourse: null, // 选中的球场信息
        selectedCourt: null   // 选中的半场信息
    },

    handleBack() {
        wx.navigateBack({
            delta: 1
        });
    },

    /**
     * 跳转到球场选择页面
     */
    goToCourseSelect() {
        wx.navigateTo({
            url: '/pages/course-select/course-select'
        });
    },

    /**
     * 设置选中的球场（由球场选择页面调用）
     */
    setSelectedCourse(course) {
        console.log('接收到选中的球场:', course);
        this.setData({
            selectedCourse: course
        });

        wx.showToast({
            title: `已选择 ${course.name}`,
            icon: 'success'
        });
    },

    /**
     * 设置半场选择结果（由半场选择页面调用）
     */
    setCourtSelection(selectionData) {
        console.log('=== commonCreate.setCourtSelection 被调用 ===');
        console.log('接收到半场选择结果:', selectionData);
        console.log('selectionData.course:', selectionData.course);
        console.log('selectionData.court:', selectionData.court);

        this.setData({
            selectedCourse: selectionData.course,
            selectedCourt: selectionData.court
        });

        console.log('数据设置完成，当前页面数据:', this.data);

        wx.showToast({
            title: `已选择 ${selectionData.course?.name || '球场'} - ${selectionData.court?.name || '半场'}`,
            icon: 'success',
            duration: 2000
        });
    },

    /**
     * 清除选中的球场和半场
     */
    clearSelectedCourse() {
        this.setData({
            selectedCourse: null,
            selectedCourt: null
        });
    },

    /**
     * 处理创建比赛
     */
    handleCreateGame() {
        console.log('=== 创建比赛数据收集 ===');

        // 收集所有数据
        const gameData = {
            // 基本信息
            gameType: 'common', // 比赛类型
            createTime: new Date().toISOString(), // 创建时间

            // 球场信息
            course: this.data.selectedCourse,

            // 半场信息
            court: this.data.selectedCourt,

            // 页面数据
            pageData: this.data,

            // 用户信息（如果有的话）
            userInfo: getApp().globalData?.userInfo || null,

            // 设备信息
            systemInfo: wx.getSystemInfoSync(),

            // 页面路径
            currentPage: getCurrentPages()[getCurrentPages().length - 1].route
        };

        console.log('完整的比赛数据:', gameData);
        console.log('选中的球场信息:', this.data.selectedCourse);
        console.log('选中的半场信息:', this.data.selectedCourt);
        console.log('页面所有数据:', this.data);

        // 数据验证
        if (!this.data.selectedCourse) {
            wx.showToast({
                title: '请先选择球场',
                icon: 'none'
            });
            console.warn('创建失败: 未选择球场');
            return;
        }

        if (!this.data.selectedCourt) {
            wx.showToast({
                title: '请先选择半场',
                icon: 'none'
            });
            console.warn('创建失败: 未选择半场');
            return;
        }

        // 准备API请求数据
        const apiRequestData = {
            course_id: this.data.selectedCourse.id || this.data.selectedCourse.courseid,
            course_name: this.data.selectedCourse.name,
            course_address: this.data.selectedCourse.address,
            court_type: this.data.selectedCourt.value,
            court_name: this.data.selectedCourt.name,
            court_holes: this.data.selectedCourt.holes,
            // 如果是18洞，还包含前九洞和后九洞的详细信息
            front_nine: this.data.selectedCourt.frontNine,
            back_nine: this.data.selectedCourt.backNine,
            front_nine_holes: this.data.selectedCourt.frontNineHoles,
            back_nine_holes: this.data.selectedCourt.backNineHoles,
            game_type: 'common',
            create_time: new Date().toISOString()
        };

        console.log('准备发送给API的数据:', apiRequestData);

        // 显示成功提示
        wx.showToast({
            title: '数据已收集完成',
            icon: 'success'
        });

        // 这里可以调用API
        // this.createGameAPI(apiRequestData);
    },

    /**
     * 调用创建比赛API（示例）
     */
    async createGameAPI(data) {
        try {
            console.log('准备调用API创建比赛:', data);

            // 示例API调用
            // const result = await getApp().api.game.create(data);
            // console.log('API返回结果:', result);

            wx.showToast({
                title: '比赛创建成功',
                icon: 'success'
            });

            // 可以跳转到比赛详情页面
            // wx.navigateTo({
            //   url: `/pages/gameDetail/gameDetail?id=${result.game_id}`
            // });

        } catch (error) {
            console.error('创建比赛失败:', error);
            wx.showToast({
                title: '创建失败，请重试',
                icon: 'none'
            });
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('commonCreate页面加载，参数:', options);
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log('commonCreate页面显示，当前数据:', this.data);

        // 检查本地缓存中是否有选择的半场数据（备用方案）
        try {
            const cachedCourtData = wx.getStorageSync('selectedCourtData')
            if (cachedCourtData) {
                console.log('从缓存中读取到半场选择数据:', cachedCourtData)
                this.setCourtSelection(cachedCourtData)
                // 清除缓存，避免重复使用
                wx.removeStorageSync('selectedCourtData')
            }
        } catch (error) {
            console.error('读取缓存数据失败:', error)
        }
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

    }
}); 