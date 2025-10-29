Page({
    data: {
        groupIndex: 0,  // 组索引
        slotIndex: 0,   // 位置索引
        uuid: '', // 游戏 UUID
        gameid: '',
        title: ''

    },

    /**
     * 选择某种添加方式
     */
    onSelectMethod(e) {
        const method = e.currentTarget.dataset.method;
        let url = `${method.url}?groupIndex=${this.data.groupIndex}&slotIndex=${this.data.slotIndex}`;

        // 如果需要传递比赛上下文, 附加 uuid / gameid / 标题
        if ((method.id === 'wxshare' || method.id === 'qrcode') && this.data.uuid) {
            url += `&uuid=${this.data.uuid}`;
            if (this.data.gameid) {
                url += `&gameid=${this.data.gameid}`;
            }
            if (this.data.title) {
                url += `&title=${encodeURIComponent(this.data.title)}`;
            }
            // 添加来源标识
            url += `&source=${method.id}`;
        }

        // 处理手工添加的特殊参数
        if (method.id === 'manualAdd') {
            // 添加场景参数
            if (method.scene) {
                url += `&scene=${method.scene}`;
            }
            // 添加游戏ID参数
            if (this.data.gameid) {
                url += `&gameid=${this.data.gameid}`;
            }
            // 添加UUID参数
            if (this.data.uuid) {
                url += `&uuid=${this.data.uuid}`;
            }
            // 添加标题参数
            if (this.data.title) {
                url += `&title=${encodeURIComponent(this.data.title)}`;
            }
        }

        wx.navigateTo({
            url: url
        });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

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

        if (options.gameid) {
            this.setData({
                gameid: options.gameid
            });
        }

        if (options.title) {
            this.setData({
                title: decodeURIComponent(options.title)
            });
        }
    },
}); 
