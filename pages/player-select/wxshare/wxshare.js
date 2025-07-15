Page({
    data: {
        groupIndex: 0,
        slotIndex: 0,
        uuid: ''
    },

    onLoad(options) {
        console.log('wxshare页面加载, 参数:', options);

        if (options.groupIndex !== undefined) {
            this.setData({
                groupIndex: Number.parseInt(options.groupIndex)
            });
        }

        if (options.slotIndex !== undefined) {
            this.setData({
                slotIndex: Number.parseInt(options.slotIndex)
            });
        }

        // 接收并显示 UUID
        if (options.uuid) {
            console.log('接收到 UUID:', options.uuid);
            this.setData({
                uuid: options.uuid
            });
        } else {
            console.warn('未接收到 UUID');
        }
    },

    onReady() {
        console.log('页面准备就绪, 当前 UUID:', this.data.uuid);
    },

    onShow() {
        console.log('页面显示, 当前 UUID:', this.data.uuid);
    },

    onHide() {

    },

    onUnload() {

    },

    onPullDownRefresh() {

    },

    onReachBottom() {

    },

    onShareAppMessage() {
        // 用户点击右上角分享
        return {
            title: '邀请加入游戏',
            path: `/pages/player-select/wxshare/wxshare?uuid=${this.data.uuid}`
        }
    }
}); 