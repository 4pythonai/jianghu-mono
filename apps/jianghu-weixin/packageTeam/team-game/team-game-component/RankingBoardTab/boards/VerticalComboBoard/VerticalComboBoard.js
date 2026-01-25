/**
 * Vertical combo board.
 * 显示组合/Combo的竖向排行榜
 */
import { imageUrl } from '@/utils/image'

Component({
    properties: {
        boardData: {
            type: Object,
            value: null
        },
        holeList: {
            type: Array,
            value: []
        },
        players: {
            type: Array,
            value: []
        },
        displayScores: {
            type: Array,
            value: []
        }
    },
    data: {
        rows: [],
        expandedComboId: null
    },
    observers: {
        'boardData.rows': function (rows) {
            this.setData({
                rows: this.normalizeRows(rows)
            })
        },
        'displayScores': function (displayScores) {
            // displayScores 更新时，重新渲染
            if (this.data.rows.length > 0) {
                this.setData({
                    rows: this.normalizeRows(this.data.boardData.rows)
                })
            }
        }
    },
    methods: {
        normalizeRows(rows = []) {
            if (!Array.isArray(rows)) {
                return []
            }
            return rows.map(row => ({
                ...row,
                rankText: row.rank_label ?? '',
                scoreText: this.formatScore(row.score),
                thruText: row.thru_label ?? '',
                comboLabel: this.getComboLabel(row),
                memberCount: row.members?.length ?? 0,
                members: this.normalizeMembersWithImages(row.members ?? []),
                // 使用 group_id + combo_id 作为唯一标识，避免重复 key
                uniqueComboId: `${row.group_id}_${row.combo_id}`,
                // 计算combo整体成绩（所有成员成绩合并）
                comboScore: this.calculateComboScore(row.members ?? [])
            }))
        },
        /**
         * 计算 combo 整体成绩（所有成员的成绩合并）
         * @param {Array} members - combo 中的成员列表
         * @returns {Object} combo 的综合成绩数据
         */
        calculateComboScore(members = []) {
            if (members.length === 0) {
                return null
            }

            const displayScores = this.data.displayScores || []
            const holeList = this.data.holeList || []

            // 为该combo的所有成员聚合成绩
            let totalOutDiff = 0
            let totalInDiff = 0
            let totalTotalDiff = 0
            let totalOutScore = 0
            let totalInScore = 0
            let totalScore = 0

            const comboHoles = holeList.map((hole, holeIndex) => {
                let holeComboScore = 0
                let holeComboDiff = 0

                // 累加该洞上所有成员的成绩
                members.forEach(member => {
                    const playerIndex = this.getPlayerIndex(member.user_id)
                    if (playerIndex >= 0 && displayScores[playerIndex]) {
                        const playerHoleData = displayScores[playerIndex].holes[holeIndex]
                        if (playerHoleData && playerHoleData.score > 0) {
                            holeComboScore += playerHoleData.score
                        }
                    }
                })

                // 计算该洞的相对杆数
                if (holeComboScore > 0) {
                    const holePar = hole.par || 0
                    holeComboDiff = holeComboScore - holePar
                    totalScore += holeComboScore

                    if (holeIndex < 9) {
                        totalOutScore += holeComboScore
                        totalOutDiff += holeComboDiff
                    } else if (holeIndex < 18) {
                        totalInScore += holeComboScore
                        totalInDiff += holeComboDiff
                    }
                }

                return {
                    score: holeComboScore > 0 ? holeComboScore : '',
                    par: hole.par || 0,
                    diff: holeComboDiff,
                    scoreClass: this.getDiffScoreClass(holeComboDiff)
                }
            })

            totalTotalDiff = totalOutDiff + totalInDiff

            return {
                holes: comboHoles,
                outTotal: totalOutScore > 0 ? totalOutScore : '',
                outDiff: totalOutDiff,
                outDiffText: totalOutScore > 0 ? (totalOutDiff > 0 ? `+${totalOutDiff}` : `${totalOutDiff}`) : '',
                inTotal: totalInScore > 0 ? totalInScore : '',
                inDiff: totalInDiff,
                inDiffText: totalInScore > 0 ? (totalInDiff > 0 ? `+${totalInDiff}` : `${totalInDiff}`) : '',
                total: totalScore > 0 ? totalScore : '',
                totalDiff: totalTotalDiff,
                totalDiffText: totalScore > 0 ? (totalTotalDiff > 0 ? `+${totalTotalDiff}` : `${totalTotalDiff}`) : ''
            }
        },
        /**
         * 根据相对杆数获取成绩等级 CSS 类名
         */
        getDiffScoreClass(diff) {
            if (diff <= -2) return 'score-eagle'       // 老鹰及以下
            if (diff === -1) return 'score-birdie'     // 小鸟
            if (diff === 0) return 'score-par'         // 平标
            if (diff === 1) return 'score-bogey'       // 柏忌
            if (diff === 2) return 'score-double-bogey' // 双柏忌
            if (diff >= 3) return 'score-triple-bogey'  // 三柏忌及以上
            return 'score-par'
        },
        formatScore(score) {
            const value = Number(score)
            if (Number.isNaN(value)) {
                return ''
            }
            if (value > 0) {
                return `+${value}`
            }
            if (value === 0) {
                return 'E'
            }
            return String(value)
        },
        getComboLabel(row) {
            // 不显示组合标签
            return ''
        },
        normalizeMembersWithImages(members = []) {
            return members.map(m => ({
                ...m,
                avatarUrl: imageUrl(m.avatar)
            }))
        },
        /**
         * 点击 combo 行，展开/收起详情
         */
        onComboRowTap(e) {
            const comboId = e.currentTarget.dataset.comboId
            const currentExpanded = this.data.expandedComboId
            this.setData({
                expandedComboId: currentExpanded === comboId ? null : comboId
            })
        },
        /**
         * 获取 combo 中成员在 displayScores 中的索引
         * @param {number} userId - 成员的 user_id
         * @returns {number} displayScores 中的索引，-1 表示未找到
         */
        getPlayerIndex(userId) {
            const players = this.data.players || []
            const index = players.findIndex(p => p.user_id === userId)
            return index
        }
    }
})
