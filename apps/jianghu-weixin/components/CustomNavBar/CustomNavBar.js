Component({
    properties: {
        title: {
            type: String,
            value: '比赛详情'
        },
        backUrl: {
            type: String,
            value: '' // 返回时要跳转的URL，如果为空则使用默认返回
        }
    },

    data: {
        statusBarHeight: 0,
        navBarHeight: 44
    },

    lifetimes: {
        attached() {
            // 获取系统信息，计算导航栏高度
            const systemInfo = wx.getSystemInfoSync();
            this.setData({
                statusBarHeight: systemInfo.statusBarHeight || 0
            });
        }
    },

    methods: {
        onBack() {
            if (this.properties.backUrl) {
                // 如果有自定义返回URL，跳转到指定页面
                const backUrl = this.properties.backUrl;

                // 检查是否是 Tab 页面
                const tabPages = [
                    'pages/live/live',
                    'pages/events/events',
                    'pages/createGame/createGame',
                    'pages/community/community',
                    'pages/mine/mine'
                ];

                const targetPath = backUrl.split('?')[0];
                const isTabPage = tabPages.some(page => targetPath.includes(page));

                if (isTabPage) {
                    // Tab 页面使用 switchTab
                    wx.switchTab({
                        url: backUrl,
                        fail: (err) => {
                            console.error('[CustomNavBar] switchTab 失败:', err);
                            // 失败时使用默认返回
                            wx.navigateBack();
                        }
                    });
                } else {
                    // 非 Tab 页面使用 redirectTo
                    wx.redirectTo({
                        url: backUrl,
                        fail: (err) => {
                            console.error('[CustomNavBar] redirectTo 失败:', err);
                            // 失败时使用默认返回
                            wx.navigateBack();
                        }
                    });
                }
            } else {
                // 默认返回
                wx.navigateBack();
            }
        }
    }
});

