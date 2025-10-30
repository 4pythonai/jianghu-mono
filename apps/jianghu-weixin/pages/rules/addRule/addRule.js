const TAB_ROUTE_MAP = {
    '0': 'myRules',
    '1': 'addRule',
    myRules: 'myRules',
    addRule: 'addRule'
};

Page({
    data: {
        queryParams: {},
        editRule: null
    },

    onLoad(options = {}) {
        const targetTab = this._resolveTab(options.activeTab);
        if (targetTab !== 'addRule') {
            this._redirectToTab(targetTab, options);
            return;
        }

        const queryParams = this._extractQueryParams(options);
        let editRule = null;

        // 处理 editRule 参数（如果通过 URL 传递）
        if (options.editRule) {
            try {
                editRule = JSON.parse(decodeURIComponent(options.editRule));
            } catch (e) {
                console.error('📋 [addRule] 解析 editRule 参数失败:', e);
            }
        }

        this.setData({
            queryParams,
            editRule
        });
    },

    onShow() {
        // 如果从编辑页面返回，可能需要刷新
    },

    _resolveTab(activeTab) {
        if (activeTab === undefined || activeTab === null) {
            return 'addRule';
        }
        return TAB_ROUTE_MAP[String(activeTab)] || 'addRule';
    },

    _redirectToTab(tab, options) {
        const query = this._buildQueryString(this._extractQueryParams(options));
        const url = query ? `/pages/rules/${tab}/${tab}?${query}` : `/pages/rules/${tab}/${tab}`;
        wx.redirectTo({ url });
    },

    _extractQueryParams(options = {}) {
        const result = {};
        Object.keys(options).forEach(key => {
            if (key === 'activeTab' || key === 'editRule') {
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
