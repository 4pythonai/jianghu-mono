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

                // 添加API返回数据的调试日志
                console.log('🔍 [GambleSummary] API返回的原始数据:', result);
                console.log('🔍 [GambleSummary] result的类型:', typeof result);
                console.log('🔍 [GambleSummary] result的键:', Object.keys(result || {}));

                // 直接设置数据
                this.setData({
                    SummaryResult: result.SummaryResult,
                    gambleResults: result.gambleResults,
                    loading: false
                });

                // 添加调试日志
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
            wx.navigateTo({
                url: `/pages/gameDetail/RuntimeConfigList/RuntimeConfigList?gameid=${gameid}&groupid=${groupid}`,
                success: () => {
                    console.log('[GambleSummary] 成功跳转到配置列表页面');
                },
                fail: (error) => {
                    console.error('[GambleSummary] 跳转失败:', error);
                    wx.showToast({
                        title: '跳转失败，请重试',
                        icon: 'none'
                    });
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