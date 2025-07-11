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
        myRules: {
            twoPlayers: [],
            threePlayers: [],
            fourPlayers: []
        }, // 我的规则列表，按人数分组
        total: {
            twoPlayers: 0,
            threePlayers: 0,
            fourPlayers: 0,
            overall: 0
        }, // 统计信息
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
                    this.setData({
                        myRules: {
                            twoPlayers: res.userRules.twoPlayers || [],
                            threePlayers: res.userRules.threePlayers || [],
                            fourPlayers: res.userRules.fourPlayers || []
                        },
                        total: res.userRules.total || {
                            twoPlayers: 0,
                            threePlayers: 0,
                            fourPlayers: 0,
                            overall: 0
                        },
                        loading: false
                    });
                } else {
                    console.error('📋 [MyRules] API返回错误:', res);
                    this.handleLoadError('获取规则失败');
                }
            }).catch(err => {
                console.error('📋 [MyRules] 获取用户规则失败:', err);
                this.handleLoadError('网络错误，请重试');
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
                total: {
                    twoPlayers: 0,
                    threePlayers: 0,
                    fourPlayers: 0,
                    overall: 0
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
            this.loadMyRules();
        },

        // 长按规则处理
        onLongPressRule(e) {
            const { id, group, item } = e.currentTarget.dataset;

            if (!id || !group) {
                wx.showToast({
                    title: '操作失败，参数错误',
                    icon: 'none'
                });
                return;
            }

            const rules = this.data.myRules[group] || [];
            const rule = rules.find(r => r.userRuleId === id);

            if (!rule) {
                wx.showToast({
                    title: '操作失败，规则不存在',
                    icon: 'none'
                });
                return;
            }

            wx.showModal({
                title: '确认删除',
                content: `确定要删除规则"${rule.gambleUserName || rule.user_rulename || rule.title}"吗？`,
                success: (res) => {
                    if (res.confirm) {
                        this.deleteRule(id, group);
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
                    title: '删除失败，请重试',
                    icon: 'none'
                });
            });
        },

        // 编辑规则
        onEditRule(e) {
            const { item, group } = e.currentTarget.dataset;
            console.log('📋 [MyRules] 编辑规则:', item, '分组:', group);

            // 通知父组件切换到编辑模式
            this.triggerEvent('editRule', { rule: item, group });
        },

        // 查看规则详情 - 跳转到运行时配置页面
        onViewRule(e) {
            const { item, group } = e.currentTarget.dataset;
            console.log('📋 [MyRules] 使用用户规则:', item, '分组:', group);

            // 导入gameStore来获取游戏数据
            const { gameStore } = require('../../../../stores/gameStore');

            // 根据用户规则确定ruleType
            const ruleType = this.mapUserRuleToRuleType(item, group);

            if (!ruleType) {
                wx.showToast({
                    title: '无法识别规则类型',
                    icon: 'none'
                });
                return;
            }

            // 准备传递给运行时配置页面的数据（简化版，减少URL长度）
            const runtimeConfigData = {
                ruleType: ruleType,
                gameId: gameStore.gameid || null,
                playerCount: gameStore.players?.length || 0,
                holeCount: gameStore.holes?.length || 18,
                userRuleId: item.userRuleId || null,
                userRuleName: item.gambleUserName || item.user_rulename || item.title,
                fromUserRule: true // 标识这是从用户规则进入的
            };

            // 将完整的用户规则数据暂存到全局
            const app = getApp();
            app.globalData = app.globalData || {};
            app.globalData.currentUserRule = item;
            app.globalData.currentGameData = {
                players: gameStore.players || [],
                holes: gameStore.holes || [],
                gameData: gameStore.gameData || null
            };

            // 编码传递的数据
            const encodedData = encodeURIComponent(JSON.stringify(runtimeConfigData));

            // 跳转到运行时配置页面
            wx.navigateTo({
                url: `/pages/gambleRuntimeConfig/gambleRuntimeConfig?data=${encodedData}`,
                success: () => {
                    console.log('🎮 成功跳转到运行时配置页面，用户规则:', item.gambleUserName || item.user_rulename);
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

        // 将用户规则映射到标准规则类型
        mapUserRuleToRuleType(userRule, group) {
            // 根据游戏系统名称和人数确定规则类型
            const gamblesysname = userRule.gamblesysname || '';

            // 构建规则类型映射
            const ruleTypeMap = {
                'twoPlayers': {
                    '8421': '2p-8421',
                    'gross': '2p-gross',
                    'hole': '2p-hole'
                },
                'threePlayers': {
                    '8421': '3p-8421',
                    'doudizhu': '3p-doudizhu',
                    'dizhupo': '3p-dizhupo'
                },
                'fourPlayers': {
                    '8421': '4p-8421',
                    'lasi': '4p-lasi',
                    'dizhupo': '4p-dizhupo',
                    '3da1': '4p-3da1',
                    'bestak': '4p-bestak'
                }
            };

            // 首先根据gamblesysname精确匹配
            if (ruleTypeMap[group] && ruleTypeMap[group][gamblesysname]) {
                return ruleTypeMap[group][gamblesysname];
            }

            // 如果精确匹配失败，根据规则名称进行模糊匹配
            const ruleName = (userRule.gambleUserName || userRule.user_rulename || '').toLowerCase();

            if (ruleName.includes('8421')) {
                return ruleTypeMap[group]['8421'];
            } else if (ruleName.includes('比杆') || ruleName.includes('gross')) {
                return ruleTypeMap[group]['gross'];
            } else if (ruleName.includes('比洞') || ruleName.includes('hole')) {
                return ruleTypeMap[group]['hole'];
            } else if (ruleName.includes('斗地主') || ruleName.includes('doudizhu')) {
                return ruleTypeMap[group]['doudizhu'];
            } else if (ruleName.includes('地主婆') || ruleName.includes('dizhupo')) {
                return ruleTypeMap[group]['dizhupo'];
            } else if (ruleName.includes('拉死') || ruleName.includes('lasi')) {
                return ruleTypeMap[group]['lasi'];
            } else if (ruleName.includes('3打1') || ruleName.includes('3da1')) {
                return ruleTypeMap[group]['3da1'];
            } else if (ruleName.includes('bestak')) {
                return ruleTypeMap[group]['bestak'];
            }

            // 默认返回该组的8421规则
            return ruleTypeMap[group]['8421'] || null;
        },

        // 获取分组显示名称
        getGroupDisplayName(group) {
            const groupNames = {
                twoPlayers: '2人游戏',
                threePlayers: '3人游戏',
                fourPlayers: '4人游戏'
            };
            return groupNames[group] || '未知';
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