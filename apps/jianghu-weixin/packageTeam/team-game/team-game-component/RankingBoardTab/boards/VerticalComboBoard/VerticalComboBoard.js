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
                members: this.normalizeMembersWithImages(row.members ?? [])
            }))
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
