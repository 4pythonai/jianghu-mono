import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'
import { getScoreClass } from '@/utils/gameUtils'

Component({
    properties: {
        playerIndex: Number,
        holeIndex: Number,
        holeList: Array,
        players: Array,
        displayScores: Array
    },

    data: {
        formattedputts: '',
        formattedDiff: '',
        formattedScore: '',
        scoreClass: '',
        calculatedDiff: 0,
        // 计算出的属性
        colorTag: '',
        userid: '',
        par: 0,
        holeid: '',
        unique_key: '',
        putts: null,
        score: null,
        penalty_strokes: null,
        sand_save: null
    },

    observers: {
        'playerIndex, holeIndex, holeList, players, displayScores': function (playerIndex, holeIndex, holeList, players, displayScores) {
            this.calculateProperties();
        }
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameData', 'players'],
                actions: [],
            });

            // 初始化计算属性
            this.calculateProperties();
        },

        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },

    methods: {
        // 计算所有属性
        calculateProperties: function () {
            const { playerIndex, holeIndex, holeList, players, displayScores } = this.properties;

            if (!holeList || !players || !displayScores ||
                playerIndex < 0 || holeIndex < 0 ||
                playerIndex >= players.length || holeIndex >= holeList.length) {
                return;
            }

            const hole = holeList[holeIndex];
            const player = players[playerIndex];
            const scoreData = displayScores[playerIndex] && displayScores[playerIndex][holeIndex] ? displayScores[playerIndex][holeIndex] : {};

            this.setData({
                colorTag: scoreData.colorTag || '',
                userid: player.userid || '',
                par: hole.par || 0,
                holeid: hole.holeid || '',
                unique_key: hole.unique_key || '',
                putts: scoreData.putts || null,
                score: scoreData.score || null,
                penalty_strokes: scoreData.penalty_strokes || null,
                sand_save: scoreData.sand_save || null
            });

            // 更新显示格式
            this.updateDisplayFormats();
        },

        // 更新显示格式
        updateDisplayFormats: function () {
            const { score, putts } = this.data;

            if (score !== undefined && score !== null && score !== 0 && score !== '') {
                this.setData({
                    formattedScore: score.toString(),
                    formattedputts: (putts !== undefined && putts !== null) ? putts.toString() : '0'
                });
            } else {
                this.setData({
                    formattedScore: '',
                    formattedputts: ''
                });
            }

            // 重新计算 diff
            this.calculateAndUpdateDiff();
        },

        // 计算并更新 diff
        calculateAndUpdateDiff: function () {
            const { score, par = 0 } = this.data;

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
            const newScoreClass = getScoreClass(calculatedDiff);
            this.setData({
                calculatedDiff: calculatedDiff,
                formattedDiff: formattedDiff,
                scoreClass: newScoreClass
            });
        },

        recordScore: function (e) {
            console.log(`👆 [HoleCell] 点击记分 - 玩家${this.properties.playerIndex} 洞${this.properties.holeIndex}`);

            // 确保传递的 unique_key 是字符串类型
            const uniqueKey = this.data.unique_key != null ? String(this.data.unique_key) : '';

            this.triggerEvent('cellclick', {
                holeIndex: this.properties.holeIndex,
                playerIndex: this.properties.playerIndex,
                unique_key: uniqueKey
            });
        }
    }
})