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
        }
    },
    data: {
        rows: []
    },
    observers: {
        'boardData.rows': function (rows) {
            this.setData({
                rows: this.normalizeRows(rows)
            })
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
        }
    }
})
