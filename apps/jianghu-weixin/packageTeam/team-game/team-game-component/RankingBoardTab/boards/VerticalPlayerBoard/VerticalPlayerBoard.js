/**
 * Vertical player board.
 */
import { config } from '@/api/config'

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
            this.setData({ rows: this.normalizeRows(rows) })
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
                avatarUrl: this.normalizeAvatar(row.avatar)
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
            return `${value}`
        },
        normalizeAvatar(avatar) {
            if (!avatar) {
                return ''
            }
            if (avatar.startsWith('http')) {
                return avatar
            }
            if (avatar.startsWith('/')) {
                return `${config.staticURL}${avatar}`
            }
            return avatar
        }
    }
});
