/**
 * 成绩表 Tab 组件
 * 占位符组件
 */
import teamgameApi from '@/api/modules/teamgame'

Component({
    properties: {
        gameId: {
            type: null,
            value: null
        },
        groupId: {
            type: null,
            value: null
        }
    },
    data: {
        loading: false,
        scoreboard: null,
        lastRequestKey: ''
    },
    observers: {
        'gameId, groupId': function (gameId, groupId) {
            this.fetchScoreBoard(gameId, groupId)
        }
    },
    lifetimes: {
        attached() {
            this.fetchScoreBoard(this.data.gameId, this.data.groupId)
        }
    },
    methods: {
        async fetchScoreBoard(gameId, groupId) {
            if (!gameId || this.data.loading) {
                return
            }

            const requestKey = `${gameId || ''}:${groupId || ''}`
            if (this.data.lastRequestKey === requestKey) {
                return
            }

            this.setData({ loading: true, lastRequestKey: requestKey })
            try {
                const payload = { game_id: gameId }
                if (groupId) {
                    payload.group_id = groupId
                }
                const res = await teamgameApi.getScoreBoard(payload)
                console.log('[RankingBoardTab] ScoreBoard response:', res)
                if (res?.code === 200) {
                    this.setData({ scoreboard: res.data })
                }
            } catch (err) {
                console.error('[RankingBoardTab] ScoreBoard 请求失败:', err)
            } finally {
                this.setData({ loading: false })
            }
        }
    }
});
