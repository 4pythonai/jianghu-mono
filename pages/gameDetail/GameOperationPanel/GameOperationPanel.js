Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        isVisible: false // 控制面板显示/隐藏
    },

    /**
     * 组件的方法列表
     */
    methods: {
        // 显示面板
        show(options = {}) {
            console.log('🎮 [GameOperationPanel] 显示面板', options);
            this.setData({
                isVisible: true,
                ...options
            });
        },

        // 隐藏面板
        hide() {
            console.log('🎮 [GameOperationPanel] 隐藏面板');
            this.setData({
                isVisible: false
            });
        },

        // 阻止冒泡
        stopPropagation() {
            // 空函数，用于阻止点击面板内容时关闭弹窗
        },

        // 功能选项点击
        onOptionClick(e) {
            const option = e.currentTarget.dataset.option;
            console.log('🎮 [GameOperationPanel] 点击功能选项:', option);

            // 处理取消比赛
            if (option === 'cancel') {
                this.hide();
                wx.showModal({
                    title: '确认取消',
                    content: '确定要取消这场比赛吗？',
                    success: (res) => {
                        if (res.confirm) {
                            this.triggerEvent('cancelgame', {});
                            wx.showToast({
                                title: '取消比赛功能开发中',
                                icon: 'none'
                            });
                        }
                    }
                });
                return;
            }

            // 处理结束比赛
            if (option === 'finish') {
                this.hide();
                wx.showModal({
                    title: '确认结束',
                    content: '确定要结束这场比赛吗？',
                    success: (res) => {
                        if (res.confirm) {
                            this.triggerEvent('finishgame', {});
                            wx.showToast({
                                title: '结束比赛功能开发中',
                                icon: 'none'
                            });
                        }
                    }
                });
                return;
            }

            // 隐藏面板
            this.hide();

            // 触发自定义事件，传递选项类型
            this.triggerEvent('optionclick', { option });

            // 根据选项显示不同的提示
            const optionNames = {
                edit: '修改',
                qrcode: '比赛码',
                scorecard: '成绩卡',
                poster: '海报',
                feedback: '反馈',
                style: '风格',
                account: '账本'
            };

            wx.showToast({
                title: `${optionNames[option]}功能开发中`,
                icon: 'none'
            });
        }
    }
}) 