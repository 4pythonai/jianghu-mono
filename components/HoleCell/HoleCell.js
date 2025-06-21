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
        score: {
            type: Number,
            value: 0
        },
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

    observers: {
        'score, par': function (score, par) {
            if (score > 0) {
                console.log(`🔄 [HoleCell] 乐观更新生效 - 玩家${this.properties.playerIndex} 洞${this.properties.holeIndex}: score=${score} → 界面已更新`);
            }

            if (score !== undefined && score !== null) {
                const formattedScore = score.toString();
                this.setData({
                    formattedScore: formattedScore
                });
            }

            // 重新计算 diff
            this.calculateAndUpdateDiff();
        },

        'putts': function (putts) {
            if (putts > 0) {
                console.log(`🔄 [HoleCell] 推杆更新生效 - 玩家${this.properties.playerIndex} 洞${this.properties.holeIndex}: putts=${putts}`);
            }

            if (putts !== undefined && putts !== null) {
                const formattedputts = putts.toString();
                this.setData({
                    formattedputts: formattedputts
                });
            }
        },

        'penalty_strokes, sand_save': function (penalty_strokes, sand_save) {
            if (penalty_strokes > 0 || sand_save > 0) {
                console.log(`🔄 [HoleCell] 罚杆/沙坑更新 - 玩家${this.properties.playerIndex} 洞${this.properties.holeIndex}: penalty=${penalty_strokes}, sand=${sand_save}`);
            }
        }
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

            // 初始化显示数据
            const { putts = 0, score = 0 } = this.properties;
            this.setData({
                formattedputts: putts !== 0 ? putts.toString() : '0',
                formattedScore: score !== 0 ? score.toString() : '0'
            });

            // 计算初始 diff
            this.calculateAndUpdateDiff();
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
            console.log(`👆 [HoleCell] 点击记分 - 玩家${this.properties.playerIndex} 洞${this.properties.holeIndex}`);

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