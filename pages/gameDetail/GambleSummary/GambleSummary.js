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
        // 模拟表格数据
        tableData: [
            { player: '张三', hole: '3号洞', multiplier: 2 },
            { player: '李四', hole: '4号洞', multiplier: 3 },
            { player: '王五', hole: '5号洞', multiplier: 1 },
            { player: '赵六', hole: '6号洞', multiplier: 4 }
        ],
        // 汇总信息
        summary: {
            totalPlayers: 4,
            totalHoles: 4,
            averageMultiplier: 2.5
        }
    },

    lifetimes: {
        attached() {
            console.log('[GambleSummary] 组件加载');
            console.log('[GambleSummary] 接收到的属性:', {
                gameId: this.properties.gameId,
                playersCount: this.properties.players?.length
            });
        }
    },

    observers: {
        'gameId': function (gameId) {
            console.log('[GambleSummary] gameId 属性变化:', gameId);
        },
        'players': function (players) {
            console.log('[GambleSummary] players 属性变化:', players?.length);
        }
    },

    methods: {

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
         * 处理分享
         */
        handleShare() {
            console.log('[GambleSummary] 处理分享');
            wx.showToast({
                title: '分享功能开发中',
                icon: 'none'
            });
        },

        /**
         * 处理设置
         */
        handleSettings() {
            console.log('[GambleSummary] 处理设置');
            wx.showToast({
                title: '设置功能开发中',
                icon: 'none'
            });
        },

        /**
         * 处理帮助
         */
        handleHelp() {
            console.log('[GambleSummary] 处理帮助');
            wx.showToast({
                title: '帮助功能开发中',
                icon: 'none'
            });
        },

        /**
         * 刷新方法 - 供父组件调用
         */
        refresh() {
            console.log('[GambleSummary] 组件刷新');
            // 这里可以添加刷新逻辑
        }
    }
});