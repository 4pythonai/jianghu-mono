import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '@/stores/game/gameStore';

// eventHubPanel.js
Page({
    data: {
        currentTab: 0,
        tabs: ['成绩表', '进行中', '讨论区', '游戏'],
        gameType: 'single_team',
        gameid: null,
        loading: false,
        spectators: {
            count: 0,
            avatars: []
        },
        eventDetail: null,
        gameTags: [],
        tagMembers: [],
        groups: [],
        score: null
    },
    onLoad(options) {
        const gameId = options.gameid || null;
        const gameType = options.game_type || 'single_team';

        this.setData({ gameType });

        this.storeBindings = createStoreBindings(this, {
            store: gameStore,
            fields: [
                'loading',
                'gameType',
                'gameid',
                'eventDetail',
                'gameTags',
                'tagMembers',
                'groups',
                'spectators'
            ],
            actions: [
                'fetchTeamGameDetail',
                'loadGameTags',
                'loadTagMembers',
                'loadGroups',
                'loadSpectators',
                'recordSpectator'
            ]
        });

        if (gameId) {
            this.initData(gameId, gameType);
        }
    },
    onUnload() {
        if (this.storeBindings) {
            this.storeBindings.destroyStoreBindings();
        }
    },
    async initData(gameId, gameType) {
        try {
            await Promise.all([
                this.fetchTeamGameDetail(gameId, gameType),
                this.loadGameTags(gameId),
                this.loadTagMembers(gameId),
                this.loadGroups(gameId),
                this.loadSpectators(gameId)
            ]);

            if (this.storeBindings) {
                this.storeBindings.updateStoreBindings();
            }

            this.recordSpectator(gameId);
        } catch (err) {
            console.error('[eventHubPanel] 初始化失败:', err);
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    switchTab(e) {
        const index = Number.parseInt(e.currentTarget.dataset.index);
        if (Number.isNaN(index) || index === this.data.currentTab) {
            return;
        }

        this.setData({
            currentTab: index
        });
    },
    onSpectatorMore() {
        const gameName = encodeURIComponent(this.data.eventDetail?.title || '');
        wx.navigateTo({
            url: `/packageGame/spectators/spectators?game_id=${this.data.gameid}&game_name=${gameName}`
        });
    }
});
