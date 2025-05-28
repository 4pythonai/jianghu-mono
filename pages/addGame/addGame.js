// addGame.js
Page({
    data: {
        isMenuOpen: false, // 默认关闭菜单
        animation: null
    },

    onLoad: function () {
        // 页面加载时自动显示菜单
    },

    // 处理菜单项点击
    handleMenuClick: function (e) {
        const type = e.currentTarget.dataset.type;
        const animation = wx.createAnimation({
            duration: 500,
            timingFunction: 'ease',
        });

        // 创建果冻效果动画
        animation.scale(0.85).step();
        animation.scale(1.1).step();
        animation.scale(0.9).step();
        animation.scale(1.05).step();
        animation.scale(0.95).step();
        animation.scale(1).step();

        // 更新动画数据
        this.setData({
            animation: animation.export()
        });

        // 根据不同的菜单项执行不同的操作
        switch (type) {
            case 'playground':
                wx.navigateTo({
                    url: '/pages/playground/playground'
                });
                break;
            case 'commonCreate':
                wx.navigateTo({
                    url: '/pages/commonCreate/commonCreate'
                });
                break;
            case 'quickCreate':
                wx.navigateTo({
                    url: '/pages/quickCreate/quickCreate'
                });
                break;
            case 'moreCreate':
                wx.navigateTo({
                    url: '/pages/moreCreate/moreCreate'
                });
                break;
        }

        // 点击后关闭菜单
        this.setData({
            isMenuOpen: false
        });
    },

    // 切换菜单显示状态
    toggleMenu: function () {
        this.setData({
            isMenuOpen: !this.data.isMenuOpen
        });
    }
})