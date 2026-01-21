import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '@/stores/game/gameStore';

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
        if (targetTab !== 'bbs') {
            this._redirectToTab(targetTab, options);
            return;
        }

        this.storeBindings = createStoreBindings(this, {
            store: gameStore,
            fields: ['gameData', 'loading', 'error'],
            actions: ['fetchGameDetail']
        });

        const queryParams = this._extractQueryParams(options);
        const { gameid = '', groupid = '' } = queryParams;

        // 计算导航栏高度
        const { getNavBarHeight } = require('@/utils/systemInfo');
        const navBarHeight = getNavBarHeight();

        // 构建返回URL：返回到 score 页面
        const backQuery = this._buildQueryString(queryParams);
        const backUrl = backQuery
            ? `/packageGame/gameDetail/score/score?${backQuery}`
            : '/packageGame/gameDetail/score/score';

        this.setData({
            gameid,
            groupid,
            queryParams,
            backUrl,
            navBarHeight
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

    _fetchDetail(gameid, groupid) {
        return this.fetchGameDetail(gameid, groupid).catch(err => {
            console.error('[bbs] 获取比赛详情失败:', err);
        });
    },

    _resolveTab(activeTab) {
        if (activeTab === undefined || activeTab === null) {
            return 'bbs';
        }
        return TAB_ROUTE_MAP[String(activeTab)] || 'bbs';
    },

    _redirectToTab(tab, options) {
        const query = this._buildQueryString(this._extractQueryParams(options));
        const url = query ? `/packageGame/gameDetail/${tab}/${tab}?${query}` : `/packageGame/gameDetail/${tab}/${tab}`;
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
