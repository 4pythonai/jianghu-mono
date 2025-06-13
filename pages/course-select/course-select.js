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
     * 输入框内容变化
     */
    async onInput(e) {
        const value = e.detail.value;
        console.log('搜索关键词:', value);

        this.setData({
            searchValue: value
        });

        if (value && value.trim()) {
            await this.searchCourses(value.trim());
        } else {
            // 清空搜索结果
            this.setData({
                searchList: []
            });
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
     * 选择球场
     */
    onSelectCourse(e) {
        const course = e.currentTarget.dataset.course;
        console.log('选中的球场:', course);

        // 将选中的球场信息存储到全局数据或者通过页面参数传递
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2]; // 获取上一个页面

        if (prevPage) {
            // 调用上一个页面的方法来设置选中的球场
            prevPage.setSelectedCourse(course);
        }

        // 返回上一页
        wx.navigateBack({
            delta: 1
        });
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
}) 