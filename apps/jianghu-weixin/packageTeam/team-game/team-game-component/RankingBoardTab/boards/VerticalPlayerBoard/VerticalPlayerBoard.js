/**
 * Vertical player board.
 * 支持点击展开球员详细记分情况
 */
import { getScoreClass } from '@/utils/gameUtils'
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
        rows: [],
        expandedUserId: null  // 当前展开的球员 user_id
    },
    observers: {
        'boardData.rows, players': function (rows, players) {
            this.setData({ rows: this.normalizeRows(rows, players) })
        }
    },
    methods: {
        normalizeRows(rows = [], players = []) {
            if (!Array.isArray(rows)) {
                return []
            }
            // 构建 user_id -> playerIndex 映射
            const playerIndexMap = new Map()
            players.forEach((p, idx) => {
                playerIndexMap.set(String(p.user_id), idx)
            })

            return rows.map((row, index) => {
                // 根据 user_id 找到在 players 数组中的索引
                const userIdStr = String(row.user_id)
                const playerIndex = playerIndexMap.get(userIdStr) ?? index
                return {
                    ...row,
                    user_id: userIdStr,  // 统一为字符串类型
                    playerIndex,
                    rankText: row.rank_label ?? '',
                    scoreText: this.formatScore(row.score),
                    thruText: row.thru_label ?? '',
                    avatarUrl: imageUrl(row.avatar)
                }
            })
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
        /** 点击行展开/收起详情 */
        onRowTap(e) {
            const userId = e.currentTarget.dataset.userId
            const currentExpanded = this.data.expandedUserId
            const { holeList, displayScores } = this.data
            console.log('[VerticalPlayerBoard] onRowTap:', {
                userId,
                currentExpanded,
                holeListLen: holeList?.length,
                holeNames: holeList?.map(h => h.holename),
                displayScoresLen: displayScores?.length
            })
            // 统一使用字符串比较
            const userIdStr = String(userId)
            this.setData({
                expandedUserId: currentExpanded === userIdStr ? null : userIdStr
            })
        },
        /** 获取某洞成绩的样式类 */
        getScoreClass(score, par) {
            if (!score || !par) return ''
            const diff = score - par
            return getScoreClass(diff)
        },
        /** 计算前9洞总杆 */
        calcOutTotal(playerIndex) {
            const { displayScores, holeList } = this.data
            if (!displayScores || !displayScores[playerIndex] || holeList.length < 9) return ''
            let total = 0
            for (let i = 0; i < 9 && i < holeList.length; i++) {
                const s = displayScores[playerIndex][i]?.score
                if (s && s > 0) total += s
            }
            return total > 0 ? total : ''
        },
        /** 计算后9洞总杆 */
        calcInTotal(playerIndex) {
            const { displayScores, holeList } = this.data
            if (!displayScores || !displayScores[playerIndex] || holeList.length < 18) return ''
            let total = 0
            for (let i = 9; i < 18 && i < holeList.length; i++) {
                const s = displayScores[playerIndex][i]?.score
                if (s && s > 0) total += s
            }
            return total > 0 ? total : ''
        },
        /** 计算总杆 */
        calcTotal(playerIndex) {
            const { displayScores, holeList } = this.data
            if (!displayScores || !displayScores[playerIndex]) return ''
            let total = 0
            for (let i = 0; i < holeList.length; i++) {
                const s = displayScores[playerIndex][i]?.score
                if (s && s > 0) total += s
            }
            return total > 0 ? total : ''
        }
    }
});
