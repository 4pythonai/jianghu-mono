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

            // 延迟手动触发一次计算，确保数据能正确初始化
            setTimeout(() => {
                this.calculateDisplayData();
            }, 100);
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
            if (!scores || !players || !holeList) {
                console.warn('[ScoreTable] observers: 数据不完整', { scores, players, holeList });
                return;
            }

            console.log('[ScoreTable] observers 触发:', {
                scoresLength: scores?.length,
                playersLength: players?.length,
                holeListLength: holeList?.length,
                red_blueLength: red_blue?.length
            });

            // 使用 scoreStore 的计算方法
            const displayScores = scoreStore.calculateDisplayScores(players, holeList, red_blue);
            const displayTotals = scoreStore.calculateDisplayTotals(displayScores);
            const { displayOutTotals, displayInTotals } = scoreStore.calculateOutInTotals(displayScores, holeList);

            console.log('[ScoreTable] 计算结果:', {
                displayScoresLength: displayScores?.length,
                displayTotals,
                displayOutTotals,
                displayOutTotalsValues: displayOutTotals ? [...displayOutTotals] : null, // 展开数组查看实际值
                displayInTotals,
                displayInTotalsValues: displayInTotals ? [...displayInTotals] : null,
                displayOutTotalsType: Array.isArray(displayOutTotals) ? 'array' : typeof displayOutTotals,
                displayOutTotalsLength: displayOutTotals?.length,
                holeListLength: holeList.length,
                is18Holes: holeList.length === 18
            });

            // 确保 displayOutTotals 和 displayInTotals 是数组
            const safeDisplayOutTotals = Array.isArray(displayOutTotals) ? displayOutTotals : [];
            const safeDisplayInTotals = Array.isArray(displayInTotals) ? displayInTotals : [];

            // 确保数组有足够长度，并用0填充空缺
            const paddedOutTotals = [...safeDisplayOutTotals];
            const paddedInTotals = [...safeDisplayInTotals];
            while (paddedOutTotals.length < players.length) {
                paddedOutTotals.push(0);
            }
            while (paddedInTotals.length < players.length) {
                paddedInTotals.push(0);
            }

            console.log('[ScoreTable] 准备 setData:', {
                safeDisplayOutTotals,
                paddedOutTotals,
                paddedInTotals,
                playersLength: players.length
            });

            this.setData({
                displayScores,
                displayTotals,
                displayOutTotals: paddedOutTotals,
                displayInTotals: paddedInTotals
            });

            // 验证设置后的数据（延迟一点以确保setData完成）
            setTimeout(() => {
                const outTotals = this.data.displayOutTotals || [];
                const inTotals = this.data.displayInTotals || [];
                console.log('[ScoreTable] setData 后的数据:', {
                    displayOutTotals: outTotals,
                    displayOutTotalsValues: [...outTotals], // 展开数组
                    displayInTotals: inTotals,
                    displayInTotalsValues: [...inTotals], // 展开数组
                    displayOutTotalsType: Array.isArray(this.data.displayOutTotals) ? 'array' : typeof this.data.displayOutTotals,
                    playersLength: this.data.players?.length,
                    displayOutTotalsLength: outTotals.length
                });

                // 检查每个玩家的OUT值
                if (outTotals.length > 0 && this.data.players) {
                    console.log('[ScoreTable] 每个玩家的OUT值:',
                        this.data.players.map((p, i) => ({
                            playerIndex: i,
                            playerId: p.userid,
                            outValue: outTotals[i],
                            outType: typeof outTotals[i]
                        }))
                    );
                }
            }, 50);
        }
    },

    methods: {
        /**
         * 手动计算显示数据（用于确保数据正确初始化）
         */
        calculateDisplayData() {
            const players = this.data.players || [];
            const holeList = this.data.holeList || [];
            const red_blue = this.data.red_blue || [];
            const scores = this.data.playerScores || [];

            console.log('[ScoreTable] calculateDisplayData 手动触发:', {
                playersLength: players.length,
                holeListLength: holeList.length,
                scoresLength: scores.length
            });

            if (!players.length || !holeList.length) {
                console.warn('[ScoreTable] calculateDisplayData: 数据不完整，跳过计算');
                return;
            }

            // 使用 scoreStore 的计算方法
            const displayScores = scoreStore.calculateDisplayScores(players, holeList, red_blue);
            const displayTotals = scoreStore.calculateDisplayTotals(displayScores);
            const { displayOutTotals, displayInTotals } = scoreStore.calculateOutInTotals(displayScores, holeList);

            console.log('[ScoreTable] calculateDisplayData 计算结果:', {
                displayOutTotals,
                displayOutTotalsValues: displayOutTotals ? [...displayOutTotals] : null,
                displayInTotals,
                displayInTotalsValues: displayInTotals ? [...displayInTotals] : null,
                displayTotals
            });

            // 确保是数组
            const safeDisplayOutTotals = Array.isArray(displayOutTotals) ? displayOutTotals : [];
            const safeDisplayInTotals = Array.isArray(displayInTotals) ? displayInTotals : [];

            // 确保数组有足够长度，并用0填充空缺
            const paddedOutTotals = [...safeDisplayOutTotals];
            const paddedInTotals = [...safeDisplayInTotals];
            while (paddedOutTotals.length < players.length) {
                paddedOutTotals.push(0);
            }
            while (paddedInTotals.length < players.length) {
                paddedInTotals.push(0);
            }

            console.log('[ScoreTable] calculateDisplayData 准备setData:', {
                paddedOutTotals,
                paddedInTotals,
                playersLength: players.length
            });

            this.setData({
                displayScores,
                displayTotals,
                displayOutTotals: paddedOutTotals,
                displayInTotals: paddedInTotals
            });

            setTimeout(() => {
                const outTotals = this.data.displayOutTotals || [];
                console.log('[ScoreTable] calculateDisplayData setData 完成:', {
                    displayOutTotals: outTotals,
                    displayOutTotalsValues: [...outTotals],
                    playersLength: this.data.players?.length
                });
            }, 50);
        },

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
