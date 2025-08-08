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
        onIconClick() {
            const gameid = this.properties.gameid;
            const groupid = this.properties.groupid;
            wx.navigateTo({
                url: `/pages/gameDetail/RuntimeConfigList/RuntimeConfigList?gameid=${gameid}&groupid=${groupid}`,
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