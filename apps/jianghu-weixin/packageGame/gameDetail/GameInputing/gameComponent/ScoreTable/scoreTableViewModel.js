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
    groupid = null,
    scoreIndex = null,
    base = null
}) {
    const baseData = base ?? buildScoreTableBase({
        players,
        holeList,
        red_blue,
        scoreIndex
    });

    const oneballData = buildOneballViewModel(
        players,
        holeList,
        baseData.displayScores,
        baseData.displayTotals,
        baseData.displayOutTotals,
        baseData.displayInTotals,
        gameData,
        groupid
    );

    return {
        renderPlayers: players,
        ...baseData,
        ...oneballData,
    };
}

export function buildScoreTableBase({ players, holeList, red_blue = [], scoreIndex = null }) {
    const {
        displayScores,
        displayTotals,
        displayOutTotals,
        displayInTotals,
        scoreIndex: computedScoreIndex
    } = computeScoreTableStats(players, holeList, red_blue, scoreIndex);

    const paddedOutTotals = normalizeTotalsLength(displayOutTotals, players.length);
    const paddedInTotals = normalizeTotalsLength(displayInTotals, players.length);

    return {
        displayScores,
        displayTotals,
        displayOutTotals: paddedOutTotals,
        displayInTotals: paddedInTotals,
        scoreIndex: computedScoreIndex
    };
}
