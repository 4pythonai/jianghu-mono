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

    // 添加更新标记，用于监控数据更新
    _lastUpdateTime: 0,

    /**
     * 统计每个玩家的总分
     * @returns {number[]}
     */
    get playerTotalScores() {
        if (!this.scores || !Array.isArray(this.scores) || this.scores.length === 0) return [];

        // 添加性能监控
        const startTime = Date.now();
        const totals = this.scores.map(playerScores =>
            playerScores.reduce((total, scoreData) => total + (scoreData.score || 0), 0)
        );

        // 如果计算时间超过10ms，记录警告
        const calcTime = Date.now() - startTime;
        if (calcTime > 10) {
            console.warn(`⚠️ [ScoreStore] 总分计算耗时较长: ${calcTime}ms`);
        }

        return totals;
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
        if (!scoreObj) {
            console.warn(`⚠️ [ScoreStore] 无效的分数位置: playerIndex=${playerIndex}, holeIndex=${holeIndex}`);
            return;
        }

        // 检查是否有实际变化
        const hasChanges = (
            (score !== undefined && score !== scoreObj.score) ||
            (putts !== undefined && putts !== scoreObj.putts) ||
            (penalty_strokes !== undefined && penalty_strokes !== scoreObj.penalty_strokes) ||
            (sand_save !== undefined && sand_save !== scoreObj.sand_save)
        );

        if (!hasChanges) return; // 没有变化，直接返回

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
        this._lastUpdateTime = Date.now();
    }),

    /**
     * 批量回滚/更新某一洞的所有玩家分数
     * @param {object} param0
     * @param {number} param0.holeIndex
     * @param {Array<object>} param0.scoresToUpdate
     */
    batchUpdateScoresForHole: action(function ({ holeIndex, scoresToUpdate }) {
        console.log(`🔄 [ScoreStore] 批量更新洞${holeIndex}的分数，玩家数量: ${scoresToUpdate.length}`);

        for (const [playerIndex, scoreData] of scoresToUpdate.entries()) {
            const scoreObj = this.scores?.[playerIndex]?.[holeIndex];
            if (scoreObj) {
                this.scores[playerIndex][holeIndex] = scoreData;
            } else {
                console.warn(`⚠️ [ScoreStore] 批量更新时无效位置: playerIndex=${playerIndex}, holeIndex=${holeIndex}`);
            }
        }

        this._lastUpdateTime = Date.now();
    }),

    /**
     * 初始化分数矩阵
     * @param {number} playerCount
     * @param {number} holeCount
     */
    initializeScores: action(function (playerCount, holeCount) {
        console.log(`🔄 [ScoreStore] 初始化分数矩阵: ${playerCount}个玩家, ${holeCount}个洞`);

        this.scores = Array.from({ length: playerCount }, () =>
            Array.from({ length: holeCount }, () => createDefaultScore())
        );

        this._lastUpdateTime = Date.now();
        console.log(`✅ [ScoreStore] 分数矩阵初始化完成，数据大小: ${playerCount * holeCount}个格子`);
    }),

    /**
     * 获取数据状态信息（用于调试）
     */
    getDataStatus() {
        const playerCount = this.scores?.length || 0;
        const holeCount = this.scores?.[0]?.length || 0;
        const totalCells = playerCount * holeCount;
        const lastUpdate = this._lastUpdateTime;

        return {
            playerCount,
            holeCount,
            totalCells,
            lastUpdate,
            hasData: totalCells > 0
        };
    }
});
