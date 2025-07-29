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
        },
        players: {
            type: Array,
            value: []
        }
    },

    data: {
        totalAmount: '0',
        gameStatus: '进行中',
        gambleResults: [],
        loading: false
    },

    lifetimes: {
        attached() {
            console.log('[GambleSummary] 组件加载');
            console.log('[GambleSummary] 接收到的属性:', {
                gameId: this.properties.gameId,
                groupId: this.properties.groupId,
                playersCount: this.properties.players?.length
            });

            // 组件加载时获取赌博汇总数据
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
        },
        'players': (players) => {
            console.log('[GambleSummary] players 属性变化:', players?.length);
        }
    },

    methods: {
        /**
         * 获取赌博汇总数据
         */
        async fetchGambleSummary() {
            const { gameId, groupId } = this.properties;

            if (!gameId || !groupId) {
                console.log('[GambleSummary] gameId 或 groupId 为空，跳过API调用');
                return;
            }

            console.log('[GambleSummary] 开始获取赌博汇总数据:', { gameId, groupId });

            this.setData({ loading: true });

            try {
                // 调用API获取赌博汇总数据
                const result = await this.callGambleSummaryAPI(gameId, groupId);

                console.log('[GambleSummary] API调用成功，返回数据:', result.gambleResults);

                // 保存数据到组件状态
                this.setData({
                    gambleResults: result.gambleResults,
                    loading: false
                });

                // 处理数据，提取关键信息
                this.processGambleSummaryData(result.gambleResults);

            } catch (error) {
                console.error('[GambleSummary] API调用失败:', error);
                this.setData({ loading: false });

                wx.showToast({
                    title: '获取数据失败',
                    icon: 'none'
                });
            }
        },

        /**
         * 调用赌博汇总API
         */
        callGambleSummaryAPI(gameId, groupId) {
            return new Promise((resolve, reject) => {
                // 使用正确的API调用方式
                gamble.getGambleSummary({
                    gameId: gameId,
                    groupId: groupId
                }).then(res => {
                    console.log('[GambleSummary] API原始响应:', res);
                    resolve(res);
                }).catch(err => {
                    console.error('[GambleSummary] API调用错误:', err);
                    reject(err);
                });
            });
        },

        /**
         * 处理赌博汇总数据
         */
        processGambleSummaryData(data) {
            console.log('[GambleSummary] 开始处理数据...');
        },

        /**
         * 导航栏图标按钮点击事件
         */
        onIconClick() {
            console.log('[GambleSummary] 图标按钮被点击 - 跳转到RuntimeConfigList');

            // 使用传入的属性
            const gameId = this.properties.gameId;
            const groupId = this.properties.groupId;
            const players = this.properties.players || [];

            console.log('[GambleSummary] 准备跳转，数据:', {
                gameId,
                groupId,
                playersCount: players.length
            });

            if (!gameId) {
                wx.showToast({
                    title: '游戏数据获取失败',
                    icon: 'none'
                });
                return;
            }

            // 跳转到RuntimeConfigList页面
            wx.navigateTo({
                url: `/pages/gameDetail/RuntimeConfigList/RuntimeConfigList?gameId=${gameId}&groupId=${groupId}&players=${JSON.stringify(players)}`,
                success: () => {
                    console.log('[GambleSummary] 跳转成功');
                },
                fail: (err) => {
                    console.error('[GambleSummary] 跳转失败:', err);
                    wx.showToast({
                        title: '跳转失败',
                        icon: 'none'
                    });
                }
            });
        },

        /**
         * 刷新方法 - 供父组件调用
         */
        refresh() {
            console.log('[GambleSummary] 组件刷新');
            this.fetchGambleSummary();
        }
    }
});