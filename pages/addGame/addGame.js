// addGame.js
Page({
    data: {
        isMenuOpen: false, // 默认关闭菜单
        animations: {
            point1: null,
            point2: null,
            point3: null,
            point4: null
        }
    },

    onLoad: function () {
        // 页面加载时自动显示菜单
    },

    // 处理菜单项点击
    handleMenuClick(e) {
        const type = e.currentTarget.dataset.type;
        const pointId = e.currentTarget.dataset.point;
        const animation = wx.createAnimation({
            duration: 100,
            timingFunction: 'ease',
        });

        // 创建果冻效果动画，只使用scale
        animation.scale(0.85).step();
        animation.scale(1.1).step();
        animation.scale(0.9).step();
        animation.scale(1.05).step();
        animation.scale(0.95).step();
        animation.scale(1).step();

        // 使用路径语法更新特定点的动画数据
        this.setData({
            [`animations.${pointId}`]: animation.export()
        });

        // 根据type处理不同的菜单点击事件
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
    toggleMenu() {
        this.setData({
            isMenuOpen: !this.data.isMenuOpen
        });
    }
});