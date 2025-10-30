const TAB_ROUTE_MAP = {
    '0': 'score',
    '1': 'bbs',
    '2': 'gamble',
    score: 'score',
    bbs: 'bbs',
    gamble: 'gamble'
};

Page({
    onLoad(options = {}) {
        const targetTab = this._resolveTab(options.activeTab);
        const targetUrl = this._buildTargetUrl(targetTab, options);

        console.log('[gameDetail] Redirecting to:', targetUrl);

        wx.redirectTo({
            url: targetUrl,
            fail: (err) => {
                console.error('[gameDetail] redirectTo failed:', err);
                wx.showToast({
                    title: '无法打开页面',
                    icon: 'none'
                });
            }
        });
    },

    _resolveTab(activeTab) {
        if (activeTab === undefined || activeTab === null) {
            return 'score';
        }
        const key = String(activeTab);
        return TAB_ROUTE_MAP[key] || 'score';
    },

    _buildTargetUrl(tab, options) {
        const basePath = `/pages/gameDetail/${tab}/${tab}`;
        const query = this._buildQueryString(options, ['activeTab']);
        return query ? `${basePath}?${query}` : basePath;
    },

    _buildQueryString(options, excludeKeys = []) {
        const entries = Object.entries(options || {}).filter(([key, value]) => {
            if (excludeKeys.includes(key)) return false;
            return value !== undefined && value !== null && value !== '';
        });

        if (!entries.length) {
            return '';
        }

        return entries
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
    }
});
