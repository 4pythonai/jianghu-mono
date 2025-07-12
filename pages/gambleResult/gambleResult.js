Page({
    data: {
        // 页面参数
        gameId: '',
        configId: '',
        ruleType: '',
        userRuleName: '',
        firstHole: 1,
        lastHole: 18,
        playerCount: 0,

        // 页面状态
        loading: true,
        error: null,

        // 赌球结果数据
        resultData: null
    },

    onLoad(options) {
        console.log('🎯 [GambleResult] 页面加载，参数:', options);

        // 解析页面参数
        this.setData({
            gameId: options.gameId || '',
            configId: options.configId || '',
            ruleType: options.ruleType || '',
            userRuleName: options.userRuleName || '',
            firstHole: Number.parseInt(options.firstHole) || 1,
            lastHole: Number.parseInt(options.lastHole) || 18,
            playerCount: Number.parseInt(options.playerCount) || 0
        });

        // 加载赌球结果数据
        this.loadGambleResult();
    },

    onShow() {
        console.log('🎯 [GambleResult] 页面显示');
    },

    // 加载赌球结果数据
    loadGambleResult() {
        const { gameId, configId } = this.data;

        console.log('🎯 [GambleResult] 开始加载赌球结果数据:', { gameId, configId });

        this.setData({
            loading: true,
            error: null
        });

        // TODO: 调用API获取赌球结果数据
        // 这里暂时使用模拟数据
        setTimeout(() => {
            const mockResultData = {
                configInfo: {
                    ruleType: this.data.ruleType,
                    userRuleName: this.data.userRuleName,
                    holeRange: `第${this.data.firstHole}洞 - 第${this.data.lastHole}洞`,
                    playerCount: this.data.playerCount
                },
                results: [
                    { playerId: 1, playerName: '张三', score: 85, ranking: 1, winAmount: 100 },
                    { playerId: 2, playerName: '李四', score: 88, ranking: 2, winAmount: 50 },
                    { playerId: 3, playerName: '王五', score: 92, ranking: 3, winAmount: 0 },
                    { playerId: 4, playerName: '赵六', score: 95, ranking: 4, winAmount: -50 }
                ],
                totalAmount: 100,
                gameStatus: 'completed',
                updateTime: new Date().toISOString()
            };

            this.setData({
                loading: false,
                resultData: mockResultData
            });

            console.log('🎯 [GambleResult] 赌球结果数据加载完成:', mockResultData);
        }, 1000);
    },

    // 重试加载
    retryLoad() {
        console.log('🎯 [GambleResult] 重试加载');
        this.loadGambleResult();
    },

    // 分享结果
    onShareResult() {
        console.log('🎯 [GambleResult] 分享结果');
        wx.showToast({
            title: '分享功能开发中',
            icon: 'none'
        });
    },

    // 返回游戏详情
    onBackToGame() {
        console.log('🎯 [GambleResult] 返回游戏详情');
        wx.navigateBack();
    }
}); 