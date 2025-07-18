import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../../stores/gameStore'
import { scoreStore } from '../../../stores/scoreStore'

Component({
    data: {
        scrollSync: true, // 是否同步滚动
        scrollTop: 0,     // 当前滚动位置
    },

    lifetimes: {
        attached() {
            // ** 核心:创建 Store 和 Component 的绑定 **
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    players: 'players',
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
            // 数据加载后滚动到最左侧
            this.scrollToLeft();
        },
        detached() {
            // ** 关键:在组件销毁时清理绑定 **
            this.storeBindings.destroyStoreBindings();
            this.scoreStoreBindings.destroyStoreBindings();
        }
    },

    observers: {
        'playerScores': (newScores) => {


            // 详细检查变化内容
            if (newScores && newScores.length > 0) {
                // 检查是否有非零分数, 表示真正的数据更新
                let hasRealData = false;
                const changedCells = [];

                for (let p = 0; p < newScores.length; p++) {
                    for (let h = 0; h < (newScores[p]?.length || 0); h++) {
                        const score = newScores[p][h]?.score;
                        if (score > 0) {
                            hasRealData = true;
                            changedCells.push(`玩家${p}洞${h}:${score}`);
                        }
                    }
                }

                if (hasRealData) {
                    console.log('📊 [ScoreTable] 检测到分数数据更新, 界面应该同步');
                    console.log('📊 [ScoreTable] 变化的格子:', changedCells.slice(0, 5)); // 只显示前5个
                } else {
                    console.log('📊 [ScoreTable] 监听到变化但都是初始数据(0分)');
                }
            }
        },

        // 添加对其他字段的监听, 测试MobX绑定是否正常
        'players': (newPlayers) => {
            console.log('📊 [ScoreTable] players变化检测:', newPlayers?.length);
        },

        'holeList': (newHoles) => {
            console.log('📊 [ScoreTable] holeList变化检测:', newHoles?.length);
        }
    },

    methods: {
        // 滚动到最左侧
        scrollToLeft() {
            const query = wx.createSelectorQuery().in(this);
            query.select('#mainScroll').node().exec((res) => {
                if (res[0]?.node) {
                    res[0].node.scrollTo({ left: 0, behavior: 'auto' });
                }
            });
        },

        // 球员表格滚动事件
        onPlayerScroll(e) {
            if (!this.data.scrollSync) return;
            const scrollTop = e.detail.scrollTop;
            this.setData({ scrollTop });
            this.syncScrollPosition('holesTable', scrollTop);
            this.syncScrollPosition('totalTable', scrollTop);
        },

        // 球洞表格滚动事件
        onHolesScroll(e) {
            if (!this.data.scrollSync) return;
            const scrollTop = e.detail.scrollTop;
            this.setData({ scrollTop });
            this.syncScrollPosition('playerTable', scrollTop);
            this.syncScrollPosition('totalTable', scrollTop);
        },

        // 总分表格滚动事件
        onTotalScroll(e) {
            if (!this.data.scrollSync) return;
            const scrollTop = e.detail.scrollTop;
            this.setData({ scrollTop });
            this.syncScrollPosition('playerTable', scrollTop);
            this.syncScrollPosition('holesTable', scrollTop);
        },

        // 同步滚动位置
        syncScrollPosition(tableId, scrollTop) {
            const query = wx.createSelectorQuery().in(this);
            query.select(`#${tableId}`).node().exec((res) => {
                if (res[0]?.node) {
                    res[0].node.scrollTop = scrollTop;
                }
            });
        },

        // 作为一个中继, 把事件继续往父组件传递
        onCellClick: function (e) {
            console.log('📊 [ScoreTable] 转发cellclick事件:', e.detail);
            this.triggerEvent('cellclick', e.detail);
        }
    }
})
