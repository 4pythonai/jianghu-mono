Page({
    data: {
        gameId: null,
        webviewUrl: 'https://qiaoyincapital.com/index.html',
        showWebView: true
    },

    onLoad(options) {
        const gameId = options?.gameId;
        console.log('📊 [Scorecard] 页面加载', { gameId });

        this.setData({
            gameId: gameId || '未获取到gameId'
        });

        // 监听屏幕旋转变化
        wx.onDeviceMotionChange(this.onDeviceMotionChange);
    },

    onShow() {
        console.log('📊 [Scorecard] 页面显示');

        // 强制设置为横屏
        wx.setDeviceOrientation({
            orientation: 'landscape',
            success: () => {
                console.log('📊 [Scorecard] 成功设置为横屏模式');
            },
            fail: (err) => {
                console.log('📊 [Scorecard] 设置横屏失败', err);
            }
        });
    },

    onReady() {
        wx.setNavigationBarTitle({
            title: '成绩卡'
        });
    },

    onUnload() {
        // 页面卸载时取消监听
        wx.offDeviceMotionChange(this.onDeviceMotionChange);
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

        // 如果加载失败，显示备用内容
        this.setData({
            showWebView: false
        });
    },

    // 接收WebView消息
    onWebViewMessage(e) {
        console.log('📊 [Scorecard] 收到WebView消息', e);
        const messages = e.detail?.data || [];
        messages.forEach(msg => {
            console.log('📊 [Scorecard] WebView消息内容', msg);
        });
    }
});