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

            if (putts !== undefined && putts !== null) {
                const formattedputts = putts.toString();
                this.setData({
                    formattedputts: formattedputts
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
                formattedputts: (typeof putts === 'number' && !Number.isNaN(putts)) ? putts.toString() : '0',
                formattedScore: (typeof score === 'number' && !Number.isNaN(score)) ? score.toString() : '0'
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
            const { score = 0, par = 0, colorTag = '' } = this.properties;
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