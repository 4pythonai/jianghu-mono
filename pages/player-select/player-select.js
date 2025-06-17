Page({
    data: {
        groupIndex: 0,  // 组索引
        slotIndex: 0,   // 位置索引
        uuid: '', // 游戏 UUID

        // 选择方式列表
        selectMethods: [
            {
                id: 'combineSelect',
                title: '老牌组合',
                desc: '选择经常打球的组合',
                icon: '/assets/icons/1-01.png',
                url: '/pages/player-select/combineSelect/combineSelect'
            },
            {
                id: 'friendSelect',
                title: '好友选择',
                desc: '从好友关系中选择',
                icon: '/assets/icons/2-01.png',
                url: '/pages/player-select/friendSelect/friendSelect'
            },
            {
                id: 'manualAdd',
                title: '手工添加',
                desc: '通过昵称或手机号添加',
                icon: '/assets/icons/4-01.png',
                url: '/pages/player-select/manualAdd/manualAdd'
            },
            {
                id: 'wxshare',
                title: '微信分享',
                desc: '分享邀请链接给好友',
                icon: '/assets/icons/5-01.png',
                url: '/pages/player-select/wxshare/wxshare'
            },
            {
                id: 'qrcode',
                title: '二维码',
                desc: '扫描或生成二维码邀请',
                icon: '/assets/icons/3-01.png',
                url: '/pages/player-select/qrcode/qrcode'
            }
        ]
    },

    /**
     * 选择某种添加方式
     */
    onSelectMethod(e) {
        const method = e.currentTarget.dataset.method;
        let url = `${method.url}?groupIndex=${this.data.groupIndex}&slotIndex=${this.data.slotIndex}`;

        // 如果是微信分享页面，添加 uuid 参数
        if (method.id === 'wxshare' && this.data.uuid) {
            url += `&uuid=${this.data.uuid}`;
        }

        wx.navigateTo({
            url: url
        });
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

        if (options.uuid) {
            this.setData({
                uuid: options.uuid
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