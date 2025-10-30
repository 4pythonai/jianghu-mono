const DEFAULT_TABS = [
    { id: 'score', label: '记分', url: '/pages/gameDetail/score/score' },
    { id: 'bbs', label: '互动', url: '/pages/gameDetail/bbs/bbs' },
    { id: 'gamble', label: '游戏', url: '/pages/gameDetail/gamble/gamble' }
];

Component({
    properties: {
        active: {
            type: String,
            value: 'score'
        },
        queryParams: {
            type: Object,
            value: {}
        },
        tabs: {
            type: Array,
            value: DEFAULT_TABS
        }
    },

    methods: {
        onTabTap(e) {
            const { id, url } = e.currentTarget.dataset;
            if (!url) {
                console.warn('[GameDetailTabs] 未配置跳转URL', e.currentTarget.dataset);
                return;
            }

            if (id === this.data.active) {
                return;
            }

            const query = this._buildQuery(this.data.queryParams);
            const targetUrl = query ? `${url}?${query}` : url;
            wx.redirectTo({ url: targetUrl });
            this.triggerEvent('tabchange', { id, url: targetUrl });
        },

        _buildQuery(params = {}) {
            const entries = Object.entries(params)
                .filter(([, value]) => value !== undefined && value !== null && value !== '');

            if (!entries.length) {
                return '';
            }

            return entries
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
                .join('&');
        }
    }
});
