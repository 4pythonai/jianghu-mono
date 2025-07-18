import { observable, action } from 'mobx-miniprogram';
import { createDefaultScore } from '../utils/gameUtils';

/**
 * 分数相关的 store
 * 负责管理分数矩阵和分数录入、批量更新等操作
 */
export const scoreStore = observable({
    /**
     * 分数矩阵 [playerIndex][holeIndex]
     * @type {Array<Array<{score:number, putts:number, penalty_strokes:number, sand_save:number}>>}
     */
    scores: [],

    /**
     * 统计每个玩家的总分
     * @returns {number[]}
     */
    get playerTotalScores() {
        if (!this.scores || !Array.isArray(this.scores) || this.scores.length === 0) return [];
        return this.scores.map(playerScores =>
            playerScores.reduce((total, scoreData) => total + (scoreData.score || 0), 0)
        );
    },

    /**
     * 更新单个格子的分数
     * @param {object} param0
     * @param {number} param0.playerIndex
     * @param {number} param0.holeIndex
     * @param {number} [param0.score]
     * @param {number} [param0.putts]
     * @param {number} [param0.penalty_strokes]
     * @param {number} [param0.sand_save]
     */
    updateCellScore: action(function ({ playerIndex, holeIndex, score, putts, penalty_strokes, sand_save }) {
        const scoreObj = this.scores?.[playerIndex]?.[holeIndex];
        if (!scoreObj) { return; }
        // 创建新的 scores 数组副本
        const newScores = this.scores.map((playerScores, pIndex) => {
            if (pIndex === playerIndex) {
                return playerScores.map((holeScore, hIndex) => {
                    if (hIndex === holeIndex) {
                        const newScoreObj = { ...holeScore };
                        if (score !== undefined) newScoreObj.score = score;
                        if (putts !== undefined) newScoreObj.putts = putts;
                        if (penalty_strokes !== undefined) newScoreObj.penalty_strokes = penalty_strokes;
                        if (sand_save !== undefined) newScoreObj.sand_save = sand_save;
                        return newScoreObj;
                    }
                    return holeScore;
                });
            }
            return playerScores;
        });
        this.scores = newScores;
    }),

    /**
     * 批量回滚/更新某一洞的所有玩家分数
     * @param {object} param0
     * @param {number} param0.holeIndex
     * @param {Array<object>} param0.scoresToUpdate
     */
    batchUpdateScoresForHole: action(function ({ holeIndex, scoresToUpdate }) {
        for (const [playerIndex, scoreData] of scoresToUpdate.entries()) {
            const scoreObj = this.scores?.[playerIndex]?.[holeIndex];
            if (scoreObj) {
                this.scores[playerIndex][holeIndex] = scoreData;
            }
        }
    }),

    /**
     * 初始化分数矩阵
     * @param {number} playerCount
     * @param {number} holeCount
     */
    initializeScores: action(function (playerCount, holeCount) {
        this.scores = Array.from({ length: playerCount }, () =>
            Array.from({ length: holeCount }, () => createDefaultScore())
        );
    }),
});
