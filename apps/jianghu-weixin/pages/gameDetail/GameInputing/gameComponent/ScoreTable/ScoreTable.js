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

            const redBlueMap = {};
            for (const item of (red_blue || [])) {
                redBlueMap[String(item?.hindex)] = item;
            }

            const displayScores = players.map(player => {
                const scoreMap = {};
                for (const s of (scores || [])) {
                    if (s?.hindex && String(s?.userid) === String(player?.userid)) scoreMap[String(s?.hindex)] = s;
                }
                return holeList.map(hole => {
                    const cell = scoreMap[String(hole?.hindex)] || {};
                    const rb = redBlueMap[String(hole?.hindex)];
                    let colorTag = '';
                    if (rb) {
                        if ((rb.red || []).map(String).includes(String(player?.userid))) colorTag = 'red';
                        if ((rb.blue || []).map(String).includes(String(player?.userid))) colorTag = 'blue';
                    }
                    return { ...cell, colorTag };
                });
            });

            const displayTotals = displayScores.map(playerArr =>
                playerArr.reduce((sum, s) => sum + (typeof s.score === 'number' ? s.score : 0), 0)
            );

            // 计算OUT和IN汇总 (仅18洞时)
            let displayOutTotals = [];
            let displayInTotals = [];

            if (holeList.length === 18) {
                displayOutTotals = displayScores.map(playerArr => {
                    // OUT: 前9洞 (索引0-8)
                    return playerArr.slice(0, 9).reduce((sum, s) => sum + (typeof s.score === 'number' ? s.score : 0), 0);
                });

                displayInTotals = displayScores.map(playerArr => {
                    // IN: 后9洞 (索引9-17)
                    return playerArr.slice(9, 18).reduce((sum, s) => sum + (typeof s.score === 'number' ? s.score : 0), 0);
                });
            }


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
        }
    }
})
