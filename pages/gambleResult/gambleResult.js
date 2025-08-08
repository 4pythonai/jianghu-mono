Page({
    data: {
        // 页面参数
        gameid: '',
        gambleid: '',
        gambleSysName: '',
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

        const gambleid = options.gambleid;

        // 构建webview URL
        const webviewUrl = `https://qiaoyincapital.com/v3/index.php/Audit/index?gambleid=${gambleid}`;

        // 解析页面参数
        this.setData({
            gameid: options.gameid || '',
            gambleid: gambleid,
            gambleSysName: options.gambleSysName || '',
            userRuleName: options.userRuleName || '',
            firstHole: Number.parseInt(options.firstHole) || 1,
            lastHole: Number.parseInt(options.lastHole) || 18,
            playerCount: Number.parseInt(options.playerCount) || 0,
            webviewUrl: webviewUrl,
            loading: false // webview不需要加载状态
        });

        console.log('🎯 [GambleResult] webview URL:', webviewUrl);
    },



    // 返回游戏详情
    onBackToGame() {
        console.log('🎯 [GambleResult] 返回游戏详情');
        wx.navigateBack();
    }
}); 