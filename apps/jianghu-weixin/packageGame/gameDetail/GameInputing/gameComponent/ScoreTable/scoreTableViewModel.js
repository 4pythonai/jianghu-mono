import {
    computeScoreTableStats,
    normalizeTotalsLength
} from './scoreTableCalculator';
import { buildOneballViewModel } from './oneballViewModel';

/**
 * 构建 ScoreTable 展示数据
 * @param {object} params
 * @param {Array} params.players
 * @param {Array} params.holeList
 * @param {Array} params.red_blue
 * @param {object|null} params.gameData
 * @param {string|number|null} params.groupid
 * @returns {object}
 */
export function buildScoreTableViewModel({
    players,
    holeList,
    red_blue = [],
    gameData = null,
    groupid = null
}) {
    const {
        displayScores,
        displayTotals,
        displayOutTotals,
        displayInTotals,
        scoreIndex
    } = computeScoreTableStats(players, holeList, red_blue);

    const oneballData = buildOneballViewModel(
        players,
        holeList,
        displayScores,
        displayTotals,
        displayOutTotals,
        displayInTotals,
        gameData,
        groupid
    );

    const paddedOutTotals = normalizeTotalsLength(displayOutTotals, players.length);
    const paddedInTotals = normalizeTotalsLength(displayInTotals, players.length);

    return {
        renderPlayers: players,
        displayScores,
        displayTotals,
        displayOutTotals: paddedOutTotals,
        displayInTotals: paddedInTotals,
        ...oneballData,
        scoreIndex
    };
}
