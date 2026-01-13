const app = getApp()

// 我的规则组件

Component({
    properties: {
        // 是否显示该组件
        show: {
            type: Boolean,
            value: false
        }
    },

    data: {
        // 我的规则列表, 按人数分组
        myRules: {
            twoPlayers: [],
            threePlayers: [],
            fourPlayers: []
        },
        // 统计信息
        total: {
            twoPlayers: 0,
            threePlayers: 0,
            fourPlayers: 0,
            overall: 0
        },
        // 加载状态
        loading: false
    },

    lifetimes: {
        attached() {
            // 组件挂载时自动加载数据
            this.loadMyRules();
        }
    },

    observers: {
        // 监听show属性变化
        'show': function (show) {
            console.log('📋 [MyRules] show状态变化:', show);
            if (show) {
                this.loadMyRules();
            }
        }
    },

    methods: {
        // 加载我的规则列表
        async loadMyRules() {
            this.setData({ loading: true });
            const res = await app.api.gamble.getUserGambleRules();
            if (res.code === 200 && res.userRules) {


                // 直接使用API返回的数据
                const myRules = {
                    twoPlayers: res.userRules.twoPlayers || [],
                    threePlayers: res.userRules.threePlayers || [],
                    fourPlayers: res.userRules.fourPlayers || []
                };

                // 计算统计信息
                const total = {
                    twoPlayers: myRules.twoPlayers.length,
                    threePlayers: myRules.threePlayers.length,
                    fourPlayers: myRules.fourPlayers.length,
                    overall: myRules.twoPlayers.length + myRules.threePlayers.length + myRules.fourPlayers.length
                };

                this.setData({
                    myRules,
                    total,
                    loading: false
                });
            }
        },


        // 刷新规则列表
        refreshRules() {
            console.log('📋 [MyRules] 刷新规则列表');
            this.loadMyRules();
        },

        // 长按规则处理
        onLongPressRule(e) {
            const { id, item } = e.detail || e.currentTarget.dataset;
            wx.showModal({
                title: '确认删除',
                content: `确定要删除规则"${item.gambleUserName}"吗？`,
                success: (res) => {
                    if (res.confirm) {
                        this.deleteRule(id);
                    }
                }
            });
        },

        // 删除规则的实际执行方法
        async deleteRule(id) {
            const res = await app.api.gamble.deleteGambleRule({ userRuleId: id });
            if (res.code === 200) {
                this.loadMyRules();
                wx.showToast({
                    title: '删除成功',
                    icon: 'success'
                });
                this.loadMyRules();
            }
        },

        // 编辑规则
        onEditRule(e) {
            const { item } = e.detail || e.currentTarget.dataset;
            console.log('🔄 [MyRules] 编辑规则:', item);
            const { gambleSysName } = item;
            const encodedRuleData = encodeURIComponent(JSON.stringify(item));
            wx.navigateTo({ url: `/packageGamble/rules/RuleEditer/RuleEditer?pageMode=edit&ruleId=${item.userRuleId}&ruleData=${encodedRuleData}&gambleType=${gambleSysName}` });
        },

        // 查看规则详情 - 跳转到运行时配置页面
        onCreateGamble(e) {
            const { item, minPlayerCount } = e.detail || e.currentTarget.dataset;
            const { gameStore } = require('@/stores/game/gameStore');
            const { holeRangeStore } = require('@/stores/game/holeRangeStore');

            // 验证玩家数量是否达到要求
            const currentPlayerCount = gameStore.players.length;
            if (minPlayerCount && currentPlayerCount < minPlayerCount) {
                wx.showModal({
                    title: '提示',
                    content: `该规则需要至少 ${minPlayerCount} 名玩家，当前只有 ${currentPlayerCount} 名玩家，无法创建游戏。`,
                    showCancel: false,
                    confirmText: '知道了'
                });
                return;
            }

            const gambleSysName = item.gambleSysName;

            // 从 holeRangeStore 获取洞数据
            const { holeList } = holeRangeStore.getState();
            const runtimeConfigData = {
                gambleSysName,
                gameid: gameStore.gameid,
                playerCount: currentPlayerCount,
                holeCount: holeList.length,
                userRuleId: item.userRuleId,
                holeList,
                userRuleName: item.gambleUserName,
                fromUserRule: true,
                userRule: item
            };

            // 编码传递的数据
            const encodedData = encodeURIComponent(JSON.stringify(runtimeConfigData));
            wx.navigateTo({ url: `/packageGamble/gambleRuntimeConfig/addRuntime/addRuntime?data=${encodedData}` });
        },

        // 下拉刷新处理
        onPullDownRefresh() {
            this.loadMyRules();
            // 通知父组件停止下拉刷新
            setTimeout(() => {
                this.triggerEvent('pullDownComplete');
            }, 1000);
        }
    }
}); 