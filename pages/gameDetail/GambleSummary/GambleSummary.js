import gamble from '../../../api/modules/gamble.js'

Component({
    properties: {
        gameId: {
            type: String,
            value: ''
        },
        groupId: {
            type: String,
            value: ''
        }
    },

    data: {
        SummaryResult: {},
        gambleResults: [],
        loading: false
    },

    lifetimes: {
        attached() {
            this.fetchGambleSummary();
        }
    },

    observers: {
        'gameId': function (gameId) {
            console.log('[GambleSummary] gameId 属性变化:', gameId);
            if (gameId) {
                this.fetchGambleSummary();
            }
        },
        'groupId': function (groupId) {
            console.log('[GambleSummary] groupId 属性变化:', groupId);
            if (groupId) {
                this.fetchGambleSummary();
            }
        }
    },

    methods: {
        /**
         * 获取赌博汇总数据
         */
        async fetchGambleSummary() {
            const { gameId, groupId } = this.properties;

            if (!gameId || !groupId) {
                return;
            }
            this.setData({ loading: true });
            // 调用API获取赌博汇总数据
            const result = await gamble.getGambleSummary({
                gameId: gameId,
                groupId: groupId
            });

            // 直接设置数据
            this.setData({
                SummaryResult: result.summaryResult,
                gambleResults: result.gambleResults,
                loading: false
            });
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
            const gameId = this.properties.gameId;
            const groupId = this.properties.groupId;
            wx.navigateTo({
                url: `/pages/gameDetail/RuntimeConfigList/RuntimeConfigList?gameId=${gameId}&groupId=${groupId}`,
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