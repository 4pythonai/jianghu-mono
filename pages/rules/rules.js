// 游戏规则页面
Page({
    data: {
        activeTab: 0, // 当前激活的tab, 0为"我的规则", 1为"添加规则"
        editRule: null // 编辑的规则数据
    },

    // 页面加载
    onLoad(options) {
        console.log('📋 [Rules] 页面加载');
        console.log('📋 [Rules] 初始activeTab:', this.data.activeTab);
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

    // 处理规则保存事件
    onRuleSaved(e) {
        const { rule, isEdit } = e.detail;
        console.log('📋 [Rules] 规则已保存:', rule, '编辑模式:', isEdit);

        // 清除编辑状态并切换到我的规则tab
        this.setData({
            activeTab: 0,
            editRule: null
        });

        // 通知MyRules组件刷新列表
        const myRulesComponent = this.selectComponent('#myRulesComponent');
        if (myRulesComponent) {
            myRulesComponent.refreshRules();
        }
    },

    // 处理取消编辑事件
    onCancelEdit() {
        console.log('📋 [Rules] 取消编辑');

        // 清除编辑状态并切换到我的规则tab
        this.setData({
            activeTab: 0,
            editRule: null
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
    },

    // Debug方法:手动切换tab
    debugToggleTab() {
        const newTab = this.data.activeTab === 0 ? 1 : 0;
        console.log('📋 [Rules] Debug切换tab:', this.data.activeTab, '->', newTab);
        this.setData({
            activeTab: newTab
        });
    }
}); 