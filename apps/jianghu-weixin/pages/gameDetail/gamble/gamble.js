const TAB_ROUTE_MAP = {
    '0': 'score',
    '1': 'bbs',
    '2': 'gamble',
    score: 'score',
    bbs: 'bbs',
    gamble: 'gamble'
};

Page({
    data: {
        gameid: '',
        groupid: '',
        queryParams: {},
        backUrl: '', // 自定义导航栏返回URL
        navBarHeight: 44 + 20 // 导航栏高度（状态栏 + 导航栏）
    },

    onLoad(options = {}) {
        const targetTab = this._resolveTab(options.activeTab);
        if (targetTab !== 'gamble') {
            this._redirectToTab(targetTab, options);
            return;
        }

        const queryParams = this._extractQueryParams(options);
        const { gameid = '', groupid = '' } = queryParams;

        // 计算导航栏高度
        const systemInfo = wx.getSystemInfoSync();
        const statusBarHeight = systemInfo.statusBarHeight || 0;
        const navBarHeight = statusBarHeight + 44;

        // 构建返回URL：始终返回到 score 页面
        const backQuery = this._buildQueryString({ gameid, groupid });
        const backUrl = backQuery
            ? `/pages/gameDetail/score/score?${backQuery}`
            : `/pages/gameDetail/score/score`;

        this.setData({
            gameid,
            groupid,
            queryParams,
            backUrl,
            navBarHeight
        });
    },

    onShow() {
        // 刷新 GambleSummary 组件的列表数据
        const gambleSummary = this.selectComponent('#gambleSummary');
        if (gambleSummary && typeof gambleSummary.refresh === 'function') {
            gambleSummary.refresh();
        }
    },

    _resolveTab(activeTab) {
        if (activeTab === undefined || activeTab === null) {
            return 'gamble';
        }
        return TAB_ROUTE_MAP[String(activeTab)] || 'gamble';
    },

    _redirectToTab(tab, options) {
        const query = this._buildQueryString(this._extractQueryParams(options));
        const url = query ? `/pages/gameDetail/${tab}/${tab}?${query}` : `/pages/gameDetail/${tab}/${tab}`;
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
    },

});
