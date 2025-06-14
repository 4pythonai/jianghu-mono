Page({
    data: {
        groupIndex: 0,
        slotIndex: 0
    },

    onLoad(options) {
        console.log('friendSelect页面加载，参数:', options);

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

    onReady() {
        // TODO: 实现好友选择功能
    },

    onShow() {

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

    }
}); 