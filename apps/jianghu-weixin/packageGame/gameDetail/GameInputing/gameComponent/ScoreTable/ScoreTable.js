import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'
import { holeRangeStore } from '@/stores/game/holeRangeStore'
import { scoreStore } from '@/stores/game/scoreStore'
import { buildScoreIndex } from '@/utils/gameUtils'
import { buildScoreTableBase } from './scoreTableViewModel'
import { buildOneballViewModel } from './oneballViewModel'

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
            if (this._handicapDebounceTimer) {
                clearTimeout(this._handicapDebounceTimer);
                this._handicapDebounceTimer = null;
            }
            this._baseCache = null;
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
            if (!scores || !players || !holeList || players.length === 0 || holeList.length === 0 || !gameData) {
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
                        oneballDisplayScores: null,
                        renderPlayers: [], // 重置为空数组
                    });
                }
                this._baseCache = null;
                return;
            }

            const scoreIndex = buildScoreIndex(scores);

            // 独立更新 handicap，避免与渲染计算耦合
            this.scheduleHandicapUpdate(scoreIndex, holeList);

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
                    return;
                }

                // renderPlayers 由 runAtomicScoreUpdate 统一设置，避免闪烁
                if (players.length > 0) {
                    this.runAtomicScoreUpdate(players, holeList, red_blue, gameData, groupid, scores, scoreIndex);
                } else {
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
        runAtomicScoreUpdate(playersForUpdate, holeList, red_blue = [], gameData = null, groupid = null, scores = null, scoreIndex = null) {

            if (!Array.isArray(playersForUpdate) || playersForUpdate.length === 0) return;
            if (!Array.isArray(holeList) || holeList.length === 0) return;

            const canReuseBase = !!this._baseCache
                && this._baseCache.playersRef === playersForUpdate
                && this._baseCache.holeListRef === holeList
                && this._baseCache.redBlueRef === red_blue
                && this._baseCache.scoresRef === scores;

            const baseData = canReuseBase
                ? this._baseCache.baseData
                : buildScoreTableBase({
                    players: playersForUpdate,
                    holeList,
                    red_blue,
                    scoreIndex
                });

            if (!canReuseBase) {
                this._baseCache = {
                    playersRef: playersForUpdate,
                    holeListRef: holeList,
                    redBlueRef: red_blue,
                    scoresRef: scores,
                    baseData
                };
            }

            const oneballData = buildOneballViewModel(
                playersForUpdate,
                holeList,
                baseData.displayScores,
                baseData.displayTotals,
                baseData.displayOutTotals,
                baseData.displayInTotals,
                gameData,
                groupid
            );

            const {
                displayScores,
                displayTotals,
                displayOutTotals,
                displayInTotals
            } = baseData;

            const {
                isOneballMode,
                oneballRows,
                oneballMatchResults,
                oneballRowTotals,
                oneballRowOutTotals,
                oneballRowInTotals,
                oneballDisplayScores
            } = oneballData;

            // 在oneball模式下，displayScores 不再被修改
            const finalDisplayScores = displayScores;

            this.setData({
                renderPlayers: playersForUpdate, // 与 isOneballMode 同步设置，避免闪烁
                displayScores: finalDisplayScores,
                displayTotals,
                displayOutTotals,
                displayInTotals,
                isOneballMode,
                oneballRows,
                oneballMatchResults,
                oneballRowTotals,
                oneballRowOutTotals,
                oneballRowInTotals,
                oneballDisplayScores
            });
        },

        /**
         * 手动触发一次统计计算（备用）
         */
        calculateDisplayData() {
            const playersForUpdate = (this.data.players && this.data.players.length)
                ? this.data.players
                : (this.data.renderPlayers || []);
            const holeList = this.data.holeList || [];
            const redBlue = this.data.red_blue || [];
            const gameData = this.data.gameData || null;
            const groupid = this.data.groupid || null;
            const scores = this.data.playerScores || null;
            const scoreIndex = Array.isArray(scores) ? buildScoreIndex(scores) : null;
            this.runAtomicScoreUpdate(playersForUpdate, holeList, redBlue, gameData, groupid, scores, scoreIndex);
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

        scheduleHandicapUpdate(scoreIndex, holeList) {
            if (!Array.isArray(holeList) || holeList.length === 0) return;
            if (!scoreIndex) return;

            if (this._handicapDebounceTimer) {
                clearTimeout(this._handicapDebounceTimer);
            }

            this._handicapDebounceTimer = setTimeout(() => {
                this._handicapDebounceTimer = null;
                wx.nextTick(() => {
                    gameStore.updatePlayersHandicaps(holeList, scoreIndex);
                });
            }, 100);
        }
    }
})
