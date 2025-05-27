// addGame.js
Page({
    data: {
        isMenuOpen: true // 默认打开菜单
    },

    onLoad: function () {
        // 页面加载时自动显示菜单
    },

    // 处理菜单项点击
    handleMenuClick: function (e) {
        const type = e.currentTarget.dataset.type;
        console.log('点击了菜单项:', type);

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