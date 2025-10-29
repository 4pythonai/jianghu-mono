import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/gameStore'
import { holeRangeStore } from '@/stores/holeRangeStore'
import { scoreStore } from '@/stores/scoreStore'

Component({
    data: {
        scrollSync: true,
        scrollTop: 0,
        players: [],
        holeList: [],
        playerScores: [],
        playerTotals: [],
        displayScores: [],
        displayOutTotals: [],
        displayInTotals: [],
        red_blue: [],
        gameAbstract: '',
        gameid: null,
        gameData: null,
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    players: 'players',
                    red_blue: 'red_blue',
                    gameAbstract: 'gameAbstract',
                    gameid: 'gameid',
                    gameData: 'gameData',
                },
                actions: [],
            });

            this.holeRangeStoreBindings = createStoreBindings(this, {
                store: holeRangeStore,
                fields: {
                    holeList: 'holeList',
                },
                actions: [],
            });

            this.scoreStoreBindings = createStoreBindings(this, {
                store: scoreStore,
                fields: {
                    playerScores: 'scores',
                    playerTotals: 'playerTotalScores',
                },
                actions: [],
            });

            this.scrollToLeft();
        },

        detached() {
            if (this.storeBindings) {
                this.storeBindings.destroyStoreBindings();
            }
            if (this.holeRangeStoreBindings) {
                this.holeRangeStoreBindings.destroyStoreBindings();
            }
            if (this.scoreStoreBindings) {
                this.scoreStoreBindings.destroyStoreBindings();
            }
        }
    },

    observers: {
        'playerScores,players,holeList,red_blue': function (scores, players, holeList, red_blue) {
            if (!scores || !players || !holeList) return;

            // 使用 scoreStore 的计算方法
            const displayScores = scoreStore.calculateDisplayScores(players, holeList, red_blue);
            const displayTotals = scoreStore.calculateDisplayTotals(displayScores);
            const { displayOutTotals, displayInTotals } = scoreStore.calculateOutInTotals(displayScores, holeList);
            this.setData({ displayScores, displayTotals, displayOutTotals, displayInTotals });
        }
    },

    methods: {
        scrollToLeft() {
            const query = wx.createSelectorQuery().in(this);
            query.select('#mainScroll').node().exec((res) => {
                if (res[0]?.node) {
                    res[0].node.scrollTo({ left: 0, behavior: 'auto' });
                }
            });
        },

        onPlayerScroll(e) {
            if (!this.data.scrollSync) return;
            const scrollTop = e.detail.scrollTop;
            this.setData({ scrollTop });
            this.syncScrollPosition('holesTable', scrollTop);
        },

        onHolesScroll(e) {
            if (!this.data.scrollSync) return;
            const scrollTop = e.detail.scrollTop;
            this.setData({ scrollTop });
            this.syncScrollPosition('playerTable', scrollTop);
        },

        syncScrollPosition(tableId, scrollTop) {
            const query = wx.createSelectorQuery().in(this);
            query.select(`#${tableId}`).node().exec((res) => {
                if (res[0]?.node) {
                    res[0].node.scrollTop = scrollTop;
                }
            });
        },

        onCellClick(e) {
            this.triggerEvent('cellclick', e.detail);
        },

        // 显示操作面板
        showOperationPanel() {
            const operationPanel = this.selectComponent('#gameOperationPanel');
            if (operationPanel) {
                // 从 gameStore 获取 gameid
                const gameid = this.data.gameid || this.data.gameData?.id;
                if (gameid) {
                    operationPanel.show({
                        gameid: gameid
                    });
                } else {
                    console.warn('ScoreTable: 无法获取有效的 gameid');
                    wx.showToast({
                        title: '无法获取比赛信息',
                        icon: 'none'
                    });
                }
            }
        },

        // 处理操作面板选项点击
        onOptionClick(e) {
            console.log('ScoreTable 收到操作面板选项点击:', e.detail);
            this.triggerEvent('optionclick', e.detail);
        },

        // 处理取消比赛
        onCancelGame(e) {
            console.log('ScoreTable 收到取消比赛事件:', e.detail);
            this.triggerEvent('cancelgame', e.detail);
        },

        // 处理结束比赛
        onFinishGame(e) {
            console.log('ScoreTable 收到结束比赛事件:', e.detail);
            this.triggerEvent('finishgame', e.detail);
        },

        // 显示添加球员面板
        showAddPlayerPanel() {
            const addPlayerPanel = this.selectComponent('#addPlayerPanel');
            if (addPlayerPanel) {
                // 从 gameStore 获取 gameid 和 uuid
                const gameid = this.data.gameid || this.data.gameData?.id;
                const uuid = this.data.gameData?.uuid || this.data.gameData?.game_uuid;
                const title = this.data.gameData?.title || this.data.gameData?.game_name;

                console.log('📋 [ScoreTable] 准备显示添加球员面板:', { gameid, uuid, title });

                if (gameid) {
                    addPlayerPanel.show({
                        gameid: gameid,
                        uuid: uuid,
                        title: title,
                        groupIndex: 0,  // TODO: 从实际上下文获取
                        slotIndex: 0    // TODO: 从实际上下文获取
                    });
                } else {
                    console.warn('ScoreTable: 无法获取有效的 gameid');
                    wx.showToast({
                        title: '无法获取比赛信息',
                        icon: 'none'
                    });
                }
            }
        },

        // 处理添加球员确认
        onAddPlayerConfirm(e) {
            console.log('ScoreTable 收到添加球员确认事件:', e.detail);
            this.triggerEvent('addplayerconfirm', e.detail);
        }
    }
})
