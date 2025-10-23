Page({
    data: {
        gameid: null,
        webviewUrl: 'https://qiaoyincapital.com/v3/index.php/ScoreCard?gameid=',
        showWebView: true
    },

    onLoad(options) {
        const gameid = options?.gameid;
        console.log('📊 [Scorecard] 页面加载', { gameid });

        // 动态构建webview URL
        const finalWebviewUrl = `${this.data.webviewUrl}${gameid || ''}`;

        this.setData({
            gameid: gameid || '未获取到gameId',
            webviewUrl: finalWebviewUrl
        });

        console.log('📊 [Scorecard] 最终WebView URL:', finalWebviewUrl);

        // 监听屏幕旋转变化
        wx.onDeviceMotionChange(this.onDeviceMotionChange);
    },

    onShow() {
        console.log('📊 [Scorecard] 页面显示');

        // 强制设置为横屏(检查API是否存在以兼容开发者工具)
        if (wx.setDeviceOrientation) {
            wx.setDeviceOrientation({
                orientation: 'landscape',
                success: () => {
                    console.log('📊 [Scorecard] 成功设置为横屏模式');
                },
                fail: (err) => {
                    console.log('📊 [Scorecard] 设置横屏失败', err);
                }
            });
        } else {
            console.warn('⚠️ [Scorecard] wx.setDeviceOrientation API 在当前环境不可用(可能是在开发者工具中)');
        }
    },

    onReady() {
        wx.setNavigationBarTitle({
            title: '成绩卡'
        });
    },

    onUnload() {
        // 页面卸载时取消监听
        wx.offDeviceMotionChange(this.onDeviceMotionChange);

        // 主动销毁webview，释放资源
        this.setData({
            showWebView: false,
            webviewUrl: ''
        });

        console.log('📊 [Scorecard] 页面卸载，webview已销毁');
    },

    // 设备方向变化监听
    onDeviceMotionChange(res) {
        console.log('📊 [Scorecard] 设备方向变化', res);
    },

    // WebView加载完成
    onWebViewLoad(e) {
        console.log('📊 [Scorecard] WebView加载完成', e);
        wx.showToast({
            title: 'WebView加载成功',
            icon: 'success',
            duration: 2000
        });
    },

    // WebView加载错误
    onWebViewError(e) {
        console.error('📊 [Scorecard] WebView加载错误', e);
        wx.showToast({
            title: 'WebView加载失败',
            icon: 'error',
            duration: 3000
        });

        // 如果加载失败, 隐藏WebView
        this.setData({
            showWebView: false
        });
    },

    // 接收WebView消息
    onWebViewMessage(e) {
        console.log('📊 [Scorecard] 收到WebView消息', e);
        const messages = e.detail?.data || [];
        // 修复linter错误:使用for...of替代forEach
        for (const msg of messages) {
            console.log('📊 [Scorecard] WebView消息内容', msg);
        }
    }
});