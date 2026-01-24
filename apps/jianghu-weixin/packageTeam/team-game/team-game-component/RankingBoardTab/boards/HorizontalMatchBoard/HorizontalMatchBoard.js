/**
 * Horizontal match board.
 * 支持比洞赛：单组对阵 + 多分组汇总（summary）
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
        vm: null
    },
    observers: {
        boardData: function (boardData) {
            this.setData({ vm: this.buildViewModel(boardData) })
        }
    },
    methods: {
        buildViewModel(boardData) {
            if (!boardData) {
                return null
            }

            const isSummary = boardData.mode === 'summary'
            if (isSummary) {
                const left = boardData.left || {}
                const right = boardData.right || {}
                const points = boardData.points || {}
                const matches = Array.isArray(boardData.matches) ? boardData.matches : []

                return {
                    isSummary: true,
                    header: {
                        left: {
                            tag_id: left.tag_id,
                            tag_name: left.tag_name,
                            tag_color: left.tag_color
                        },
                        right: {
                            tag_id: right.tag_id,
                            tag_name: right.tag_name,
                            tag_color: right.tag_color
                        },
                        pointsLeftText: this.formatPoints(points.left),
                        pointsRightText: this.formatPoints(points.right)
                    },
                    rows: matches.map(m => this.normalizeMatchRow(m))
                }
            }

            // Single match payload (same as old horizontal response)
            const singleRow = {
                group_id: boardData.group_id,
                group_name: boardData.group_name,
                left: boardData.left,
                right: boardData.right,
                result: boardData.result
            }

            return {
                isSummary: false,
                header: {
                    left: this.getSideHeader(boardData.left),
                    right: this.getSideHeader(boardData.right),
                    pointsLeftText: '',
                    pointsRightText: ''
                },
                rows: [this.normalizeMatchRow(singleRow)]
            }
        },

        getSideHeader(side = {}) {
            if (side.tag_id) {
                return {
                    tag_id: side.tag_id,
                    tag_name: side.tag_name,
                    tag_color: side.tag_color
                }
            }
            // individual_match single mode only has player info
            return {
                tag_id: null,
                tag_name: side.show_name || '',
                tag_color: null
            }
        },

        normalizeMatchRow(match = {}) {
            const left = this.normalizeSide(match.left)
            const right = this.normalizeSide(match.right)

            const winnerSide = match?.result?.winner_side || null
            const resultText = match?.result?.text || ''
            const status = match?.status || null

            const statusText = resultText
                ? resultText
                : (status === 'playing' ? '进行中' : '未开始')

            const thruLabel = this.formatThruLabel(match?.holes_played)

            return {
                group_id: match.group_id,
                group_name: match.group_name || '',
                left,
                right,
                winnerSide,
                thruLabel,
                // show on winning side; draw shows in middle; otherwise show status in middle
                leftResultText: winnerSide === 'left' ? statusText : '',
                rightResultText: winnerSide === 'right' ? statusText : '',
                centerResultText: winnerSide === 'draw' ? statusText : (winnerSide ? '' : statusText)
            }
        },

        normalizeSide(side) {
            if (!side) {
                return {
                    type: 'unknown',
                    show_name: '',
                    avatarUrl: '',
                    tag_id: null,
                    tag_name: '',
                    tag_color: null,
                    membersText: ''
                }
            }

            // player side
            if (side.user_id) {
                return {
                    type: 'player',
                    show_name: side.show_name || '',
                    avatarUrl: side.avatar ? imageUrl(side.avatar) : '',
                    tag_id: side.tag_id ?? null,
                    tag_name: side.tag_name || '',
                    tag_color: side.tag_color ?? null,
                    membersText: ''
                }
            }

            // tag side
            const members = Array.isArray(side.members) ? side.members : []
            const membersText = members
                .map(m => m?.show_name)
                .filter(Boolean)
                .join(' / ')

            return {
                type: 'tag',
                show_name: side.tag_name || '',
                avatarUrl: '',
                tag_id: side.tag_id ?? null,
                tag_name: side.tag_name || '',
                tag_color: side.tag_color ?? null,
                membersText
            }
        },

        formatPoints(value) {
            const num = Number(value)
            if (Number.isNaN(num)) {
                return '0'
            }
            // keep .5 if needed
            if (Math.abs(num % 1) > 0.000001) {
                return num.toFixed(1)
            }
            return String(num)
        },

        formatThruLabel(holesPlayed) {
            const n = Number(holesPlayed)
            if (!Number.isFinite(n) || n <= 0) {
                return ''
            }
            // default 18 holes for match play
            if (n >= 18) {
                return 'F'
            }
            return String(n)
        }
    }
});
