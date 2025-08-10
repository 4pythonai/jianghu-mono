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

        // 解析页面参数
        this.setData({
            gambleid: gambleid,
        });

        // 获取赌博结果数据
        this.fetchGambleResult(gambleid);
    },

    /**
     * 获取赌博结果数据
     */
    async fetchGambleResult(gambleid) {
        // 如果没有传入gambleid，使用当前页面的gambleid
        if (!gambleid) {
            return;
        }

        try {
            this.setData({ loading: true });

            console.log('🎯 [GambleResult] 开始获取赌博结果:', gambleid);

            // 调用API获取赌博结果
            const result = await app.api.gamble.getSingleGambleResult({ gambleid });

            if (result.code === 200) {
                console.log('🎯 [GambleResult] 获取结果成功:', result);

                this.setData({
                    groupInfo: result.gambleResult.group_info,
                    usefulHoles: result.gambleResult.useful_holes,
                    qrcode_url: result.gambleResult.qrcode_url,
                    loading: false
                });
            } else {
                throw new Error(result.message || '获取数据失败');
            }
        } catch (error) {
            console.error('🎯 [GambleResult] 获取结果失败:', error);
            this.setData({
                error: error.message || '获取数据失败',
                loading: false
            });
        }
    },

    // 返回游戏详情
    onBackToGame() {
        console.log('🎯 [GambleResult] 返回游戏详情');
        wx.navigateBack();
    }
}); 