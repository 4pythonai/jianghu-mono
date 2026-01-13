// 游戏规则页面 - 入口页面，负责重定向到对应的 tab 页面
const TAB_ROUTE_MAP = {
    '0': 'myRules',
    '1': 'addRule',
    myRules: 'myRules',
    addRule: 'addRule'
};

Page({
    onLoad(options = {}) {
        console.log('📋 [Rules] 入口页面加载，参数:', options);

        // 解析目标 tab
        const targetTab = this._resolveTab(options.activeTab);

        // 重定向到对应的 tab 页面
        const query = this._buildQueryString(this._extractQueryParams(options));
        const url = query
            ? `/packageGamble/rules/${targetTab}/${targetTab}?${query}`
            : `/packageGamble/rules/${targetTab}/${targetTab}`;

        console.log('📋 [Rules] 重定向到:', url);
        wx.redirectTo({ url });
    },

    _resolveTab(activeTab) {
        if (activeTab === undefined || activeTab === null) {
            return 'myRules'; // 默认跳转到"我的规则"
        }
        return TAB_ROUTE_MAP[String(activeTab)] || 'myRules';
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