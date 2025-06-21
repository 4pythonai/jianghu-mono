import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/gameStore'

Component({
    properties: {
        playerIndex: Number,
        holeIndex: Number,
        userid: {
            type: String,
            value: ''
        },
        par: {
            type: Number,
            value: 0
        },
        holeid: {
            type: String,
            value: ''
        },
        court_key: {
            type: String,
            value: ''
        },
        unique_key: {
            type: String,
            value: ''
        },
        putts: {
            type: Number,
            value: 0
        },
        // 移除 diff，改为计算属性
        score: {
            type: Number,
            value: 0
        },
        // 新的字段，替代 gambleflag
        penalty_strokes: {
            type: Number,
            value: 0
        },
        sand_save: {
            type: Number,
            value: 0
        }
    },

    data: {
        formattedputts: '',
        formattedDiff: '',
        formattedScore: '',
        scoreClass: '',
        calculatedDiff: 0
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameData', 'players'],
                actions: ['updateCellScore'],
            });

            if (typeof this.properties.unique_key !== 'string') {
                console.warn(`⚠️ [HoleCell] unique_key 不是字符串类型: ${typeof this.properties.unique_key}, 值: ${this.properties.unique_key}`);
            }

            // 计算 diff
            this.calculateAndUpdateDiff();

            const { putts = 0, score = 0 } = this.properties;
            this.setData({
                formattedputts: putts !== 0 ? putts.toString() : '0',
                formattedScore: score !== 0 ? score.toString() : '0'
            });

            this.observers = {
                'putts': function (putts) {
                    if (putts !== undefined && putts !== null) {
                        this.setData({
                            formattedputts: putts.toString()
                        });
                    }
                }.bind(this),
                'score, par': function (score, par) {
                    if (score !== undefined && score !== null) {
                        this.setData({
                            formattedScore: score.toString()
                        });
                    }
                    // 重新计算 diff
                    this.calculateAndUpdateDiff();
                }.bind(this),
                'penalty_strokes, sand_save': function () {
                    // 当罚杆或沙坑救球数据变化时，可以在这里处理
                    console.log('penalty_strokes 或 sand_save 更新');
                }.bind(this)
            };
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },

    methods: {
        // 计算并更新 diff
        calculateAndUpdateDiff: function () {
            const { score = 0, par = 0 } = this.properties;
            const calculatedDiff = (score > 0 && par > 0) ? score - par : 0;

            const prefix = calculatedDiff > 0 ? '+' : '';
            const formattedDiff = calculatedDiff !== 0 ? prefix + calculatedDiff.toString() : '0';

            this.setData({
                calculatedDiff: calculatedDiff,
                formattedDiff: formattedDiff
            });

            this.updateScoreClass(calculatedDiff);
        },

        updateScoreClass: function (diff) {
            let scoreClass = '';

            if (diff <= -2) {
                scoreClass = 'under-par-2';
            } else if (diff === -1) {
                scoreClass = 'under-par-1';
            } else if (diff === 0) {
                scoreClass = 'score-par';
            } else if (diff === 1) {
                scoreClass = 'over-par-1';
            } else if (diff === 2) {
                scoreClass = 'over-par-2';
            } else if (diff >= 3) {
                scoreClass = 'over-par-3';
            }

            this.setData({
                scoreClass: scoreClass
            });
        },

        recordScore: function (e) {
            // 确保传递的 unique_key 是字符串类型
            const uniqueKey = this.properties.unique_key != null ? String(this.properties.unique_key) : '';

            this.triggerEvent('cellclick', {
                holeIndex: this.properties.holeIndex,
                playerIndex: this.properties.playerIndex,
                unique_key: uniqueKey
            });
        }
    }
})