/**
 * G1 team + player board (team_player mode).
 * 手风琴式折叠展开：点击分队行展开该队球员列表，点击球员展开逐洞成绩
 */
import { imageUrl } from '@/utils/image'

Component({
    properties: {
        boardData: {
            type: Object,
            value: null
        },
        /** 球洞列表 */
        holeList: {
            type: Array,
            value: []
        },
        /** 球员列表 */
        players: {
            type: Array,
            value: []
        },
        /** 二维成绩矩阵 displayScores[playerIndex][holeIndex] */
        displayScores: {
            type: Array,
            value: []
        }
    },
    data: {
        teamRows: [],
        n: 0,
        expandedTagId: null,
        expandedPlayers: [],
        expandedPlayerId: null  // 当前展开的球员 user_id
    },
    observers: {
        'boardData.team.rows, boardData.team.n': function (rows, n) {
            this.setData({
                teamRows: this.normalizeTeamRows(rows || []),
                n: Number(n) || 0,
                expandedTagId: null,
                expandedPlayers: [],
                expandedPlayerId: null
            })
        }
    },
    methods: {
        normalizeTeamRows(rows) {
            if (!Array.isArray(rows)) {
                return []
            }
            return rows.map(r => ({
                ...r,
                rankText: r.rank_label ?? '',
                validNText: String(r.valid_n ?? ''),
                scoreText: this.formatScore(r.score),
                isForfeit: !!r.forfeit
            }))
        },
        formatScore(score) {
            const value = Number(score)
            if (!Number.isFinite(value) || value > 1000000000) {
                return '--'
            }
            if (value > 0) {
                return `+${value}`
            }
            return `${value}`
        },
        formatPlayerScore(player) {
            const score = player.score
            const value = Number(score)
            if (!Number.isFinite(value)) {
                return '--'
            }
            if (value > 0) {
                return `+${value}`
            }
            return `${value}`
        },
        onTeamRowTap(e) {
            const tagId = e.currentTarget.dataset.tagId
            if (this.data.expandedTagId === tagId) {
                // 再次点击收起
                this.setData({ expandedTagId: null, expandedPlayers: [], expandedPlayerId: null })
            } else {
                // 展开新的，按 tag_id 过滤球员
                const allPlayers = this.data.boardData?.player?.rows || []
                const { players } = this.data
                // 构建 user_id -> playerIndex 映射
                const playerIndexMap = new Map()
                players.forEach((p, idx) => {
                    playerIndexMap.set(String(p.user_id), idx)
                })

                const filtered = allPlayers
                    .filter(p => p.tag_id === tagId)
                    .map(p => {
                        const userIdStr = String(p.user_id)
                        const playerIndex = playerIndexMap.get(userIdStr) ?? -1
                        return {
                            ...p,
                            user_id: userIdStr,
                            playerIndex,
                            avatarUrl: imageUrl(p.avatar),
                            scoreText: this.formatPlayerScore(p)
                        }
                    })
                this.setData({ expandedTagId: tagId, expandedPlayers: filtered, expandedPlayerId: null })
            }
        },
        onPlayerRowTap(e) {
            const userId = String(e.currentTarget.dataset.userId)
            const currentExpanded = this.data.expandedPlayerId
            this.setData({
                expandedPlayerId: currentExpanded === userId ? null : userId
            })
        }
    }
});

