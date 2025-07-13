Page({
    data: {
        // 页面参数
        gameId: '',
        gambleid: '',
        ruleType: '',
        userRuleName: '',
        firstHole: 1,
        lastHole: 18,
        playerCount: 0,

        // webview URL
        webviewUrl: '',

        // 页面状态
        loading: true,
        error: null
    },

    onLoad(options) {
        console.log('🎯 [GambleResult] 页面加载，参数:', options);

        const gambleid = options.gambleid;

        // 构建webview URL
        const webviewUrl = `https://qiaoyincapital.com/v3/index.php/Audit/index?gambleid=${gambleid}`;

        // 解析页面参数
        this.setData({
            gameId: options.gameId || '',
            gambleid: gambleid,
            ruleType: options.ruleType || '',
            userRuleName: options.userRuleName || '',
            firstHole: Number.parseInt(options.firstHole) || 1,
            lastHole: Number.parseInt(options.lastHole) || 18,
            playerCount: Number.parseInt(options.playerCount) || 0,
            webviewUrl: webviewUrl,
            loading: false // webview不需要加载状态
        });

        console.log('🎯 [GambleResult] webview URL:', webviewUrl);
    },

    onShow() {
        console.log('🎯 [GambleResult] 页面显示');
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