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
        myRules: [], // 我的规则列表
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

            // TODO: 调用API获取我的规则列表
            // 模拟数据
            setTimeout(() => {
                this.setData({
                    myRules: [
                        {
                            id: 1,
                            title: '标准高尔夫规则',
                            description: '标准18洞高尔夫比赛规则，包含详细的计分方式和比赛流程',
                            type: 'system',
                            createTime: '2024-12-19'
                        },
                        {
                            id: 2,
                            title: '友谊赛规则',
                            description: '适合朋友间的轻松比赛规则，简化了部分复杂规则',
                            type: 'custom',
                            createTime: '2024-12-18'
                        },
                        {
                            id: 3,
                            title: '企业杯规则',
                            description: '适用于企业内部高尔夫比赛的规则设定',
                            type: 'custom',
                            createTime: '2024-12-17'
                        }
                    ],
                    loading: false
                });
            }, 1000);
        },

        // 刷新规则列表
        refreshRules() {
            this.loadMyRules();
        },

        // 删除规则
        onDeleteRule(e) {
            const { id } = e.currentTarget.dataset;
            const rule = this.data.myRules.find(r => r.id === id);

            wx.showModal({
                title: '确认删除',
                content: `确定要删除规则"${rule?.title}"吗？`,
                success: (res) => {
                    if (res.confirm) {
                        console.log('📋 [MyRules] 删除规则:', id);

                        // 从列表中移除
                        const newRules = this.data.myRules.filter(r => r.id !== id);
                        this.setData({ myRules: newRules });

                        // TODO: 调用API删除规则
                        wx.showToast({
                            title: '删除成功',
                            icon: 'success'
                        });

                        // 通知父组件规则已删除
                        this.triggerEvent('ruleDeleted', { id });
                    }
                }
            });
        },

        // 编辑规则
        onEditRule(e) {
            const { item } = e.currentTarget.dataset;
            console.log('📋 [MyRules] 编辑规则:', item);

            // 通知父组件切换到编辑模式
            this.triggerEvent('editRule', { rule: item });
        },

        // 查看规则详情
        onViewRule(e) {
            const { item } = e.currentTarget.dataset;
            console.log('📋 [MyRules] 查看规则详情:', item);

            // TODO: 跳转到规则详情页面或显示详情弹窗
            wx.showModal({
                title: item.title,
                content: item.description,
                showCancel: false,
                confirmText: '我知道了'
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