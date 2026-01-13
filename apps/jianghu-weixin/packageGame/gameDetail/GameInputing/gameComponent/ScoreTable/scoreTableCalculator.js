import { scoreStore } from '@/stores/game/scoreStore';
import { buildScoreIndex } from '@/utils/gameUtils';

/**
 * 计算记分表展示所需的核心数据
 * @param {Array} players
 * @param {Array} holeList
 * @param {Array} redBlue
 * @returns {{displayScores: Array, displayTotals: Array, displayOutTotals: Array, displayInTotals: Array}}
 */
export function computeScoreTableStats(players, holeList, redBlue = []) {
    const scoreIndex = buildScoreIndex(scoreStore.scores);
    const displayScores = scoreStore.calculateDisplayScores(players, holeList, redBlue, scoreIndex);
    const displayTotals = calculateDisplayTotals(displayScores);
    const { displayOutTotals, displayInTotals } = calculateOutInTotals(displayScores, holeList);

    return {
        displayScores,
        displayTotals,
        displayOutTotals,
        displayInTotals,
        scoreIndex
    };
}

/**
 * 计算总分数组
 * @param {Array} displayScores - 显示分数矩阵
 * @returns {Array} 每个玩家的总分
 */
export function calculateDisplayTotals(displayScores) {
    if (!displayScores || displayScores.length === 0) return [];

    return displayScores.map(playerArr =>
        playerArr.reduce((sum, s) => sum + (typeof s.score === 'number' ? s.score : 0), 0)
    );
}

/**
 * 计算前后九洞汇总（仅在18洞时生效）
 * @param {Array} displayScores - 显示分数矩阵
 * @param {Array} holeList - 球洞列表
 * @returns {{displayOutTotals: Array, displayInTotals: Array}}
 */
export function calculateOutInTotals(displayScores, holeList) {
    if (!displayScores || displayScores.length === 0 || holeList.length !== 18) {
        return { displayOutTotals: [], displayInTotals: [] };
    }

    const sumSegment = (segment) => {
        const validScores = segment.filter(cell => typeof cell?.score === 'number');
        if (validScores.length === 0) {
            return null;
        }
        return validScores.reduce((sum, cell) => sum + cell.score, 0);
    };

    const displayOutTotals = displayScores.map(playerArr =>
        sumSegment(playerArr.slice(0, 9))
    );

    const displayInTotals = displayScores.map(playerArr =>
        sumSegment(playerArr.slice(9, 18))
    );

    return { displayOutTotals, displayInTotals };
}

/**
 * 补齐统计数组长度, 确保与玩家数量一致
 * @param {Array} totals
 * @param {number} targetLength
 */
export function normalizeTotalsLength(totals, targetLength, fillValue = null) {
    const safeTotals = Array.isArray(totals) ? totals : [];
    const padded = [...safeTotals];
    while (padded.length < targetLength) {
        padded.push(fillValue);
    }
    return padded;
}
