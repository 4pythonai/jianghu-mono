Page({
    data: {
        selectedCourse: null // 选中的球场信息
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
     * 清除选中的球场
     */
    clearSelectedCourse() {
        this.setData({
            selectedCourse: null
        });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

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