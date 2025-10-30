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
        for (const s of (this.scores || [])) {
            if (!totals[s.userid]) totals[s.userid] = 0;
            if (typeof s.score === 'number') totals[s.userid] += s.score;
        }
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

    /**
     * 计算显示用的分数矩阵
     * @param {Array} players - 玩家列表
     * @param {Array} holeList - 球洞列表
     * @param {Array} red_blue - 红蓝分组数据
     * @returns {Array} 二维数组，每个玩家对应一个分数数组
     */
    calculateDisplayScores: action(function (players, holeList, red_blue = []) {
        if (!players || !holeList || !this.scores || players.length === 0) return [];

        // 创建红蓝分组映射
        const redBlueMap = {};
        for (const item of red_blue) {
            redBlueMap[String(item?.hindex)] = item;
        }

        return players.map(player => {
            // 创建该玩家的分数映射
            const scoreMap = {};
            for (const s of this.scores) {
                if (s?.hindex && String(s?.userid) === String(player?.userid)) {
                    scoreMap[String(s?.hindex)] = s;
                }
            }

            // 为每个球洞创建显示数据
            return holeList.map(hole => {
                const cell = scoreMap[String(hole?.hindex)] || {};
                const rb = redBlueMap[String(hole?.hindex)];
                let colorTag = '';

                if (rb) {
                    if ((rb.red || []).map(String).includes(String(player?.userid))) colorTag = 'red';
                    if ((rb.blue || []).map(String).includes(String(player?.userid))) colorTag = 'blue';
                }

                return { ...cell, colorTag };
            });
        });
    }),

    /**
     * 计算总分数组
     * @param {Array} displayScores - 显示分数矩阵
     * @returns {Array} 每个玩家的总分数组
     */
    calculateDisplayTotals: action(function (displayScores) {
        if (!displayScores || displayScores.length === 0) return [];

        return displayScores.map(playerArr =>
            playerArr.reduce((sum, s) => sum + (typeof s.score === 'number' ? s.score : 0), 0)
        );
    }),

    /**
     * 计算OUT和IN汇总 (仅18洞时)
     * @param {Array} displayScores - 显示分数矩阵
     * @param {Array} holeList - 球洞列表
     * @returns {Object} {displayOutTotals, displayInTotals}
     */
    calculateOutInTotals: action(function (displayScores, holeList) {
        if (!displayScores || displayScores.length === 0 || holeList.length !== 18) {
            return { displayOutTotals: [], displayInTotals: [] };
        }

        const displayOutTotals = displayScores.map(playerArr => {
            // OUT: 前9洞 (索引0-8)
            return playerArr.slice(0, 9).reduce((sum, s) => sum + (typeof s.score === 'number' ? s.score : 0), 0);
        });

        const displayInTotals = displayScores.map(playerArr => {
            // IN: 后9洞 (索引9-17)
            return playerArr.slice(9, 18).reduce((sum, s) => sum + (typeof s.score === 'number' ? s.score : 0), 0);
        });

        return { displayOutTotals, displayInTotals };
    }),

    /**
     * 计算每个玩家的 handicap
     * @param {Array} players - 玩家列表
     * @param {Array} holeList - 球洞列表
     * @returns {Array} 添加了 handicap 属性的玩家列表
     */
    calculatePlayersHandicaps: action(function (players, holeList) {
        if (!players || !holeList || !this.scores || players.length === 0) return players;

        // 创建分数映射，便于快速查找（使用 userid 和 hindex 作为键）
        const scoreMap = new Map();
        for (const score of this.scores) {
            const key = `${score.userid}_${score.hindex}`;
            scoreMap.set(key, score);
        }

        return players.map(player => {
            let totalScore = 0;
            let totalPar = 0;

            // 计算该玩家的总分和总标准杆（使用 hindex 匹配）
            holeList.forEach((hole, index) => {
                const scoreKey = `${player.userid}_${hole.hindex}`;
                const scoreData = scoreMap.get(scoreKey);

                if (scoreData && typeof scoreData.score === 'number' && scoreData.score > 0) {
                    totalScore += scoreData.score;
                    totalPar += hole.par || 0;
                }
            });

            // 杆差 = 总分 - 总标准杆
            const handicap = totalScore - totalPar;

            return {
                ...player,
                handicap: handicap
            };
        });
    }),
});

