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
            console.log('🟡🟠🔴🟢🔵🟡 gameData:', gameData);
            if (!Array.isArray(players) || players.length === 0) return;
            if (!Array.isArray(holeList) || holeList.length === 0) return;

            if (this._isCalculating) return;
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
                oneballRowInTotals
            } = this.computeOneballRows(players, holeList, displayScores, displayTotals, displayOutTotals, displayInTotals, gameData, groupid);

            // 更新 handicap（使用 nextTick 避免阻塞渲染）
            wx.nextTick(() => {
                gameStore.updatePlayersHandicaps(holeList, scoreIndex);
            });

            const paddedOutTotals = normalizeTotalsLength(displayOutTotals, players.length);
            const paddedInTotals = normalizeTotalsLength(displayInTotals, players.length);

            this.setData({
                displayScores,
                displayTotals,
                displayOutTotals: paddedOutTotals,
                displayInTotals: paddedInTotals,
                isOneballMode,
                oneballRows,
                oneballMatchResults,
                oneballRowTotals,
                oneballRowOutTotals,
                oneballRowInTotals
            }, () => {
                this._isCalculating = false;
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
                    oneballRowInTotals: []
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
                    oneballRowInTotals: []
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
                    oneballRowInTotals: []
                };
            }

            const groupAIndex = groupedPlayers.A[0].index;
            const groupBIndex = groupedPlayers.B[0].index;

            // 仅非 common 类型时添加中间结果行
            const showScoreRow = gameData?.game_type !== 'common';
            const oneballRows = [
                { key: 'A', type: 'group', label: 'A组', playerIndex: groupAIndex, players: groupedPlayers.A },
                ...(showScoreRow ? [{ key: 'score', type: 'score', label: '得分' }] : []),
                { key: 'B', type: 'group', label: 'B组', playerIndex: groupBIndex, players: groupedPlayers.B }
            ];

            const oneballMatchResults = holeList.map((_, holeIndex) => {
                const aScore = displayScores?.[groupAIndex]?.[holeIndex]?.score;
                const bScore = displayScores?.[groupBIndex]?.[holeIndex]?.score;
                const hasScore = typeof aScore === 'number' && aScore > 0 && typeof bScore === 'number' && bScore > 0;
                if (!hasScore) {
                    return { text: '', status: 'empty' };
                }
                if (aScore < bScore) {
                    return { text: '1UP', status: 'win' };
                }
                if (aScore > bScore) {
                    return { text: '-1', status: 'lose' };
                }
                return { text: 'A/S', status: 'tie' };
            });

            const oneballRowTotals = [
                displayTotals?.[groupAIndex] ?? null,
                null,
                displayTotals?.[groupBIndex] ?? null
            ];
            const oneballRowOutTotals = [
                displayOutTotals?.[groupAIndex] ?? null,
                null,
                displayOutTotals?.[groupBIndex] ?? null
            ];
            const oneballRowInTotals = [
                displayInTotals?.[groupAIndex] ?? null,
                null,
                displayInTotals?.[groupBIndex] ?? null
            ];

            return {
                isOneballMode: true,
                oneballRows,
                oneballMatchResults,
                oneballRowTotals,
                oneballRowOutTotals,
                oneballRowInTotals
            };
        }
    }
})
