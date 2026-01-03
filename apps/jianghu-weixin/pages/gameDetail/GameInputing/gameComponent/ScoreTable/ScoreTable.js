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
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    players: 'players',
                    red_blue: 'red_blue',
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
            // 数据不完整时，不执行计算，重置显示数据
            if (!scores || !players || !holeList || players.length === 0 || holeList.length === 0) {
                // 如果数据被清空，重置显示数据，避免显示不完整的表格
                if (this.data.displayScores !== null) {
                    this.setData({
                        displayScores: null,
                        displayTotals: null,
                        displayOutTotals: null,
                        displayInTotals: null
                    });
                }
                return;
            }

            this.runAtomicScoreUpdate(players, holeList, red_blue);
        }
    },

    methods: {
        // ===================== 数据计算相关 =====================
        /**
         * 汇总分数统计的原子操作: 计算显示矩阵、前后九合计、总杆并同步 handicap
         */
        runAtomicScoreUpdate(players, holeList, red_blue = []) {
            if (!Array.isArray(players) || players.length === 0) return;
            if (!Array.isArray(holeList) || holeList.length === 0) return;

            if (this._isUpdatingHandicap || this._isCalculating) {
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

            this._isUpdatingHandicap = true;
            gameStore.updatePlayersHandicaps(holeList, scoreIndex);
            setTimeout(() => {
                this._isUpdatingHandicap = false;
            }, 0);

            const paddedOutTotals = normalizeTotalsLength(displayOutTotals, players.length);
            const paddedInTotals = normalizeTotalsLength(displayInTotals, players.length);

            // 使用 nextTick 确保在同一个渲染周期内完成所有数据更新，避免闪烁
            this.setData({
                displayScores,
                displayTotals,
                displayOutTotals: paddedOutTotals,
                displayInTotals: paddedInTotals
            });

            setTimeout(() => {
                this._isCalculating = false;
            }, 50);
        },

        /**
         * 手动触发一次统计计算（备用）
         */
        calculateDisplayData() {
            const players = this.data.players || [];
            const holeList = this.data.holeList || [];
            const redBlue = this.data.red_blue || [];
            this.runAtomicScoreUpdate(players, holeList, redBlue);
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
        }
    }
})
