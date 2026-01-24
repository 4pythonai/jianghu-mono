/**
 * Vertical tag board.
 * 显示分队/标签的竖向排行榜
 */

Component({
    properties: {
        boardData: {
            type: Object,
            value: null
        }
    },
    data: {
        rows: [],
        totalGroups: 0
    },
    observers: {
        'boardData.rows': function (rows) {
            this.setData({
                rows: this.normalizeRows(rows),
                totalGroups: this.calcTotalGroups(rows)
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
                memberCount: row.members?.length ?? 0,
                memberAvatars: this.extractAvatars(row.members)
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
        extractAvatars(members = []) {
            if (!Array.isArray(members)) {
                return []
            }
            return members.map(m => m.avatar)
        },
        calcTotalGroups(rows = []) {
            if (!Array.isArray(rows)) {
                return 0
            }
            // 统计所有组的数量
            let total = 0
            rows.forEach(row => {
                total += row.members?.length ?? 0
            })
            return total
        }
    }
});
