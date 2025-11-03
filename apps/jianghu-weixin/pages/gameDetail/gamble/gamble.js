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
        queryParams: {}
    },

    // 记录页面栈长度，用于判断是跳转还是返回
    _pageStackLength: 0,

    onLoad(options = {}) {
        const targetTab = this._resolveTab(options.activeTab);
        if (targetTab !== 'gamble') {
            this._redirectToTab(targetTab, options);
            return;
        }

        const queryParams = this._extractQueryParams(options);
        const { gameid = '', groupid = '' } = queryParams;

        this.setData({
            gameid,
            groupid,
            queryParams
        });

        // 初始化页面栈长度
        this._pageStackLength = getCurrentPages().length;
    },

    onShow() {
        const currentStackLength = getCurrentPages().length;

        // 如果页面栈长度减少，说明是返回操作
        // 此时检查页面栈中是否有 score 页面，如果没有就跳转到 score
        if (this._pageStackLength > 0 && currentStackLength < this._pageStackLength) {
            const pages = getCurrentPages();
            const hasScorePage = pages.some(page =>
                page.route === 'pages/gameDetail/score/score'
            );

            if (!hasScorePage && this.data.gameid) {
                const { gameid, groupid } = this.data;
                const query = this._buildQueryString({ gameid, groupid });
                const url = query
                    ? `/pages/gameDetail/score/score?${query}`
                    : `/pages/gameDetail/score/score`;

                wx.redirectTo({ url });
                return; // 跳转后不需要执行后续逻辑
            }
        }

        // 刷新 GambleSummary 组件的列表数据
        const gambleSummary = this.selectComponent('#gambleSummary');
        if (gambleSummary && typeof gambleSummary.refresh === 'function') {
            gambleSummary.refresh();
        }

        // 记录页面栈长度
        this._pageStackLength = currentStackLength;
    },

    onHide() {
        // 记录页面栈长度，用于判断返回操作
        this._pageStackLength = getCurrentPages().length;
    },

    onUnload() {
        // 不再需要清理 storeBindings，因为已移除 gameStore 绑定
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
