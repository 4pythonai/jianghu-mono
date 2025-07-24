import { observable, action } from 'mobx-miniprogram';

/**
 * 分数相关的 store
 * 负责管理一维分数数组和分数录入、统计等操作
 */
export const scoreStore = observable({
    /**
     * 分数一维数组 [{userid, hindex, score, ...}]
     */
    scores: [],

    /**
     * 统计每个玩家的总分
     * @returns {object} {userid: totalScore, ...}
     */
    get playerTotalScores() {
        const totals = {};
        (this.scores || []).forEach(s => {
            if (!totals[s.userid]) totals[s.userid] = 0;
            if (typeof s.score === 'number') totals[s.userid] += s.score;
        });
        return totals;
    },

    /**
     * 查找某玩家某洞的成绩
     * @param {string|number} userid
     * @param {string|number} hindex
     * @returns {object|undefined}
     */
    getScore(userid, hindex) {
        return (this.scores || []).find(s => String(s.userid) === String(userid) && String(s.hindex) === String(hindex));
    },

    /**
     * 更新某玩家某洞的成绩（有则更新，无则新增）
     * @param {object} param0
     * @param {string|number} param0.userid
     * @param {string|number} param0.hindex
     * @param {number} [param0.score]
     * @param {number} [param0.putts]
     * @param {number} [param0.penalty_strokes]
     * @param {number} [param0.sand_save]
     */
    updateScore: action(function ({ userid, hindex, score, putts, penalty_strokes, sand_save }) {
        const idx = (this.scores || []).findIndex(s => String(s.userid) === String(userid) && String(s.hindex) === String(hindex));
        if (idx >= 0) {
            // 更新已有
            const newScore = { ...this.scores[idx] };
            if (score !== undefined) newScore.score = score;
            if (putts !== undefined) newScore.putts = putts;
            if (penalty_strokes !== undefined) newScore.penalty_strokes = penalty_strokes;
            if (sand_save !== undefined) newScore.sand_save = sand_save;
            this.scores = [
                ...this.scores.slice(0, idx),
                newScore,
                ...this.scores.slice(idx + 1)
            ];
        } else {
            // 新增
            this.scores = [
                ...this.scores,
                { userid, hindex, score, putts, penalty_strokes, sand_save }
            ];
        }
    }),
});

