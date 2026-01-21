import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '@/stores/game/gameStore';
import { config as apiConfig } from '@/api/config';
import { createJoinSocket } from '../../utils/joinSocket';


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

        // 计算导航栏高度
        const { getNavBarHeight } = require('../../../utils/systemInfo');
        const navBarHeight = getNavBarHeight();

        // 构建返回URL：返回到 live 页面（第一个tab）
        const backUrl = '/pages/live/live';

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

        // 初始化 WebSocket 连接
        this.ensureJoinSocket();
    },

    onShow() {
        if (this.data.gameid) {
            this._fetchDetail(this.data.gameid, this.data.groupid);
        }

        // 确保 WebSocket 连接
        this.ensureJoinSocket();
    },

    onUnload() {
        // 清理 WebSocket 连接
        if (this.joinSocket) {
            this.joinSocket.destroy();
            this.joinSocket = null;
        }

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

    ensureJoinSocket() {
        if (!apiConfig?.wsURL) {
            return;
        }

        const { gameid } = this.data;
        const gameKey = gameid;

        if (!gameKey) {
            return;
        }

        if (!this.joinSocket) {
            this.joinSocket = createJoinSocket({
                url: apiConfig.wsURL,
                gameId: gameKey,
                onEvent: this.handleSocketEvent.bind(this),
                onStatusChange: this.handleSocketStatusChange.bind(this)
            });
            this.joinSocket.connect();
            return;
        }

        this.joinSocket.updateSubscription({
            gameId: gameKey
        });

        if (!this.joinSocket.isActive()) {
            this.joinSocket.connect();
        }
    },

    handleSocketEvent(message = {}) {
        const { event } = message;
        const normalizedEvent = typeof event === 'string' ? event.toLowerCase() : '';

        // 这些事件都需要刷新比赛数据
        const shouldRefresh = [
            'notify',
            'player_joined',
            'player_updated',
            'player_left',
            'player_removed',
            'group_updated',
            'score_updated' // 计分更新
        ];

        if (shouldRefresh.includes(normalizedEvent)) {
            console.log(`[score] 收到 ${event} 事件，刷新数据`);
            this._fetchDetail(this.data.gameid, this.data.groupid);
        }
    },

    handleSocketStatusChange(detail = {}) {
        const { status, error } = detail;
        console.log(`[score] Socket 状态变更: ${status}`, error || '');
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
