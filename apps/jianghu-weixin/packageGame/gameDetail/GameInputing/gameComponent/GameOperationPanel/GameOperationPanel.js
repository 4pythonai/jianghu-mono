import gameApi from '@/api/modules/game'

Component({

    /**
     * 组件的初始数据
     */
    data: {
        isOperatonPanelVisible: false, // 控制面板显示/隐藏
        gameid: null,     // 游戏ID
    },

    /**
     * 组件的生命周期
     */
    lifetimes: {
        // 组件被挂载时，确保面板是隐藏状态
        attached() {
            this.setData({
                isOperatonPanelVisible: false
            });
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        // 显示面板
        show(options = {}) {
            console.log('🎮 [GameOperationPanel] 显示面板', options);
            this.setData({
                isOperatonPanelVisible: true,
                ...options
            });
        },

        // 隐藏面板
        hide() {
            console.log('🎮 [GameOperationPanel] 隐藏面板');
            this.setData({
                isOperatonPanelVisible: false
            });
        },

        // 阻止冒泡
        stopPropagation() {
            // 空函数, 用于阻止点击面板内容时关闭弹窗
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
                    success: async (res) => {
                        if (res.confirm) {
                            try {
                                // 调用取消比赛API
                                const result = await gameApi.cancelGame({
                                    gameid: this.data.gameid
                                }, {
                                    loadingTitle: '取消比赛中...',
                                    loadingMask: true
                                });

                                if (result?.code === 200) {
                                    wx.showToast({
                                        title: '比赛已取消',
                                        icon: 'success'
                                    });
                                    this.triggerEvent('cancelgame', {});
                                } else {
                                    wx.showToast({
                                        title: result?.msg || '取消失败',
                                        icon: 'error'
                                    });
                                }
                            } catch (error) {
                                console.error('❌ 取消比赛失败:', error);
                                wx.showToast({
                                    title: '取消失败, 请重试',
                                    icon: 'error'
                                });
                            }
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
                    success: async (res) => {
                        if (res.confirm) {
                            try {
                                // 调用结束比赛API
                                const result = await gameApi.finishGame({
                                    gameid: this.data.gameid
                                }, {
                                    loadingTitle: '结束比赛中...',
                                    loadingMask: true
                                });

                                if (result?.code === 200) {
                                    wx.showToast({
                                        title: '比赛已结束',
                                        icon: 'success'
                                    });
                                    this.triggerEvent('finishgame', {});
                                } else {
                                    wx.showToast({
                                        title: result?.msg || '结束失败',
                                        icon: 'error'
                                    });
                                }
                            } catch (error) {
                                console.error('❌ 结束比赛失败:', error);
                                wx.showToast({
                                    title: '结束失败, 请重试',
                                    icon: 'error'
                                });
                            }
                        }
                    }
                });
                return;
            }

            // 处理页面跳转的选项
            const pageRoutes = {
                feedback: '/packageGame/gameOperation/feedback/feedback',
                scorecard: '/packageGame/gameOperation/scorecard/scorecard',
                poster: '/packageGame/gameOperation/poster/poster',
                account: '/packageGame/gameOperation/personalBilingBook/personalBilingBook',
                style: '/packageGame/gameOperation/socreStyle/socreStyle'
            };

            if (pageRoutes[option]) {
                // 隐藏面板
                this.hide();

                // 跳转到对应页面并传递gameId
                wx.navigateTo({
                    url: `${pageRoutes[option]}?gameid=${this.data.gameid}`,
                    success: () => {
                        console.log(`🎮 [GameOperationPanel] 成功跳转到${option}页面`);
                    },
                    fail: (err) => {
                        wx.showToast({
                            title: '页面跳转失败',
                            icon: 'error'
                        });
                    }
                });
                return;
            }

            // 隐藏面板
            this.hide();

            // 触发自定义事件, 传递选项类型
            this.triggerEvent('optionclick', { option });

            // 显示其他功能开发中提示
            wx.showToast({
                title: '功能开发中',
                icon: 'none'
            });
        },
        onCancelGame(e) {
            console.log('📊 [GameOperationPanel] 取消比赛被触发');
            // TODO: 实现取消比赛功能
        },
        onFinishGame(e) {
            console.log('📊 [GameOperationPanel] 结束比赛被触发');
            // TODO: 实现结束比赛功能
        }
    }
}) 