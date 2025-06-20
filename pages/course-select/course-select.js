const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        // 移除不需要的数据，因为组件会自己管理
        // searchValue: '',
        // favoriteList: [],
        // searchList: [],
        // loading: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('球场选择页面加载');
        console.log('初始数据:', this.data);
        // 移除重复的getFavoriteCourses调用，让组件自己处理
        // this.getFavoriteCourses();
    },

    /**
     * 处理球场选择事件
     */
    onCourseSelect(e) {
        const { course } = e.detail
        console.log('页面接收到选中的球场:', course)

        // 跳转到半场选择页面，传递球场信息
        wx.navigateTo({
            url: `/pages/court-select/court-select?courseData=${encodeURIComponent(JSON.stringify(course))}`
        })
    },

    /**
     * 处理错误事件
     */
    onError(e) {
        const { type, error } = e.detail
        console.error('CourseSelector错误:', type, error)

        let message = '操作失败，请重试'
        if (type === 'getFavorites') {
            message = '获取收藏球场失败'
        } else if (type === 'search') {
            message = '搜索球场失败'
        }

        wx.showToast({
            title: message,
            icon: 'none'
        })
    },

    /**
     * 处理搜索开始事件
     */
    onSearchStart(e) {
        const { keyword } = e.detail
        console.log('开始搜索:', keyword)
    },

    /**
     * 处理搜索完成事件
     */
    onSearchComplete(e) {
        const { keyword, results } = e.detail
        console.log('搜索完成:', keyword, '结果数量:', results.length)
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        console.log('球场选择页面渲染完成');
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log('球场选择页面显示');
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        // 页面隐藏时清理loading，防止loading一直显示
        if (app?.http) {
            const status = app.http.getLoadingStatus()
            if (status.isLoading) {
                console.log('⚠️ 页面隐藏时发现loading还在显示，强制清理')
            }
        }
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        // 页面卸载时清理loading，防止loading一直显示
        if (app?.http) {
            const status = app.http.getLoadingStatus()
            if (status.isLoading) {
                console.log('⚠️ 页面卸载时发现loading还在显示，强制清理')
            }
        }
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
}) 