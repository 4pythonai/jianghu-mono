/**
 * Vertical tag board.
 * 显示分队/标签的竖向排行榜，支持点击展开查看各分组组合成绩
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
        rows: [],
        totalGroups: 0,
        expandedTagId: null,
        expandedCombos: []
    },
    observers: {
        'boardData.rows': function (rows) {
            this.setData({
                rows: this.normalizeRows(rows),
                totalGroups: this.calcTotalGroups(rows),
                expandedTagId: null,
                expandedCombos: []
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
                groupCount: row.groups?.length ?? 0
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
        calcTotalGroups(rows = []) {
            if (!Array.isArray(rows)) {
                return 0
            }
            // 统计所有分组的数量（去重）
            const groupIds = new Set()
            rows.forEach(row => {
                (row.groups || []).forEach(g => {
                    if (g.group_id) {
                        groupIds.add(g.group_id)
                    }
                })
            })
            return groupIds.size
        },
        onTagRowTap(e) {
            const tagId = e.currentTarget.dataset.tagId
            if (this.data.expandedTagId === tagId) {
                // 再次点击收起
                this.setData({ expandedTagId: null, expandedCombos: [] })
            } else {
                // 展开新的
                const row = this.data.rows.find(r => r.tag_id === tagId)
                const combos = this.normalizeCombos(row?.combos || [])
                this.setData({ expandedTagId: tagId, expandedCombos: combos })
            }
        },
        normalizeCombos(combos) {
            if (!Array.isArray(combos)) {
                return []
            }
            return combos.map(c => ({
                ...c,
                rankText: c.rank_label ?? '',
                scoreText: this.formatScore(c.score),
                thruText: c.thru_label ?? '',
                memberNames: this.formatMemberNames(c.members),
                memberAvatars: (c.members || []).map(m => imageUrl(m.avatar))
            }))
        },
        formatMemberNames(members) {
            if (!Array.isArray(members) || members.length === 0) {
                return ''
            }
            return members.map(m => m.show_name).join('/')
        }
    }
});
