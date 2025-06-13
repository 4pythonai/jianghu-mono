// addGame.js
Page({
    data: {
        isMenuOpen: false, // 默认关闭菜单
        animations: {
            point1: null,
            point2: null,
            point3: null,
        }
    },

    onLoad: function () {
        // 页面加载时自动显示菜单
        this.toggleMenu();
    },

    // 处理菜单项点击
    handleMenuClick(e) {
        const { type } = e.currentTarget.dataset;
        let url = '';

        switch (type) {
            case 'moreCreate':
                url = '/pages/addGame/moreCreate/moreCreate';
                break;
            case 'commonCreate':
                url = '/pages/addGame/commonCreate/commonCreate';
                break;
            case 'quickCreate':
                url = '/pages/addGame/quickCreate/quickCreate';
                break;
        }

        if (url) {
            wx.navigateTo({
                url
            });
        }
    },

    // 切换菜单显示状态
    toggleMenu() {
        const isOpen = !this.data.isMenuOpen;

        if (isOpen) {
            // 展开菜单时的卫星动画
            const points = ['point1', 'point2', 'point3'];
            for (const [index, point] of points.entries()) {
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
            }
        } else {
            // 关闭菜单时恢复初始状态
            const resetAnim = wx.createAnimation({ duration: 0 });
            resetAnim.scale(1).opacity(1).step();

            const points = ['point1', 'point2', 'point3'];
            for (const point of points) {
                this.setData({
                    [`animations.${point}`]: resetAnim.export()
                });
            }
        }

        this.setData({
            isMenuOpen: isOpen
        });
    },

    handleBack() {
        wx.navigateBack({
            delta: 1
        });
    }
});