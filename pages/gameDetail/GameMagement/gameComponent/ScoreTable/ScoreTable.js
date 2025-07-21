import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../../../../stores/gameStore'
import { holeRangeStore } from '../../../../../stores/holeRangeStore'
import { scoreStore } from '../../../../../stores/scoreStore'

Component({
    data: {
        scrollSync: true, // 是否同步滚动
        scrollTop: 0,     // 当前滚动位置
        // 添加性能监控标记
        _lastDataCheck: 0,
        // 添加默认值，确保数据未准备好时不会出错
        players: [],
        holeList: [],
        playerScores: [],
        playerTotals: [],
    },

    lifetimes: {
        attached() {
            try {
                // ** 核心:创建 Store 和 Component 的绑定 **
                this.storeBindings = createStoreBindings(this, {
                    store: gameStore,
                    fields: {
                        players: 'players',
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

                // 数据加载后滚动到最左侧
                this.scrollToLeft();

                console.log('📊 [ScoreTable] 组件已挂载，绑定创建成功');
            } catch (error) {
                console.error('❌ [ScoreTable] 组件挂载失败:', error);
            }
        },
        detached() {
            try {
                // ** 关键:在组件销毁时清理绑定 **
                if (this.storeBindings) {
                    this.storeBindings.destroyStoreBindings();
                }
                if (this.holeRangeStoreBindings) {
                    this.holeRangeStoreBindings.destroyStoreBindings();
                }
                if (this.scoreStoreBindings) {
                    this.scoreStoreBindings.destroyStoreBindings();
                }
                console.log('📊 [ScoreTable] 组件已卸载，绑定已清理');
            } catch (error) {
                console.error('❌ [ScoreTable] 组件卸载时出错:', error);
            }
        }
    },

    observers: {
        'playerScores': function (newScores) {
            // 使用 function 声明而不是箭头函数，确保 this 绑定正确
            try {
                // 确保 this 存在且有 data 属性
                if (!this || !this.data) {
                    console.warn('⚠️ [ScoreTable] observers 中 this 或 this.data 为 undefined');
                    return;
                }

                const now = Date.now();
                // 简单的防抖：50ms内只处理一次
                if (now - this.data._lastDataCheck < 50) {
                    return;
                }
                this.setData({ _lastDataCheck: now });

                // 详细检查变化内容
                if (newScores && newScores.length > 0) {
                    const playerCount = newScores.length;
                    const holeCount = newScores[0]?.length || 0;

                    // 检查数据完整性
                    let missingData = 0;
                    let validData = 0;

                    for (let p = 0; p < playerCount; p++) {
                        for (let h = 0; h < holeCount; h++) {
                            const scoreData = newScores[p]?.[h];
                            if (scoreData && typeof scoreData.score === 'number') {
                                validData++;
                            } else {
                                missingData++;
                            }
                        }
                    }

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

                    console.log(`📊 [ScoreTable] 数据更新: ${playerCount}个玩家, ${holeCount}个洞, 有效数据: ${validData}, 缺失数据: ${missingData}`);

                    if (hasRealData) {
                        console.log('📊 [ScoreTable] 检测到分数数据更新, 界面应该同步');
                        console.log('📊 [ScoreTable] 变化的格子:', changedCells.slice(0, 5)); // 只显示前5个
                    } else {
                        console.log('📊 [ScoreTable] 监听到变化但都是初始数据(0分)');
                    }

                    // 如果缺失数据过多，发出警告
                    if (missingData > 0) {
                        console.warn(`⚠️ [ScoreTable] 发现${missingData}个缺失的分数数据`);
                    }
                }
            } catch (error) {
                console.error('❌ [ScoreTable] playerScores observer 执行出错:', error);
            }
        },

        // 添加对其他字段的监听, 测试MobX绑定是否正常
        'players': function (newPlayers) {
            try {
                // 确保 this 存在
                if (!this) {
                    console.warn('⚠️ [ScoreTable] players observers 中 this 为 undefined');
                    return;
                }

                console.log('📊 [ScoreTable] players变化检测:', newPlayers?.length);
                if (newPlayers?.length > 0) {
                    console.log('📊 [ScoreTable] 玩家数据示例:', newPlayers[0]);
                }
            } catch (error) {
                console.error('❌ [ScoreTable] players observer 执行出错:', error);
            }
        },

        'holeList': function (newHoles) {
            try {
                // 确保 this 存在
                if (!this) {
                    console.warn('⚠️ [ScoreTable] holeList observers 中 this 为 undefined');
                    return;
                }

                console.log('📊 [ScoreTable] holeList变化检测:', newHoles?.length);
                if (newHoles?.length > 0) {
                    console.log('📊 [ScoreTable] 球洞数据示例:', newHoles[0]);
                }
            } catch (error) {
                console.error('❌ [ScoreTable] holeList observer 执行出错:', error);
            }
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
        onCellClick(e) {
            console.log('📊 [ScoreTable] 转发cellclick事件:', e.detail);
            this.triggerEvent('cellclick', e.detail);
        },

        // 添加调试方法
        getTableStatus() {
            const status = {
                players: this.data.players?.length || 0,
                holeList: this.data.holeList?.length || 0,
                playerScores: this.data.playerScores?.length || 0,
                playerTotals: this.data.playerTotals?.length || 0,
                scrollTop: this.data.scrollTop
            };

            console.log('📊 [ScoreTable] 当前状态:', status);
            return status;
        }
    }
})
