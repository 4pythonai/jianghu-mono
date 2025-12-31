/**
 * playerUtils.js - 玩家相关的纯函数工具
 * 从 gameStore 提取，便于独立测试和复用
 */

import { buildScoreIndex } from './gameUtils'

/**
 * 根据 groupid 过滤玩家
 * @param {Array} players - 玩家列表
 * @param {string|number|null} groupid - 分组ID
 * @returns {Array} 过滤后的玩家列表
 */
export function filterPlayersByGroup(players, groupid) {
    if (!groupid) {
        return players
    }

    const targetGroupId = String(groupid)
    return players.filter(player => {
        const playerGroupId = String(player.groupid)
        return playerGroupId === targetGroupId
    })
}

/**
 * 计算每个玩家的 handicap（杆差）
 * @param {Array} players - 玩家列表
 * @param {Array} holeList - 球洞列表
 * @param {Array} scores - 分数数组
 * @param {Map} [scoreIndexOverride] - 可选的预计算分数索引
 * @returns {Array} 添加了 handicap 属性的玩家列表
 */
export function calculatePlayersHandicaps(players, holeList, scores, scoreIndexOverride) {
    if (!players || !holeList || !scores || players.length === 0) {
        return players
    }

    const scoreIndex = scoreIndexOverride ?? buildScoreIndex(scores)

    return players.map(player => {
        let totalScore = 0
        let totalPar = 0
        const userId = String(player?.userid ?? '')
        const playerScores = scoreIndex.get(userId)

        // 计算该玩家的总分和总标准杆（使用 hindex 匹配）
        holeList.forEach(hole => {
            const holeIndex = String(hole?.hindex ?? '')
            const scoreData = playerScores?.get(holeIndex)

            if (scoreData && typeof scoreData.score === 'number' && scoreData.score > 0) {
                totalScore += scoreData.score
                totalPar += hole.par || 0
            }
        })

        // 杆差 = 总分 - 总标准杆
        const handicap = totalScore - totalPar

        return {
            ...player,
            handicap: handicap
        }
    })
}
