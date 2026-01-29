import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'
import { holeRangeStore } from '@/stores/game/holeRangeStore'
import { scoreStore } from '@/stores/game/scoreStore'
import {
    computeScoreTableStats,
    normalizeTotalsLength
} from './scoreTableCalculator'

Component({
    data: {
        scrollSync: true,
        scrollTop: 0,
        players: [],
        renderPlayers: [], // 改为空数组而不是 null，避免初始渲染问题
        holeList: [],
        playerScores: [],
        displayScores: null, // 初始为 null，避免渲染空数组
        displayTotals: null, // 初始为 null，避免渲染空数组
        displayOutTotals: null, // 初始为 null，避免渲染空数组
        displayInTotals: null, // 初始为 null，避免渲染空数组
        red_blue: [],
        isOneballMode: false,
        oneballRows: [],
        oneballMatchResults: [],
        oneballRowTotals: [],
        oneballRowOutTotals: [],
        oneballRowInTotals: [],
        oneballDisplayScores: null,
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    players: 'players',
                    red_blue: 'red_blue',
                    gameData: 'gameData',
                    groupid: 'groupid',
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
                },
                actions: [],
            });

            this.scrollToLeft();
        },

        detached() {
            // 清除防抖定时器
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
                this._debounceTimer = null;
            }
            this._pendingScoreUpdate = null;
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
        'playerScores,players,holeList,red_blue,gameData,groupid': function (scores, players, holeList, red_blue, gameData, groupid) {
            console.log('DEBUG observer triggered:', {
                hasScores: !!scores,
                playersCount: players?.length,
                holesCount: holeList?.length,
                hasGameData: !!gameData,
                groupid: groupid,
                scoringType: gameData?.scoring_type
            });

            // 数据不完整时，不执行计算
            if (!scores || !players || !holeList || players.length === 0 || holeList.length === 0 || !gameData) {
                console.log('DEBUG data incomplete, resetting');
                if (this.data.displayScores !== null || this.data.renderPlayers.length > 0) {
                    this.setData({
                        displayScores: null,
                        displayTotals: null,
                        displayOutTotals: null,
                        displayInTotals: null,
                        isOneballMode: false,
                        oneballRows: [],
                        oneballMatchResults: [],
                        oneballRowTotals: [],
                        oneballRowOutTotals: [],
                        oneballRowInTotals: [],
                        renderPlayers: [], // 重置为空数组
                    });
                }
                return;
            }

            // 使用防抖，避免多个 store 数据陆续到达时重复计算
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
            }

            // 记录当前 players 数量，用于检测是否稳定
            this._lastPlayersCount = players.length;

            this._debounceTimer = setTimeout(() => {
                this._debounceTimer = null;

                // 如果 players 数量在防抖期间又变化了，说明 store 还在更新，继续等待
                if (this._lastPlayersCount !== players.length) {
                    console.log('DEBUG players count changed during debounce, waiting for stability');
                    return;
                }

                // 根据当前分组筛选球员
                let playersForView = players;
                // 仅当有分组且指定了 groupid 时才进行筛选
                if (gameData && Array.isArray(gameData.groups) && gameData.groups.length > 0 && groupid) {
                    const currentGroup = gameData.groups.find(g => String(g.groupid) === String(groupid));
                    console.log('DEBUG filtering players:', {
                        groupsCount: gameData.groups.length,
                        groupid: groupid,
                        foundGroup: !!currentGroup,
                        groupPlayers: currentGroup?.players?.length
                    });
                    if (currentGroup && Array.isArray(currentGroup.players) && currentGroup.players.length > 0) {
                        const playerIdsInGroup = new Set(currentGroup.players.map(p => p.user_id));
                        playersForView = players.filter(p => playerIdsInGroup.has(p.user_id));
                        console.log('DEBUG filtered playersForView:', playersForView.length);
                    } else if (currentGroup) {
                        // 找到分组但没有 players 数组，使用所有球员
                        console.log('DEBUG group found but no players array, using all players');
                        playersForView = players;
                    } else {
                        // 找不到分组，可能是数据竞争。暂时不渲染任何内容。
                        playersForView = [];
                        console.log('DEBUG group not found, playersForView set to empty');
                    }
                } else {
                    console.log('DEBUG no filtering, using all players:', players.length);
                }

                // 不再提前设置 renderPlayers，而是在 runAtomicScoreUpdate 中一起设置
                // 这样可以避免 renderPlayers 和 isOneballMode 不同步导致的闪烁

                if (playersForView.length > 0) {
                     this.runAtomicScoreUpdate(playersForView, holeList, red_blue, gameData, groupid);
                } else {
                    console.log('DEBUG playersForView is empty, setting empty state');
                    // 如果没有球员数据，也需要设置 renderPlayers 为空数组，避免显示旧数据
                    this.setData({
                        renderPlayers: [],
                        displayScores: null,
                        displayTotals: null,
                        displayOutTotals: null,
                        displayInTotals: null,
                        isOneballMode: false,
                        oneballRows: [],
                        oneballMatchResults: [],
                        oneballRowTotals: [],
                        oneballRowOutTotals: [],
                        oneballRowInTotals: [],
                        oneballDisplayScores: null
                    });
                }
            }, 100); // 增加防抖时间，等待 store 完成更新
        }
    },

    methods: {
        /**
         * 汇总分数统计的原子操作
         */
        runAtomicScoreUpdate(playersForUpdate, holeList, red_blue = [], gameData = null, groupid = null) {

            console.log('DEBUG runAtomicScoreUpdate called:', {
                playersCount: playersForUpdate.length,
                holesCount: holeList.length,
                scoringType: gameData?.scoring_type
            });

            if (!Array.isArray(playersForUpdate) || playersForUpdate.length === 0) return;
            if (!Array.isArray(holeList) || holeList.length === 0) return;

            if (this._isCalculating) {
                this._pendingScoreUpdate = { playersForUpdate, holeList, red_blue, gameData, groupid };
                return;
            }
            this._isCalculating = true;

            const {
                displayScores,
                displayTotals,
                displayOutTotals,
                displayInTotals,
                scoreIndex
            } = computeScoreTableStats(playersForUpdate, holeList, red_blue);

            console.log('DEBUG computed stats:', {
                hasDisplayScores: !!displayScores,
                displayScoresLength: displayScores?.length,
                hasDisplayTotals: !!displayTotals
            });

            const {
                isOneballMode,
                oneballRows,
                oneballMatchResults,
                oneballRowTotals,
                oneballRowOutTotals,
                oneballRowInTotals,
                oneballDisplayScores
            } = this.computeOneballRows(playersForUpdate, holeList, displayScores, displayTotals, displayOutTotals, displayInTotals, gameData, groupid);

            console.log('DEBUG oneball computed:', {
                isOneballMode,
                oneballRowsCount: oneballRows.length,
                oneballRows: oneballRows.map(r => ({ key: r.key, type: r.type, playersCount: r.players?.length }))
            });

            // 在oneball模式下，displayScores 不再被修改
            const finalDisplayScores = displayScores;

 
            if (isOneballMode && finalDisplayScores) {
  
                // 检查A组和B组的成绩
                const aScore0 = oneballDisplayScores[0]?.[0]?.score;
                const bScore0 = oneballDisplayScores[1]?.[0]?.score;
             }

            // 更新 handicap（使用 nextTick 避免阻塞渲染）
            wx.nextTick(() => {
                gameStore.updatePlayersHandicaps(holeList, scoreIndex);
            });

            const paddedOutTotals = normalizeTotalsLength(displayOutTotals, playersForUpdate.length);
            const paddedInTotals = normalizeTotalsLength(displayInTotals, playersForUpdate.length);

            console.log('DEBUG setData about to be called:', {
                renderPlayersCount: playersForUpdate.length,
                isOneballMode,
                oneballRowsCount: oneballRows.length,
                hasDisplayScores: !!finalDisplayScores,
                hasDisplayTotals: !!displayTotals
            });

            this.setData({
                renderPlayers: playersForUpdate, // 与 isOneballMode 同步设置，避免闪烁
                displayScores: finalDisplayScores,
                displayTotals,
                displayOutTotals: paddedOutTotals,
                displayInTotals: paddedInTotals,
                isOneballMode,
                oneballRows,
                oneballMatchResults,
                oneballRowTotals,
                oneballRowOutTotals,
                oneballRowInTotals,
                oneballDisplayScores
            }, () => {
 
                this._isCalculating = false;
                if (this._pendingScoreUpdate) {
                    const pending = this._pendingScoreUpdate;
                    this._pendingScoreUpdate = null;
                    this.runAtomicScoreUpdate(
                        pending.playersForUpdate,
                        pending.holeList,
                        pending.red_blue,
                        pending.gameData,
                        pending.groupid
                    );
                }
            });
        },

        /**
         * 手动触发一次统计计算（备用）
         */
        calculateDisplayData() {
            const playersForUpdate = this.data.renderPlayers || [];
            const holeList = this.data.holeList || [];
            const redBlue = this.data.red_blue || [];
            const gameData = this.data.gameData || null;
            const groupid = this.data.groupid || null;
            this.runAtomicScoreUpdate(playersForUpdate, holeList, redBlue, gameData, groupid);
        },

        // ===================== UI 交互相关 =====================
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

        computeOneballRows(players, holeList, displayScores, displayTotals, displayOutTotals, displayInTotals, gameData, groupid) {
            const scoringType = gameData?.scoring_type || '';
            console.log('DEBUG computeOneballRows:', {
                scoringType,
                playersCount: players.length,
                hasDisplayScores: !!displayScores
            });

            if (scoringType !== 'oneball') {
                console.log('DEBUG not oneball mode');
                return {
                    isOneballMode: false,
                    oneballRows: [],
                    oneballMatchResults: [],
                    oneballRowTotals: [],
                    oneballRowOutTotals: [],
                    oneballRowInTotals: [],
                    modifiedDisplayScores: null
                };
            }

            const groups = Array.isArray(gameData?.groups) ? gameData.groups : [];
            const currentGroup = groups.find(group => String(group.groupid) === String(groupid));
            const groupOneballConfig = currentGroup?.groupOneballConfig;

            console.log('DEBUG oneball config:', {
                hasCurrentGroup: !!currentGroup,
                hasGroupOneballConfig: !!groupOneballConfig,
                groupOneballConfig
            });

            if (!groupOneballConfig || typeof groupOneballConfig !== 'object') {
                console.log('DEBUG no valid groupOneballConfig');
                return {
                    isOneballMode: false,
                    oneballRows: [],
                    oneballMatchResults: [],
                    oneballRowTotals: [],
                    oneballRowOutTotals: [],
                    oneballRowInTotals: [],
                    modifiedDisplayScores: null
                };
            }

            const groupedPlayers = { A: [], B: [] };
            let hasInvalidConfig = false;
            players.forEach((player, index) => {
                const side = groupOneballConfig[String(player.user_id)];
                if (side !== 'A' && side !== 'B') {
                    hasInvalidConfig = true;
                    return;
                }
                groupedPlayers[side].push({ ...player, index });
            });

            console.log('DEBUG grouped players:', {
                groupACount: groupedPlayers.A.length,
                groupBCount: groupedPlayers.B.length,
                hasInvalidConfig,
                groupA: groupedPlayers.A.map(p => ({ user_id: p.user_id, show_name: p.show_name })),
                groupB: groupedPlayers.B.map(p => ({ user_id: p.user_id, show_name: p.show_name }))
            });

            if (hasInvalidConfig || groupedPlayers.A.length === 0 || groupedPlayers.B.length === 0) {
                return {
                    isOneballMode: false,
                    oneballRows: [],
                    oneballMatchResults: [],
                    oneballRowTotals: [],
                    oneballRowOutTotals: [],
                    oneballRowInTotals: [],
                    modifiedDisplayScores: null
                };
            }

            const groupAIndex = groupedPlayers.A[0].index;
            const groupBIndex = groupedPlayers.B[0].index;

            const oneballDisplayScores = [];
            // 计算A组最佳成绩
            oneballDisplayScores.push(holeList.map((hole, holeIndex) => {
                const aScores = groupedPlayers.A
                    .map(p => displayScores?.[p.index]?.[holeIndex])
                    .filter(s => s && typeof s.score === 'number' && s.score > 0);
                if (aScores.length > 0) {
                    return aScores.reduce((best, current) => current.score < best.score ? current : best);
                }
                return displayScores[groupAIndex][holeIndex];
            }));
            // 计算B组最佳成绩
            oneballDisplayScores.push(holeList.map((hole, holeIndex) => {
                const bScores = groupedPlayers.B
                    .map(p => displayScores?.[p.index]?.[holeIndex])
                    .filter(s => s && typeof s.score === 'number' && s.score > 0);
                if (bScores.length > 0) {
                    return bScores.reduce((best, current) => current.score < best.score ? current : best);
                }
                return displayScores[groupBIndex][holeIndex];
            }));

            // 仅非 common 类型时添加中间结果行
            // 比杆赛没有中间，比洞赛才有



            const holeBasedMatchTypes = ['fourball_bestball_match', 'fourball_scramble_match', 'foursome_match', 'individual_match'];
            const showMiddleRow = (gameData?.game_type !== 'common') && (holeBasedMatchTypes.includes(gameData.game_type));
            
            const oneballRows = [
                { key: 'A', type: 'group', label: 'A组', playerIndex: 0, players: groupedPlayers.A },
                ...(showMiddleRow ? [{ key: 'score', type: 'score', label: '得分' }] : []),
                { key: 'B', type: 'group', label: 'B组', playerIndex: 1, players: groupedPlayers.B }
            ];

 
            const oneballMatchResults = holeList.map((_, holeIndex) => {
                // 使用oneballDisplayScores中的最佳成绩
                const aScore = oneballDisplayScores?.[0]?.[holeIndex]?.score;
                const bScore = oneballDisplayScores?.[1]?.[holeIndex]?.score;

  
                // 如果任一组没有有效成绩，返回空
                if (!aScore || !bScore || aScore <= 0 || bScore <= 0) {
                    if (holeIndex === 0) {
                     }
                    return { text: '', status: 'empty' };
                }

                // 显示格式：A组最佳成绩,B组最佳成绩
                const scoreText = `${aScore},${bScore}`;

                if (holeIndex === 0) {
                 }

                // 判断胜负状态
                if (aScore < bScore) {
                    return { text: scoreText, status: 'win' };
                }
                if (aScore > bScore) {
                    return { text: scoreText, status: 'lose' };
                }
                return { text: scoreText, status: 'tie' };
            });

  
            // 根据是否显示中间行来构建totals数组
            const oneballRowTotals = showMiddleRow
                ? [
                    displayTotals?.[groupAIndex] ?? null,
                    null,  // 中间得分行没有total
                    displayTotals?.[groupBIndex] ?? null
                ]
                : [
                    displayTotals?.[groupAIndex] ?? null,
                    displayTotals?.[groupBIndex] ?? null
                ];

            const oneballRowOutTotals = showMiddleRow
                ? [
                    displayOutTotals?.[groupAIndex] ?? null,
                    null,
                    displayOutTotals?.[groupBIndex] ?? null
                ]
                : [
                    displayOutTotals?.[groupAIndex] ?? null,
                    displayOutTotals?.[groupBIndex] ?? null
                ];

            const oneballRowInTotals = showMiddleRow
                ? [
                    displayInTotals?.[groupAIndex] ?? null,
                    null,
                    displayInTotals?.[groupBIndex] ?? null
                ]
                : [
                    displayInTotals?.[groupAIndex] ?? null,
                    displayInTotals?.[groupBIndex] ?? null
                ];

            return {
                isOneballMode: true,
                oneballRows,
                oneballMatchResults,
                oneballRowTotals,
                oneballRowOutTotals,
                oneballRowInTotals,
                oneballDisplayScores, // 使用新的专用数据
                modifiedDisplayScores: null // 废弃
            };

        }
    }
})
