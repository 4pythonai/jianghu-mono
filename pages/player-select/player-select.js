Page({
    data: {
        groupIndex: 0,  // 组索引
        slotIndex: 0,   // 位置索引

        // 选择方式列表
        selectMethods: [
            {
                id: 'combineSelect',
                title: '老牌组合',
                desc: '从多种方式中选择玩家',
                icon: '/assets/icons/1-01.png',
                url: '/pages/player-select/combineSelect/combineSelect'
            },
            {
                id: 'friendSelect',
                title: '好友选择',
                desc: '从微信好友中选择',
                icon: '/assets/icons/2-01.png',
                url: '/pages/player-select/friendSelect/friendSelect'
            },
            {
                id: 'qrcode',
                title: '二维码',
                desc: '扫描或生成二维码邀请',
                icon: '/assets/icons/3-01.png',
                url: '/pages/player-select/qrcode/qrcode'
            },
            {
                id: 'searchAdd',
                title: '搜索添加',
                desc: '通过用户名或ID搜索',
                icon: '/assets/icons/4-01.png',
                url: '/pages/player-select/searchAdd/searchAdd'
            },
            {
                id: 'wxshare',
                title: '微信分享',
                desc: '分享邀请链接给好友',
                icon: '/assets/icons/5-01.png',
                url: '/pages/player-select/wxshare/wxshare'
            }
        ]
    },

    /**
     * 选择某种添加方式
     */
    onSelectMethod(e) {
        const method = e.currentTarget.dataset.method;
        const url = `${method.url}?groupIndex=${this.data.groupIndex}&slotIndex=${this.data.slotIndex}`;

        wx.navigateTo({
            url: url
        });
    },

    /**
     * 返回上一页
     */
    onBack() {
        wx.navigateBack();
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('player-select页面加载，参数:', options);

        // 获取传递的参数
        if (options.groupIndex !== undefined) {
            this.setData({
                groupIndex: parseInt(options.groupIndex)
            });
        }

        if (options.slotIndex !== undefined) {
            this.setData({
                slotIndex: parseInt(options.slotIndex)
            });
        }
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