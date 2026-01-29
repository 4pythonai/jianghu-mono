/**
 * 构建 oneball 模式下的展示数据
 * @param {Array} players
 * @param {Array} holeList
 * @param {Array} displayScores
 * @param {Array} displayTotals
 * @param {Array} displayOutTotals
 * @param {Array} displayInTotals
 * @param {object|null} gameData
 * @param {string|number|null} groupid
 * @returns {object}
 */
export function buildOneballViewModel(
    players,
    holeList,
    displayScores,
    displayTotals,
    displayOutTotals,
    displayInTotals,
    gameData,
    groupid
) {
    const scoringType = gameData?.scoring_type || '';

    if (scoringType !== 'oneball') {
        return {
            isOneballMode: false,
            oneballRows: [],
            oneballMatchResults: [],
            oneballRowTotals: [],
            oneballRowOutTotals: [],
            oneballRowInTotals: [],
            oneballDisplayScores: null
        };
    }

    const groups = Array.isArray(gameData?.groups) ? gameData.groups : [];
    const currentGroup = groups.find(group => String(group.groupid) === String(groupid));
    const groupOneballConfig = currentGroup?.groupOneballConfig;

    if (!groupOneballConfig || typeof groupOneballConfig !== 'object') {
        return {
            isOneballMode: false,
            oneballRows: [],
            oneballMatchResults: [],
            oneballRowTotals: [],
            oneballRowOutTotals: [],
            oneballRowInTotals: [],
            oneballDisplayScores: null
        };
    }

    const groupedPlayers = { A: [], B: [] };
    let hasInvalidConfig = false;
    players.forEach((player, index) => {
        const side = groupOneballConfig[String(player.user_id)];
        if (side !== 'A' && side !== 'B') {
            hasInvalidConfig = true;
            return;
        }
        groupedPlayers[side].push({ ...player, index });
    });

    if (hasInvalidConfig || groupedPlayers.A.length === 0 || groupedPlayers.B.length === 0) {
        return {
            isOneballMode: false,
            oneballRows: [],
            oneballMatchResults: [],
            oneballRowTotals: [],
            oneballRowOutTotals: [],
            oneballRowInTotals: [],
            oneballDisplayScores: null
        };
    }

    const groupAIndex = groupedPlayers.A[0].index;
    const groupBIndex = groupedPlayers.B[0].index;

    const oneballDisplayScores = [];
    // A组最佳成绩
    oneballDisplayScores.push(holeList.map((hole, holeIndex) => {
        const aScores = groupedPlayers.A
            .map(p => displayScores?.[p.index]?.[holeIndex])
            .filter(s => s && typeof s.score === 'number' && s.score > 0);
        if (aScores.length > 0) {
            return aScores.reduce((best, current) => current.score < best.score ? current : best);
        }
        return displayScores[groupAIndex][holeIndex];
    }));
    // B组最佳成绩
    oneballDisplayScores.push(holeList.map((hole, holeIndex) => {
        const bScores = groupedPlayers.B
            .map(p => displayScores?.[p.index]?.[holeIndex])
            .filter(s => s && typeof s.score === 'number' && s.score > 0);
        if (bScores.length > 0) {
            return bScores.reduce((best, current) => current.score < best.score ? current : best);
        }
        return displayScores[groupBIndex][holeIndex];
    }));

    const holeBasedMatchTypes = ['fourball_bestball_match', 'fourball_scramble_match', 'foursome_match', 'individual_match'];
    const showMiddleRow = (gameData?.game_type !== 'common') && (holeBasedMatchTypes.includes(gameData.game_type));

    const oneballRows = [
        { key: 'A', type: 'group', label: 'A组', playerIndex: 0, players: groupedPlayers.A },
        ...(showMiddleRow ? [{ key: 'score', type: 'score', label: '得分' }] : []),
        { key: 'B', type: 'group', label: 'B组', playerIndex: 1, players: groupedPlayers.B }
    ];

    const oneballMatchResults = holeList.map((_, holeIndex) => {
        const aScore = oneballDisplayScores?.[0]?.[holeIndex]?.score;
        const bScore = oneballDisplayScores?.[1]?.[holeIndex]?.score;

        if (!aScore || !bScore || aScore <= 0 || bScore <= 0) {
            return { text: '', status: 'empty' };
        }

        const scoreText = `${aScore},${bScore}`;

        if (aScore < bScore) {
            return { text: scoreText, status: 'win' };
        }
        if (aScore > bScore) {
            return { text: scoreText, status: 'lose' };
        }
        return { text: scoreText, status: 'tie' };
    });

    const oneballRowTotals = showMiddleRow
        ? [
            displayTotals?.[groupAIndex] ?? null,
            null,
            displayTotals?.[groupBIndex] ?? null
        ]
        : [
            displayTotals?.[groupAIndex] ?? null,
            displayTotals?.[groupBIndex] ?? null
        ];

    const oneballRowOutTotals = showMiddleRow
        ? [
            displayOutTotals?.[groupAIndex] ?? null,
            null,
            displayOutTotals?.[groupBIndex] ?? null
        ]
        : [
            displayOutTotals?.[groupAIndex] ?? null,
            displayOutTotals?.[groupBIndex] ?? null
        ];

    const oneballRowInTotals = showMiddleRow
        ? [
            displayInTotals?.[groupAIndex] ?? null,
            null,
            displayInTotals?.[groupBIndex] ?? null
        ]
        : [
            displayInTotals?.[groupAIndex] ?? null,
            displayInTotals?.[groupBIndex] ?? null
        ];

    return {
        isOneballMode: true,
        oneballRows,
        oneballMatchResults,
        oneballRowTotals,
        oneballRowOutTotals,
        oneballRowInTotals,
        oneballDisplayScores
    };
}
