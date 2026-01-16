import { observable, action } from 'mobx-miniprogram';
import { buildScoreIndex } from '../../utils/gameUtils';

/**
 * 为红蓝分组创建便于 lookup 的结构
 * @param {Array} redBlue
 * @returns {Map<string, { redSet: Set<string>, blueSet: Set<string> }>}
 */
function buildRedBlueIndex(redBlue = []) {
    const index = new Map();
    for (const item of redBlue) {
        if (!item) continue;
        const holeIndex = String(item.hindex ?? '');
        if (!holeIndex) continue;

        index.set(holeIndex, {
            redSet: new Set((item.red || []).map(id => String(id))),
            blueSet: new Set((item.blue || []).map(id => String(id))),
        });
    }
    return index;
}

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
     * 查找某玩家某洞的成绩
     * @param {string|number} userid
     * @param {string|number} hindex
     * @returns {object|undefined}
     */
    getScore(userid, hindex) {
        return (this.scores || []).find(s => String(s.user_id) === String(userid) && String(s.hindex) === String(hindex));
    },

    /**
     * 更新某玩家某洞的成绩（有则更新，无则新增）
     * @param {object} param0
     * @param {string|number} param0.userid - 用户ID（参数名保持userid以兼容API）
     * @param {string|number} param0.hindex
     * @param {number} [param0.score]
     * @param {number} [param0.putts]
     * @param {number} [param0.penalty_strokes]
     * @param {number} [param0.sand_save]
     * @param {string} [param0.tee_shot_direction]
     */
    updateScore: action(function ({ userid, hindex, score, putts, penalty_strokes, sand_save, tee_shot_direction }) {
        const idx = (this.scores || []).findIndex(s => String(s.user_id) === String(userid) && String(s.hindex) === String(hindex));
        if (idx >= 0) {
            // 更新已有
            const newScore = { ...this.scores[idx] };
            if (score !== undefined) newScore.score = score;
            if (putts !== undefined) newScore.putts = putts;
            if (penalty_strokes !== undefined) newScore.penalty_strokes = penalty_strokes;
            if (sand_save !== undefined) newScore.sand_save = sand_save;
            if (tee_shot_direction !== undefined) newScore.tee_shot_direction = tee_shot_direction;
            this.scores = [
                ...this.scores.slice(0, idx),
                newScore,
                ...this.scores.slice(idx + 1)
            ];
        } else {
            // 新增
            this.scores = [
                ...this.scores,
                { user_id: userid, hindex, score, putts, penalty_strokes, sand_save, tee_shot_direction }
            ];
        }
    }),

    /**
     * 清空分数数据
     */
    clear: action(function() {
        this.scores = []
    }),

    /**
     * 计算显示用的分数矩阵
     * @param {Array} players - 玩家列表
     * @param {Array} holeList - 球洞列表
     * @param {Array} red_blue - 红蓝分组数据
     * @returns {Array} 二维数组，每个玩家对应一个分数数组
     */
    calculateDisplayScores(players, holeList, red_blue = [], scoreIndexOverride) {
        if (!Array.isArray(players) || players.length === 0) return [];
        if (!Array.isArray(holeList) || holeList.length === 0) return [];

        const scoreIndex = scoreIndexOverride ?? buildScoreIndex(this.scores);
        const redBlueIndex = buildRedBlueIndex(red_blue);

        return players.map(player => {
            const userId = String(player?.user_id ?? '');
            const playerScores = scoreIndex.get(userId);

            return holeList.map(hole => {
                const holeIndex = String(hole?.hindex ?? '');
                const cell = playerScores?.get(holeIndex) || {};
                const rb = redBlueIndex.get(holeIndex);
                let colorTag = '';

                if (rb) {
                    // 检查红蓝分组中是否包含该 userId（支持两种字段名）
                    if (rb.redSet.has(userId)) colorTag = 'red';
                    if (rb.blueSet.has(userId)) colorTag = 'blue';
                }

                return { ...cell, colorTag };
            });
        });
    },

});
