import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../../stores/gameStore'

Component({
    properties: {
        // gameId 和 gameData 将通过 store 获取，不再需要作为属性传递
    },

    data: {
        // playerScores, players, holeList, playerTotals 将从 store 映射过来
        scrollSync: true, // 是否同步滚动
        scrollTop: 0,     // 当前滚动位置
    },

    lifetimes: {
        attached() {
            // ** 核心：创建 Store 和 Component 的绑定 **
            this.storeBindings = createStoreBindings(this, {
                store: gameStore, // 需要绑定的 store
                fields: {
                    // players, holes, scores 是 store 中的字段名
                    // this.data.players, this.data.holeList, this.data.playerScores 是组件中的字段名
                    players: 'players',
                    holeList: 'holes',
                    playerScores: 'scores',
                    // 如果需要总分，可以在 store 中用 computed 计算，这里暂时保留
                    // playerTotals: () => { ... 计算逻辑 ... }
                },
                actions: [], // 此组件不需要调用 action，只负责展示
            });

            // 数据加载后滚动到最左侧
            // 可以在 store 中增加一个加载完成的标记来触发
            this.scrollToLeft();
        },
        detached() {
            // ** 关键：在组件销毁时清理绑定 **
            this.storeBindings.destroyStoreBindings();
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
        }
    }
})