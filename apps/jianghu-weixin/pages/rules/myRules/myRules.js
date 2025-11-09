const TAB_ROUTE_MAP = {
    '0': 'myRules',
    '1': 'addRule',
    myRules: 'myRules',
    addRule: 'addRule'
};

Page({
    data: {
        queryParams: {},
        backUrl: '', // 自定义导航栏返回URL
        navBarHeight: 44 + 20 // 导航栏高度（状态栏 + 导航栏）
    },

    onLoad(options = {}) {
        const targetTab = this._resolveTab(options.activeTab);
        if (targetTab !== 'myRules') {
            this._redirectToTab(targetTab, options);
            return;
        }

        const queryParams = this._extractQueryParams(options);

        // 计算导航栏高度
        const systemInfo = wx.getSystemInfoSync();
        const statusBarHeight = systemInfo.statusBarHeight || 0;
        const navBarHeight = statusBarHeight + 44;

        // 构建返回URL：返回到 gamble 页面
        // 尝试从页面栈获取上一个页面的参数
        const pages = getCurrentPages();
        let gameid = '';
        let groupid = '';

        // 从 options 中获取参数（如果传递了的话）
        if (options.gameid) {
            gameid = options.gameid;
        }
        if (options.groupid) {
            groupid = options.groupid;
        }

        // 如果 options 中没有，尝试从页面栈的上一个页面获取
        if (!gameid && !groupid && pages.length > 1) {
            const prevPage = pages[pages.length - 2];
            if (prevPage && prevPage.options) {
                gameid = prevPage.options.gameid || '';
                groupid = prevPage.options.groupid || '';
            }
        }

        // 构建返回URL
        const backQuery = this._buildQueryString({ gameid, groupid });
        const backUrl = backQuery
            ? `/pages/gameDetail/gamble/gamble?${backQuery}`
            : `/pages/gameDetail/gamble/gamble`;

        this.setData({
            queryParams,
            backUrl,
            navBarHeight
        });
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
