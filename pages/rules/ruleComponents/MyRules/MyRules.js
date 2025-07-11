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

        // 删除规则
        onDeleteRule(e) {
            const { id, group } = e.currentTarget.dataset;
            const rules = this.data.myRules[group] || [];
            const rule = rules.find(r => r.id === id);

            wx.showModal({
                title: '确认删除',
                content: `确定要删除规则"${rule?.gambleUserName || rule?.user_rulename || rule?.title}"吗？`,
                success: (res) => {
                    if (res.confirm) {
                        console.log('📋 [MyRules] 删除规则:', id, '分组:', group);

                        // TODO: 调用API删除规则
                        app.api.gamble.deleteGambleRule({ ruleId: id }).then(apiRes => {
                            console.log('📋 [MyRules] 删除规则API成功:', apiRes);

                            // 从列表中移除
                            const newRules = { ...this.data.myRules };
                            newRules[group] = newRules[group].filter(r => r.id !== id);

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
                    }
                }
            });
        },

        // 编辑规则
        onEditRule(e) {
            const { item, group } = e.currentTarget.dataset;
            console.log('📋 [MyRules] 编辑规则:', item, '分组:', group);

            // 通知父组件切换到编辑模式
            this.triggerEvent('editRule', { rule: item, group });
        },

        // 查看规则详情
        onViewRule(e) {
            const { item, group } = e.currentTarget.dataset;
            console.log('📋 [MyRules] 查看规则详情:', item, '分组:', group);

            // 构建规则详情内容
            let content = `规则名称：${item.gambleUserName || item.user_rulename || item.title}\n`;
            content += `游戏人数：${this.getGroupDisplayName(group)}\n`;
            content += `创建时间：${item.created_at || '未知'}\n`;
            if (item.description) {
                content += `\n规则描述：${item.description}`;
            }

            wx.showModal({
                title: '规则详情',
                content: content,
                showCancel: false,
                confirmText: '我知道了'
            });
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