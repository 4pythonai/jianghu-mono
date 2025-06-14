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
                title: '手工添加',
                desc: '通过用户名或ID搜索',
                icon: '/assets/icons/4-01.png',
                url: '/pages/player-select/manualAdd/searchAdd'
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
     * 处理组合选择回调
     * 从 combineSelect 页面返回时调用，然后转发给上一级页面
     */
    onCombinationSelected(combination, groupIndex, slotIndex) {
        console.log('player-select 接收到组合选择:', { combination, groupIndex, slotIndex });

        // 获取当前页面栈
        const pages = getCurrentPages();

        // 查找 commonCreate 页面或其他父页面
        let parentPage = null;
        for (let i = pages.length - 2; i >= 0; i--) {
            const page = pages[i];
            if (page.route.includes('commonCreate') || typeof page.onCombinationSelected === 'function') {
                parentPage = page;
                break;
            }
        }

        if (parentPage && typeof parentPage.onCombinationSelected === 'function') {
            // 转发给父页面
            parentPage.onCombinationSelected(combination, groupIndex, slotIndex);
        }
    },

    /**
     * 处理好友选择回调
     * 从 friendSelect 页面返回时调用，然后转发给上一级页面
     */
    onFriendsSelected(selectedFriends, groupIndex, slotIndex) {
        console.log('player-select 接收到好友选择:', { selectedFriends, groupIndex, slotIndex });

        // 获取当前页面栈
        const pages = getCurrentPages();

        // 查找 commonCreate 页面或其他父页面
        let parentPage = null;
        for (let i = pages.length - 2; i >= 0; i--) {
            const page = pages[i];
            if (page.route.includes('commonCreate') || typeof page.onFriendsSelected === 'function') {
                parentPage = page;
                break;
            }
        }

        if (parentPage && typeof parentPage.onFriendsSelected === 'function') {
            // 转发给父页面
            parentPage.onFriendsSelected(selectedFriends, groupIndex, slotIndex);
        }
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