/**
 * 成绩表 Tab 组件
 * 支持展开球员详细记分情况
 */
import teamgameApi from '@/api/modules/teamgame'
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'
import { holeRangeStore } from '@/stores/game/holeRangeStore'
import { scoreStore } from '@/stores/game/scoreStore'
import { getScoreClass } from '@/utils/gameUtils'

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
        lastRequestKey: '',
        displayScores: []  // 二维成绩矩阵（带 scoreClass）
    },
    observers: {
        'gameId, groupId': function (gameId, groupId) {
            this.fetchScoreBoard(gameId, groupId)
        },
        // 监听 store 数据变化，自动计算 displayScores
        'players, holeList, scores': function (players, holeList, scores) {
            console.log('[RankingBoardTab] Store data updated:', {
                playersLen: players?.length,
                holeListLen: holeList?.length,
                scoresLen: scores?.length
            })
            if (players?.length && holeList?.length) {
                this.calculateDisplayScores()
            }
        }
    },
    lifetimes: {
        attached() {
            // 重置 lastRequestKey，确保每次 attached 都能重新请求
            this.setData({ lastRequestKey: '' })

            // 绑定 store 获取 holeList、players、scores
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['players'],
                actions: []
            })
            this.holeRangeStoreBindings = createStoreBindings(this, {
                store: holeRangeStore,
                fields: ['holeList'],
                actions: []
            })
            this.scoreStoreBindings = createStoreBindings(this, {
                store: scoreStore,
                fields: ['scores'],
                actions: []
            })

            this.fetchScoreBoard(this.data.gameId, this.data.groupId)
        },
        detached() {
            if (this.storeBindings) {
                this.storeBindings.destroyStoreBindings()
            }
            if (this.holeRangeStoreBindings) {
                this.holeRangeStoreBindings.destroyStoreBindings()
            }
            if (this.scoreStoreBindings) {
                this.scoreStoreBindings.destroyStoreBindings()
            }
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
                    // 计算 displayScores
                    this.calculateDisplayScores()
                }
            } catch (err) {
                console.error('[RankingBoardTab] ScoreBoard 请求失败:', err)
            } finally {
                this.setData({ loading: false })
            }
        },

        /**
         * 计算显示用的成绩矩阵（带 scoreClass）
         */
        calculateDisplayScores() {
            const { players, holeList, scores } = this.data
            console.log('[RankingBoardTab] calculateDisplayScores:', {
                playersLen: players?.length,
                holeListLen: holeList?.length,
                scoresLen: scores?.length
            })
            if (!players?.length || !holeList?.length) {
                this.setData({ displayScores: [] })
                return
            }

            // 构建 scores 索引
            const scoreIndex = new Map()
            for (const s of (scores || [])) {
                const key = `${s.user_id}_${s.hindex}`
                scoreIndex.set(key, s)
            }

            // 计算每个球员每洞的成绩
            const displayScores = players.map((player, playerIndex) => {
                const userId = player.user_id
                let outTotal = 0
                let inTotal = 0
                let total = 0

                const holeScores = holeList.map((hole, holeIndex) => {
                    const key = `${userId}_${hole.hindex}`
                    const scoreData = scoreIndex.get(key) || {}
                    const score = scoreData.score || 0
                    const par = hole.par || 0
                    const diff = score > 0 && par > 0 ? score - par : 0
                    const scoreClass = score > 0 ? getScoreClass(diff) : ''

                    if (score > 0) {
                        total += score
                        if (holeIndex < 9) outTotal += score
                        else if (holeIndex < 18) inTotal += score
                    }

                    return {
                        score: score > 0 ? score : '',
                        par,
                        diff,
                        scoreClass
                    }
                })

                // 添加汇总信息
                holeScores.outTotal = outTotal > 0 ? outTotal : ''
                holeScores.inTotal = inTotal > 0 ? inTotal : ''
                holeScores.total = total > 0 ? total : ''

                return holeScores
            })

            this.setData({ displayScores })
        }
    }
});
