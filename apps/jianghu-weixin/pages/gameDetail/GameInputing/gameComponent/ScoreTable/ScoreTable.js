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
                    // 注意：不再绑定 playerTotalScores，因为使用的是 displayTotals（通过 calculateDisplayTotals 计算）
                },
                actions: [],
            });

            this.scrollToLeft();

            // 注意：不再手动调用 calculateDisplayData
            // observers 会在 store bindings 建立后，数据变化时自动触发计算
            // 这样可以避免重复计算（原子操作只执行一次）
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
            // 数据不完整时，不执行计算
            if (!scores || !players || !holeList || players.length === 0 || holeList.length === 0) {
                return;
            }

            // 如果正在更新 handicap，跳过此次触发（避免循环）
            if (this._isUpdatingHandicap) {
                return;
            }

            // 如果正在执行计算，跳过此次触发（避免重复）
            if (this._isCalculating) {
                return;
            }
            this._isCalculating = true;

            console.log('[ScoreTable] 原子操作：observers 触发，开始同时计算3个统计值', {
                scoresLength: scores?.length,
                playersLength: players?.length,
                holeListLength: holeList?.length,
                red_blueLength: red_blue?.length
            });

            // ========== 原子操作开始：三个计算同时执行（都在 gameStore 中） ==========
            // 1. 计算显示分数矩阵（所有计算的基础）
            const displayScores = scoreStore.calculateDisplayScores(players, holeList, red_blue);

            // 2. 并行计算三个统计值（基于同一份 displayScores，都在 gameStore 中）
            const displayTotals = gameStore.calculateDisplayTotals(displayScores);
            const { displayOutTotals, displayInTotals } = gameStore.calculateOutInTotals(displayScores, holeList);

            // 3. 同时更新 players 的 handicap（使用相同的 players 和 holeList）
            // 设置标志位，防止循环触发
            this._isUpdatingHandicap = true;
            gameStore.updatePlayersHandicaps(holeList);
            // 延迟重置标志位，确保响应式更新完成
            setTimeout(() => {
                this._isUpdatingHandicap = false;
            }, 0);
            // ========== 原子操作结束 ==========


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

            this.setData({
                displayScores,
                displayTotals,
                displayOutTotals: paddedOutTotals,
                displayInTotals: paddedInTotals
            });

            // 重置计算标志位（延迟以确保 setData 完成）
            setTimeout(() => {
                this._isCalculating = false;

                // 验证设置后的数据
                const outTotals = this.data.displayOutTotals || [];
                const inTotals = this.data.displayInTotals || [];

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
         * 手动计算显示数据（备用方法，通常不需要手动调用）
         * 注意：现在主要通过 observers 自动触发，此方法保留用于特殊场景
         */
        calculateDisplayData() {
            const players = this.data.players || [];
            const holeList = this.data.holeList || [];
            const red_blue = this.data.red_blue || [];
            const scores = this.data.playerScores || [];

            console.log('[ScoreTable] calculateDisplayData 手动触发（原子操作）:', {
                playersLength: players.length,
                holeListLength: holeList.length,
                scoresLength: scores.length
            });

            if (!players.length || !holeList.length) {
                console.warn('[ScoreTable] calculateDisplayData: 数据不完整，跳过计算');
                return;
            }

            // 如果正在执行计算，跳过此次触发（避免重复）
            if (this._isCalculating) {
                console.log('[ScoreTable] calculateDisplayData: 正在计算中，跳过此次调用');
                return;
            }
            this._isCalculating = true;

            // ========== 原子操作开始：三个计算同时执行（都在 gameStore 中） ==========
            // 1. 计算显示分数矩阵（所有计算的基础）
            const displayScores = scoreStore.calculateDisplayScores(players, holeList, red_blue);

            // 2. 并行计算三个统计值（基于同一份 displayScores，都在 gameStore 中）
            const displayTotals = gameStore.calculateDisplayTotals(displayScores);
            const { displayOutTotals, displayInTotals } = gameStore.calculateOutInTotals(displayScores, holeList);

            // 3. 同时更新 players 的 handicap（使用相同的 players 和 holeList）
            gameStore.updatePlayersHandicaps(holeList);
            // ========== 原子操作结束 ==========

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

            // 重置计算标志位（延迟以确保 setData 完成）
            setTimeout(() => {
                this._isCalculating = false;

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
