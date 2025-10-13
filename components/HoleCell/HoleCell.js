import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/gameStore'

Component({
    properties: {
        colorTag: {
            type: String,
            value: ''
        },
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
            type: null,
            value: null
        },
        score: {
            type: null,
            value: null
        },
        penalty_strokes: {
            type: null,
            value: null
        },
        sand_save: {
            type: null,
            value: null
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

            if (score !== undefined && score !== null && score !== 0 && score !== '') {
                // 只有当 score 不为 null、undefined、0 或空字符串时，才显示
                const formattedScore = score.toString();
                this.setData({
                    formattedScore: formattedScore
                });
            } else {
                // 当 score 为 null、undefined、0 或空字符串时，清空显示
                this.setData({
                    formattedScore: ''
                });
            }

            // 重新计算 diff
            this.calculateAndUpdateDiff();
        },

        'putts': function (putts) {
            // putts 的显示应该和 score 保持一致，都基于 score 是否存在
            const { score } = this.properties;

            if (score !== undefined && score !== null && score !== 0 && score !== '') {
                // 只有当 score 不为 null、undefined、0 或空字符串时，才显示 putts
                const formattedputts = (putts !== undefined && putts !== null) ? putts.toString() : '0';
                this.setData({
                    formattedputts: formattedputts
                });
            } else {
                // 当 score 为 null、undefined、0 或空字符串时，清空显示
                this.setData({
                    formattedputts: ''
                });
            }
        },

    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameData', 'players'],
                actions: [],
            });

            if (typeof this.properties.unique_key !== 'string') {
                console.warn(`⚠️ [HoleCell] unique_key 不是字符串类型: ${typeof this.properties.unique_key}, 值: ${this.properties.unique_key}`);
            }

            // 初始化显示数据
            const { putts, score } = this.properties;
            this.setData({
                formattedputts: (score !== null && score !== undefined && score !== 0 && score !== '' && putts !== null && putts !== undefined) ? putts.toString() : '',
                formattedScore: (score !== null && score !== undefined && score !== 0 && score !== '') ? score.toString() : ''
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
            const { score, par = 0, colorTag = '' } = this.properties;

            // 如果 score 为 null、undefined、0 或空字符串，不显示任何 diff 信息
            if (score === null || score === undefined || score === 0 || score === '') {
                this.setData({
                    calculatedDiff: 0,
                    formattedDiff: '',
                    scoreClass: ''
                });
                return;
            }

            // 只有当 score 不为 null 且不为 0 时，才计算并显示 diff
            const calculatedDiff = (score > 0 && par > 0) ? score - par : 0;
            const prefix = calculatedDiff > 0 ? '+' : '';
            const formattedDiff = calculatedDiff !== 0 ? prefix + calculatedDiff.toString() : '0';
            const newScoreClass = gameStore.getScoreClass(calculatedDiff);
            this.setData({
                calculatedDiff: calculatedDiff,
                formattedDiff: formattedDiff,
                scoreClass: newScoreClass
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