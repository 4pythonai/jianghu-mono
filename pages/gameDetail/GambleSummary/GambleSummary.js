import gamble from '../../../api/modules/gamble.js'

Component({
    properties: {
        gameid: {
            type: String,
            value: ''
        },
        groupid: {
            type: String,
            value: ''
        }
    },

    data: {
        SummaryResult: {},
        gambleResults: [],
        loading: false,
        lastFetchParams: null  // 记录上次请求的参数，避免重复请求
    },

    lifetimes: {
        attached() {
            // 只有在属性已经设置的情况下才执行
            const { gameid, groupid } = this.properties;
            if (gameid && groupid) {
                this.fetchGambleSummary();
            }
        }
    },

    observers: {
        'gameid': function (gameid) {
            console.log('[GambleSummary] gameid 属性变化:', gameid);
            if (gameid) {
                this.fetchGambleSummary();
            }
        },
        'groupid': function (groupid) {
            console.log('[GambleSummary] groupid 属性变化:', groupid);
            if (groupid) {
                this.fetchGambleSummary();
            }
        }
    },

    methods: {
        /**
         * 获取赌博汇总数据
         */
        async fetchGambleSummary() {
            const { gameid, groupid } = this.properties;

            if (!gameid || !groupid) {
                return;
            }

            // 检查是否与上次请求参数相同，避免重复请求
            const currentParams = `${gameid}-${groupid}`;
            if (this.data.lastFetchParams === currentParams && this.data.loading) {
                console.log('[GambleSummary] 避免重复请求，参数相同:', currentParams);
                return;
            }

            console.log('[GambleSummary] 开始请求数据:', { gameid, groupid });
            this.setData({
                loading: true,
                lastFetchParams: currentParams
            });

            try {
                // 调用API获取赌博汇总数据
                const result = await gamble.getGambleSummary({
                    gameid: gameid,
                    groupid: groupid
                });

                // 直接设置数据
                this.setData({
                    SummaryResult: result.summaryResult,
                    gambleResults: result.gambleResults,
                    loading: false
                });
            } catch (error) {
                console.error('[GambleSummary] 请求失败:', error);
                this.setData({ loading: false });
            }
        },


        handleAddGame() {
            // 跳转到游戏规则页面
            wx.navigateTo({
                url: '/pages/rules/rules',
                success: () => {
                    console.log('🎮 成功跳转到游戏规则页面');
                }
            });
        },





        /**
         * 导航栏图标按钮点击事件
         */
        gotoRuntimeConfigList() {
            const gameid = this.properties.gameid;
            const groupid = this.properties.groupid;

            // 检查参数
            if (!gameid || !groupid) {
                wx.showToast({
                    title: '缺少必要参数',
                    icon: 'none'
                });
                return;
            }

            // 尝试跳转，添加错误处理
            wx.navigateTo({
                url: `/pages/gameDetail/RuntimeConfigList/RuntimeConfigList?gameid=${gameid}&groupid=${groupid}`,
                success: () => {
                    console.log('[GambleSummary] 成功跳转到配置列表页面');
                },
                fail: (error) => {
                    console.error('[GambleSummary] 跳转失败:', error);

                    // 检查错误类型并智能处理
                    if (error.errMsg) {
                        if (error.errMsg.includes('webview count limit exceed')) {
                            // webview数量超限，提示用户关闭其他页面
                            wx.showModal({
                                title: '提示',
                                content: '检测到webview数量超限，建议关闭记分卡或结果页面后再试',
                                showCancel: false,
                                success: () => {
                                    // 尝试使用redirectTo作为备选方案
                                    wx.redirectTo({
                                        url: `/pages/gameDetail/RuntimeConfigList/RuntimeConfigList?gameid=${gameid}&groupid=${groupid}`,
                                        fail: (redirectError) => {
                                            console.error('[GambleSummary] redirectTo 也失败了:', redirectError);
                                            wx.showToast({
                                                title: '跳转失败，请关闭其他页面后重试',
                                                icon: 'none'
                                            });
                                        }
                                    });
                                }
                            });
                        } else if (error.errMsg.includes('page stack limit exceeded')) {
                            // 页面栈溢出，使用redirectTo
                            wx.showModal({
                                title: '提示',
                                content: '页面层级过深，将重新打开配置列表页面',
                                showCancel: false,
                                success: () => {
                                    wx.redirectTo({
                                        url: `/pages/gameDetail/RuntimeConfigList/RuntimeConfigList?gameid=${gameid}&groupid=${groupid}`,
                                        fail: (redirectError) => {
                                            console.error('[GambleSummary] redirectTo 也失败了:', redirectError);
                                            wx.showToast({
                                                title: '跳转失败，请重试',
                                                icon: 'none'
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            // 其他错误
                            wx.showToast({
                                title: '跳转失败，请重试',
                                icon: 'none'
                            });
                        }
                    } else {
                        wx.showToast({
                            title: '跳转失败，请重试',
                            icon: 'none'
                        });
                    }
                }
            });
        },

        /**
         * 刷新方法 - 供父组件调用
         */
        refresh() {
            this.fetchGambleSummary();
        }
    }
});