const app = getApp();

Page({
    data: {
        gambleid: '',
        loading: true,
        error: null
    },

    onLoad(options) {
        const gambleid = options.gambleid;
        if (!gambleid) {
            this.setData({
                error: '缺少赌博ID参数',
                loading: false
            });
            return;
        }

        this.setData({
            gambleid: gambleid,
        });
        this.fetchGambleResult(gambleid);
    },

    async fetchGambleResult(gambleid) {
        if (!gambleid) {
            return;
        }
        this.setData({ loading: true });
        const result = await app.api.gamble.getSingleGambleResult({ gambleid });
        if (result.code === 200) {
            this.setData({
                groupInfo: result.gambleResult.group_info,
                usefulHoles: result.gambleResult.useful_holes,
                qrcode_url: result.gambleResult.qrcode_url,
                loading: false
            });
        } else {
            throw new Error(result.message || '获取数据失败');
        }

    },
    // 返回游戏详情
    onBackToGame() {
        wx.navigateBack();
    }
}); 