const TAB_ROUTE_MAP = {
    '0': 'myRules',
    '1': 'addRule',
    myRules: 'myRules',
    addRule: 'addRule'
};

Page({
    data: {
        queryParams: {}
    },

    onLoad(options = {}) {
        const targetTab = this._resolveTab(options.activeTab);
        if (targetTab !== 'myRules') {
            this._redirectToTab(targetTab, options);
            return;
        }

        const queryParams = this._extractQueryParams(options);
        this.setData({ queryParams });
    },

    onShow() {
        // 刷新我的规则列表, 确保显示最新数据
        const myRulesComponent = this.selectComponent('#myRulesComponent');
        if (myRulesComponent && typeof myRulesComponent.refreshRules === 'function') {
            myRulesComponent.refreshRules();
        }
    },

    // 处理编辑规则事件 - 这里保持原有逻辑，但实际上 MyRules 组件会直接跳转到 RuleEditer
    onEditRule(e) {
        console.log('📋 [myRules] 接收到编辑规则事件:', e.detail);
        // MyRules 组件内部已经处理了跳转逻辑，这里可以不做处理
        // 或者如果需要跳转到 addRule 页面，可以在这里处理
    },

    // 处理组件的下拉刷新完成事件
    onPullDownComplete() {
        wx.stopPullDownRefresh();
    },

    // 下拉刷新
    onPullDownRefresh() {
        const myRulesComponent = this.selectComponent('#myRulesComponent');
        if (myRulesComponent && typeof myRulesComponent.onPullDownRefresh === 'function') {
            myRulesComponent.onPullDownRefresh();
        } else {
            wx.stopPullDownRefresh();
        }
    },

    _resolveTab(activeTab) {
        if (activeTab === undefined || activeTab === null) {
            return 'myRules';
        }
        return TAB_ROUTE_MAP[String(activeTab)] || 'myRules';
    },

    _redirectToTab(tab, options) {
        const query = this._buildQueryString(this._extractQueryParams(options));
        const url = query ? `/pages/rules/${tab}/${tab}?${query}` : `/pages/rules/${tab}/${tab}`;
        wx.redirectTo({ url });
    },

    _extractQueryParams(options = {}) {
        const result = {};
        Object.keys(options).forEach(key => {
            if (key === 'activeTab') {
                return;
            }
            const value = options[key];
            if (value !== undefined && value !== null && value !== '') {
                result[key] = value;
            }
        });
        return result;
    },

    _buildQueryString(params = {}) {
        const entries = Object.entries(params);
        if (!entries.length) {
            return '';
        }
        return entries
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
    }
});
