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

    // 记录页面栈长度，用于判断是跳转还是返回
    _pageStackLength: 0,

    onLoad(options = {}) {
        const targetTab = this._resolveTab(options.activeTab);
        if (targetTab !== 'gamble') {
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

        this.setData({
            gameid,
            groupid,
            queryParams
        });

        if (gameid) {
            this._fetchDetail(gameid, groupid);
        }

        // 初始化页面栈长度
        this._pageStackLength = getCurrentPages().length;
    },

    onShow() {
        if (this.data.gameid) {
            this._fetchDetail(this.data.gameid, this.data.groupid);
        }
        // 记录页面栈长度
        this._pageStackLength = getCurrentPages().length;
    },

    onHide() {
        // 页面隐藏时检查：如果是通过返回按钮离开，且页面栈中没有 score 页面，则跳转到 score
        // 通过比较页面栈长度变化来判断是跳转还是返回
        const currentStackLength = getCurrentPages().length;

        // 如果页面栈长度减少，说明是返回操作
        // 如果页面栈长度增加或不变，说明是跳转到其他页面，不应该执行跳转
        if (currentStackLength < this._pageStackLength) {
            // 延迟一小段时间，确保页面栈已经更新
            setTimeout(() => {
                this._ensureBackToScore();
            }, 50);
        }

        // 更新页面栈长度记录
        this._pageStackLength = currentStackLength;
    },

    onUnload() {
        this.storeBindings?.destroyStoreBindings();
    },

    _fetchDetail(gameid, groupid) {
        return this.fetchGameDetail(gameid, groupid).catch(err => {
            console.error('[gamble] 获取比赛详情失败:', err);
        });
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

    /**
     * 确保返回时跳转到 score 页面
     */
    _ensureBackToScore() {
        const { gameid, groupid } = this.data;
        if (!gameid) {
            return;
        }

        // 检查页面栈
        const pages = getCurrentPages();

        // 如果当前页面已经是 score，不需要跳转
        const currentPage = pages[pages.length - 1];
        if (currentPage && currentPage.route === 'pages/gameDetail/score/score') {
            return;
        }

        // 检查页面栈中是否有 score 页面
        const hasScorePage = pages.some(page =>
            page.route === 'pages/gameDetail/score/score'
        );

        // 如果页面栈中没有 score 页面，跳转到 score 页面
        if (!hasScorePage) {
            const query = this._buildQueryString({ gameid, groupid });
            const url = query
                ? `/pages/gameDetail/score/score?${query}`
                : `/pages/gameDetail/score/score`;

            // 使用 redirectTo 立即跳转，避免空白页面
            wx.redirectTo({
                url,
                fail: (err) => {
                    console.error('[gamble] 跳转到 score 页面失败:', err);
                }
            });
        }
    }
});
