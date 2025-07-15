Page({
    data: {
        groupIndex: 0,  // 组索引
        slotIndex: 0,   // 位置索引
        uuid: '', // 游戏 UUID

    },

    /**
     * 选择某种添加方式
     */
    onSelectMethod(e) {
        const method = e.currentTarget.dataset.method;
        let url = `${method.url}?groupIndex=${this.data.groupIndex}&slotIndex=${this.data.slotIndex}`;

        // 如果是微信分享页面, 添加 uuid 参数
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
        console.log('player-select页面加载, 参数:', options);

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

        if (options.uuid) {
            this.setData({
                uuid: options.uuid
            });
        }
    },
}); 