import { scoreStore } from '@/stores/scoreStore';
import { gameStore } from '@/stores/gameStore';

/**
 * 计算记分表展示所需的核心数据
 * @param {Array} players
 * @param {Array} holeList
 * @param {Array} redBlue
 * @returns {{displayScores: Array, displayTotals: Array, displayOutTotals: Array, displayInTotals: Array}}
 */
export function computeScoreTableStats(players, holeList, redBlue = []) {
    const displayScores = scoreStore.calculateDisplayScores(players, holeList, redBlue);
    const displayTotals = gameStore.calculateDisplayTotals(displayScores);
    const {
        displayOutTotals,
        displayInTotals
    } = gameStore.calculateOutInTotals(displayScores, holeList);

    return {
        displayScores,
        displayTotals,
        displayOutTotals,
        displayInTotals
    };
}

/**
 * 补齐统计数组长度, 确保与玩家数量一致
 * @param {Array} totals
 * @param {number} targetLength
 */
export function normalizeTotalsLength(totals, targetLength) {
    const safeTotals = Array.isArray(totals) ? totals : [];
    const padded = [...safeTotals];
    while (padded.length < targetLength) {
        padded.push(0);
    }
    return padded;
}
