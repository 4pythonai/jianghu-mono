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
        this.toggleMenu();
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
        const isOpen = !this.data.isMenuOpen;

        if (isOpen) {
            // 展开菜单时的卫星动画
            const points = ['point1', 'point2', 'point3', 'point4'];
            points.forEach((point, index) => {
                const animation = wx.createAnimation({
                    duration: 300,
                    timingFunction: 'ease-out',
                    delay: index * 80  // 每个菜单项延迟80ms
                });

                // 从中心弹出效果
                animation.scale(0).opacity(0).step();
                animation.scale(1).opacity(1).step();

                this.setData({
                    [`animations.${point}`]: animation.export()
                });
            });
        } else {
            // 关闭菜单时恢复初始状态
            const resetAnim = wx.createAnimation({ duration: 0 });
            resetAnim.scale(1).opacity(1).step();

            ['point1', 'point2', 'point3', 'point4'].forEach(point => {
                this.setData({
                    [`animations.${point}`]: resetAnim.export()
                });
            });
        }

        this.setData({
            isMenuOpen: isOpen
        });
    }
});