const DEFAULT_TABS = [
    { id: 'myRules', label: '我的规则', url: '/pages/rules/myRules/myRules' },
    { id: 'addRule', label: '添加规则', url: '/pages/rules/addRule/addRule' }
];

Component({
    properties: {
        active: {
            type: String,
            value: 'myRules'
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
                console.warn('[RulesTabs] 未配置跳转URL', e.currentTarget.dataset);
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
