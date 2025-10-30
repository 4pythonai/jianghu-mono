import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '@/stores/gameStore';

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

    onLoad(options = {}) {
        const targetTab = this._resolveTab(options.activeTab);
        if (targetTab !== 'score') {
            this._redirectToTab(targetTab, options);
            return;
        }

        this.storeBindings = createStoreBindings(this, {
            store: gameStore,
            fields: ['gameData', 'loading', 'error', 'players', 'red_blue'],
            actions: ['fetchGameDetail']
        });

        const queryParams = this._extractQueryParams(options);
        const { gameid = '', groupid = '' } = queryParams;

        this.setData({
            gameid,
            groupid,
            queryParams
        });

        if (gameid) {
            this._fetchDetail(gameid, groupid);
        }
    },

    onShow() {
        if (this.data.gameid) {
            this._fetchDetail(this.data.gameid, this.data.groupid);
        }
    },

    onUnload() {
        this.storeBindings?.destroyStoreBindings();
    },

    onCellClick(e) {
        const { holeIndex, playerIndex, unique_key } = e.detail || {};
        const scoreInputPanel = this.selectComponent('#scoreInputPanel');
        if (scoreInputPanel && typeof scoreInputPanel.show === 'function') {
            scoreInputPanel.show({ holeIndex, playerIndex, unique_key });
        } else {
            console.error('[score] 无法找到 #scoreInputPanel 组件');
        }
    },

    _fetchDetail(gameid, groupid) {
        return this.fetchGameDetail(gameid, groupid).catch(err => {
            console.error('[score] 获取比赛详情失败:', err);
            wx.showToast({
                title: err?.message || '加载失败',
                icon: 'none'
            });
        });
    },

    _resolveTab(activeTab) {
        if (activeTab === undefined || activeTab === null) {
            return 'score';
        }
        return TAB_ROUTE_MAP[String(activeTab)] || 'score';
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
    }
});
