const app = getApp()

// 我的规则组件
const { GameConfig } = require('../../../../utils/gameConfig.js');

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
        // 组件生命周期
        attached() {
            console.log('📋 [MyRules] 组件加载');
        },

        detached() {
            console.log('📋 [MyRules] 组件卸载');
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
        loadMyRules() {
            console.log('📋 [MyRules] 加载我的规则');
            this.setData({ loading: true });

            // 调用API获取我的规则列表
            app.api.gamble.getUserGambleRules().then(res => {
                console.log('📋 [MyRules] 获取用户规则成功:', res);

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

                    console.log('📋 [MyRules] 设置数据完成:', total);
                } else {
                    console.error('📋 [MyRules] API返回错误:', res);
                    this.handleLoadError('获取规则失败');
                }
            }).catch(err => {
                console.error('📋 [MyRules] 获取用户规则失败:', err);
                this.handleLoadError('网络错误, 请重试');
            });
        },

        // 处理加载错误
        handleLoadError(message) {
            this.setData({
                myRules: {
                    twoPlayers: [],
                    threePlayers: [],
                    fourPlayers: []
                },
                loading: false
            });

            wx.showToast({
                title: message,
                icon: 'none',
                duration: 2000
            });
        },

        // 刷新规则列表
        refreshRules() {
            console.log('📋 [MyRules] 刷新规则列表');
            this.loadMyRules();
        },

        // 长按规则处理
        onLongPressRule(e) {
            const { id, group } = e.detail || e.currentTarget.dataset;
            const targetGroup = group || 'fourPlayers';

            const rules = this.data.myRules[targetGroup];
            const rule = rules.find(r => r.userRuleId === id);

            wx.showModal({
                title: '确认删除',
                content: `确定要删除规则"${rule.gambleUserName}"吗？`,
                success: (res) => {
                    if (res.confirm) {
                        this.deleteRule(id, targetGroup);
                    }
                }
            });
        },

        // 删除规则的实际执行方法
        deleteRule(id, group) {
            app.api.gamble.deleteGambleRule({ userRuleId: id }).then(apiRes => {
                console.log('📋 [MyRules] 删除规则API成功:', apiRes);

                // 从列表中移除
                const newRules = { ...this.data.myRules };
                newRules[group] = newRules[group].filter(r => r.userRuleId !== id);

                // 更新统计
                const newTotal = { ...this.data.total };
                newTotal[group] = newRules[group].length;
                newTotal.overall = newRules.twoPlayers.length + newRules.threePlayers.length + newRules.fourPlayers.length;

                this.setData({
                    myRules: newRules,
                    total: newTotal
                });

                wx.showToast({
                    title: '删除成功',
                    icon: 'success'
                });

                // 通知父组件规则已删除
                this.triggerEvent('ruleDeleted', { id, group });

            }).catch(err => {
                console.error('📋 [MyRules] 删除规则API失败:', err);
                wx.showToast({
                    title: '删除失败, 请重试',
                    icon: 'none'
                });
            });
        },

        // 编辑规则
        onEditRule(e) {
            const { item, group } = e.detail || e.currentTarget.dataset;
            console.log('📋 [MyRules] 编辑规则:', item.gambleUserName);

            // 添加分组信息到规则数据
            const ruleDataWithGroup = {
                ...item,
                group: group || 'fourPlayers'
            };

            // 编码规则数据
            const encodedRuleData = encodeURIComponent(JSON.stringify(ruleDataWithGroup));

            // 跳转到UserRuleEdit页面
            wx.navigateTo({
                url: `/pages/rules/UserRuleEdit/UserRuleEdit?ruleId=${item.userRuleId}&ruleData=${encodedRuleData}`,
                success: () => {
                    console.log('📋 [MyRules] 成功跳转到UserRuleEdit页面');
                },
                fail: (err) => {
                    console.error('📋 [MyRules] 跳转失败:', err);
                    wx.showToast({
                        title: '页面跳转失败',
                        icon: 'none'
                    });
                }
            });
        },

        // 查看规则详情 - 跳转到运行时配置页面
        onViewRule(e) {
            const { item, group } = e.detail || e.currentTarget.dataset;
            const { gameStore } = require('../../../../stores/gameStore');
            const { holeRangeStore } = require('../../../../stores/holeRangeStore');

            const gambleSysName = item.gambleSysName;
            console.log(`📋 [MyRules] 查看规则 "${item.gambleUserName}", 类型: ${gambleSysName}`);

            // 从 holeRangeStore 获取洞数据
            const { holeList, holePlayList } = holeRangeStore.getState();

            // 准备传递给运行时配置页面的数据
            const runtimeConfigData = {
                gambleSysName,
                gameId: gameStore.gameid,
                playerCount: gameStore.players.length,
                holeCount: holeList.length,
                userRuleId: item.userRuleId,
                holePlayList,
                holeList,
                userRuleName: item.gambleUserName,
                fromUserRule: true,
                userRule: item
            };

            // 编码传递的数据
            const encodedData = encodeURIComponent(JSON.stringify(runtimeConfigData));

            // 跳转到运行时配置页面
            wx.navigateTo({
                url: `/pages/gambleRuntimeConfig/addRuntime/addRuntime?data=${encodedData}`,
                success: () => {
                    console.log('🎮 成功跳转到运行时配置页面');
                },
                fail: (err) => {
                    console.error('🎮 跳转失败:', err);
                    wx.showToast({
                        title: '页面跳转失败',
                        icon: 'none'
                    });
                }
            });
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