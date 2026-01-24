const app = getApp()

Page({
    data: {
        gameId: null,
        gameType: 'single_team',
        navTitle: '替好友报名(队内赛)',
        gameTags: [],
        selectedTagId: null,
        submitting: false
    },

    async onLoad(options) {
        const gameId = Number(options.game_id)
        const gameType = options.game_type || 'single_team'
        const navTitle = this.getNavTitle(gameType)

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        this.setData({ gameId, gameType, navTitle, selectedTagId: null })

        // 直接调用 API 获取分队列表
        await this.loadGameTags(gameId)
    },

    getNavTitle(gameType) {
        if (gameType === 'single_team') return '替好友报名(队内赛)'
        if (gameType === 'cross_teams') return '替好友报名(队际赛)'
        return '替好友报名'
    },

    /**
     * 加载分队列表
     */
    async loadGameTags(gameId) {
        try {
            const res = await app.api.teamgame.getGameTags({ game_id: gameId })
            if (res?.code === 200 && res.data) {
                const gameTags = res.data.map(t => ({
                    id: t.id,
                    tagName: t.tag_name
                }))

                this.setData({ gameTags })

                // 队内赛且只有1个分队：自动选中（只在 onLoad 执行一次）
                if (this.data.gameType === 'single_team' && gameTags.length === 1) {
                    this.setData({ selectedTagId: gameTags[0].id })
                }
            }
        } catch (err) {
            console.error('[teamGameAddFriend] 加载分队失败:', err)
        }
    },

    /**
     * 分队选择变化
     */
    onTagChange(e) {
        const tagId = Number(e.detail.value)
        this.setData({ selectedTagId: tagId })
    },

    /**
     * 好友选择确认
     */
    async onFriendConfirm(e) {
        const { friends } = e.detail
        const { gameId, gameType, selectedTagId, submitting } = this.data

        if (submitting) return

        if (selectedTagId == null) {
            wx.showToast({ title: '请选择分队', icon: 'none' })
            return
        }

        if (!friends || friends.length === 0) {
            wx.showToast({ title: '请选择好友', icon: 'none' })
            return
        }

        this.setData({ submitting: true })
        wx.showLoading({ title: '报名中...' })

        try {
            const userIds = friends.map(friend => friend.user_id)
            const result = await app.api.teamgame.batchAddFriendRegistration({
                game_id: gameId,
                game_type: gameType,
                tag_id: selectedTagId,
                user_ids: userIds
            })

            if (result?.code === 200) {
                wx.showModal({
                    title: '提示',
                    content: result.message,
                    showCancel: false,
                    success: () => {
                        wx.navigateBack({ delta: 1 })
                    }
                })
                return
            }

            wx.showToast({
                title: result?.message || '报名失败',
                icon: 'none'
            })
        } catch (err) {
            console.error('[teamGameAddFriend] 报名失败:', err)
            wx.showToast({ title: '报名失败，请稍后重试', icon: 'none' })
        } finally {
            wx.hideLoading()
            this.setData({ submitting: false })
        }
    },

    /**
     * 取消选择
     */
    onCancel() {
        wx.navigateBack({ delta: 1 })
    }
})
