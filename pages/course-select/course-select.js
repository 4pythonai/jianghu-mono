const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        searchValue: '',
        favoriteList: [],
        searchList: [],
        loading: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('球场选择页面加载');
        console.log('初始数据:', this.data);
        this.getFavoriteCourses();
    },

    /**
     * 获取收藏球场列表
     */
    async getFavoriteCourses() {
        try {
            const res = await app.api.course.getFavorites();
            console.log('收藏球场列表:', res);
            this.setData({
                favoriteList: res.courses || []
            });
        } catch (error) {
            console.error('获取收藏球场失败:', error);
            wx.showToast({
                title: '获取收藏球场失败',
                icon: 'none'
            });
        }
    },

    /**
     * 处理输入框输入事件
     */
    onInput(e) {
        const value = e.detail.value;
        console.log('输入事件:', value);

        // 更新页面数据
        this.setData({
            searchValue: value
        });

        // 执行搜索逻辑
        if (value && value.trim()) {
            this.searchCourses(value.trim());
        } else {
            this.setData({ searchList: [] });
        }
    },

    /**
     * 搜索球场
     */
    async searchCourses(keyword) {
        if (!keyword) return;

        this.setData({ loading: true });
        try {
            console.log('开始搜索:', keyword);
            const res = await app.api.course.searchCourse({ "keyword": keyword });
            console.log('搜索结果:', res);

            this.setData({
                searchList: res.courses || []
            });
        } catch (error) {
            console.error('搜索球场失败:', error);
            wx.showToast({
                title: '搜索球场失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
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
        console.log('页面渲染完成，当前数据:', this.data);
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log('页面显示，当前searchValue:', this.data.searchValue);
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
}) 