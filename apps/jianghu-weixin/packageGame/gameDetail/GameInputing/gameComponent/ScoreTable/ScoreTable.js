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
            // 数据不完整时，不执行计算
            if (!scores || !players || !holeList || players.length === 0 || holeList.length === 0) {
                if (this.data.displayScores !== null) {
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
                        oneballRowInTotals: []
                    });
                }
                return;
            }

            // 使用防抖，避免多个 store 数据陆续到达时重复计算
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
            }
            this._debounceTimer = setTimeout(() => {
                this._debounceTimer = null;
                this.runAtomicScoreUpdate(players, holeList, red_blue, gameData, groupid);
            }, 16); // 约一帧的时间
        }
    },

    methods: {
        /**
         * 汇总分数统计的原子操作
         */
        runAtomicScoreUpdate(players, holeList, red_blue = [], gameData = null, groupid = null) {
           
            if (!Array.isArray(players) || players.length === 0) return;
            if (!Array.isArray(holeList) || holeList.length === 0) return;

            if (this._isCalculating) {
                this._pendingScoreUpdate = { players, holeList, red_blue, gameData, groupid };
                return;
            }
            this._isCalculating = true;

            const {
                displayScores,
                displayTotals,
                displayOutTotals,
                displayInTotals,
                scoreIndex
            } = computeScoreTableStats(players, holeList, red_blue);

            const {
                isOneballMode,
                oneballRows,
                oneballMatchResults,
                oneballRowTotals,
                oneballRowOutTotals,
                oneballRowInTotals,
                oneballDisplayScores
            } = this.computeOneballRows(players, holeList, displayScores, displayTotals, displayOutTotals, displayInTotals, gameData, groupid);

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

            const paddedOutTotals = normalizeTotalsLength(displayOutTotals, players.length);
            const paddedInTotals = normalizeTotalsLength(displayInTotals, players.length);

            this.setData({
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
                        pending.players,
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
            const players = this.data.players || [];
            const holeList = this.data.holeList || [];
            const redBlue = this.data.red_blue || [];
            const gameData = this.data.gameData || null;
            const groupid = this.data.groupid || null;
            this.runAtomicScoreUpdate(players, holeList, redBlue, gameData, groupid);
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
            if (scoringType !== 'oneball') {
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

            if (!groupOneballConfig || typeof groupOneballConfig !== 'object') {
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
