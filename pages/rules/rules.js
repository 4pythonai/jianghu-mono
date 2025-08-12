// 游戏规则页面
Page({
    data: {
        activeTab: 0, // 当前激活的tab, 0为"我的规则", 1为"添加规则"
        editRule: null // 编辑的规则数据
    },

    // 页面加载
    onLoad(options) {
        console.log('📋 [Rules] 页面加载');
        console.log('📋 [Rules] 页面参数:', options);

        // 如果传入了activeTab参数，则设置对应的tab
        if (options.activeTab !== undefined) {
            const activeTab = Number.parseInt(options.activeTab);
            console.log('📋 [Rules] 设置activeTab:', activeTab);
            this.setData({ activeTab });
        }

        console.log('📋 [Rules] 最终activeTab:', this.data.activeTab);
    },

    // 页面显示
    onShow() {
        console.log('📋 [Rules] 页面显示');

        // 刷新我的规则列表, 确保显示最新数据
        if (this.data.activeTab === 0) {
            const myRulesComponent = this.selectComponent('#myRulesComponent');
            if (myRulesComponent) {
                myRulesComponent.refreshRules();
            }
        }
    },

    // Tab切换方法
    onTabChange(e) {
        const { index } = e.currentTarget.dataset;
        const tabIndex = Number.parseInt(index); // 确保转换为数字
        console.log('📋 [Rules] 切换到tab:', tabIndex, '(原始值:', index, ')');

        this.setData({
            activeTab: tabIndex
        });

        // 切换到添加规则tab时, 清除编辑状态
        if (tabIndex === 1) {
            this.setData({ editRule: null });
        }
    },

    // ---- 组件事件处理 ----

    // 处理编辑规则事件
    onEditRule(e) {
        const { rule } = e.detail;
        console.log('📋 [Rules] 编辑规则:', rule);

        // 设置编辑数据并切换到添加规则tab
        this.setData({
            activeTab: 1,
            editRule: rule
        });
    },



    // 下拉刷新
    onPullDownRefresh() {
        if (this.data.activeTab === 0) {
            // 通知MyRules组件处理下拉刷新
            const myRulesComponent = this.selectComponent('#myRulesComponent');
            if (myRulesComponent) {
                myRulesComponent.onPullDownRefresh();
            }
        } else {
            wx.stopPullDownRefresh();
        }
    },

    // 处理组件的下拉刷新完成事件
    onPullDownComplete() {
        wx.stopPullDownRefresh();
    }
}); 