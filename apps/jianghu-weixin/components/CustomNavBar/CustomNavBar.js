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
                wx.redirectTo({
                    url: this.properties.backUrl,
                    fail: (err) => {
                        console.error('[CustomNavBar] 跳转失败:', err);
                        // 失败时使用默认返回
                        wx.navigateBack();
                    }
                });
            } else {
                // 默认返回
                wx.navigateBack();
            }
        }
    }
});

