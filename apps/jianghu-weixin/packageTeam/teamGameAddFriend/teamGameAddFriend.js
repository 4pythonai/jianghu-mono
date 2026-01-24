const app = getApp()

Page({
    data: {
        gameId: null,
        gameType: 'single_team',
        navTitle: '替好友报名(队内赛)',
        submitting: false
    },

    onLoad(options) {
        const gameId = Number(options.game_id)
        const gameType = options.game_type || 'single_team'
        const navTitle = this.getNavTitle(gameType)

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        this.setData({ gameId, gameType, navTitle })
    },

    getNavTitle(gameType) {
        if (gameType === 'single_team') return '替好友报名(队内赛)'
        if (gameType === 'cross_teams') return '替好友报名(队际赛)'
        return '替好友报名'
    },

    /**
     * 好友选择确认
     */
    async onFriendConfirm(e) {
        const { friends } = e.detail
        const { gameId, gameType, submitting } = this.data

        if (submitting) return

        if (!friends || friends.length === 0) {
            wx.showToast({ title: '请选择好友', icon: 'none' })
            return
        }

        this.setData({ submitting: true })
        wx.showLoading({ title: '报名中...' })

        try {
            // 逐个为好友报名
            const results = []
            for (const friend of friends) {
                const result = await this.registerForFriend(friend.user_id, gameType)
                results.push({
                    user_id: friend.user_id,
                    show_name: friend.show_name,
                    success: result.success,
                    message: result.message
                })
            }

            wx.hideLoading()

            // 统计结果
            const successCount = results.filter(r => r.success).length
            const failedResults = results.filter(r => !r.success)

            if (failedResults.length === 0) {
                wx.showToast({
                    title: `成功为 ${successCount} 位好友报名`,
                    icon: 'success'
                })
                setTimeout(() => {
                    wx.navigateBack({ delta: 1 })
                }, 1500)
            } else if (successCount > 0) {
                // 部分成功
                const failedNames = failedResults.map(r => r.show_name).join('、')
                wx.showModal({
                    title: '部分报名成功',
                    content: `成功 ${successCount} 人，失败 ${failedResults.length} 人\n失败: ${failedNames}\n原因: ${failedResults[0].message}`,
                    showCancel: false,
                    success: () => {
                        wx.navigateBack({ delta: 1 })
                    }
                })
            } else {
                // 全部失败
                wx.showToast({
                    title: failedResults[0].message || '报名失败',
                    icon: 'none'
                })
            }
        } catch (err) {
            wx.hideLoading()
            console.error('[teamGameAddFriend] 报名失败:', err)
            wx.showToast({ title: '报名失败，请稍后重试', icon: 'none' })
        } finally {
            this.setData({ submitting: false })
        }
    },

    /**
     * 为单个好友报名
     */
    async registerForFriend(userId, gameType) {
        const { gameId } = this.data

        try {
            const apiMethod = gameType === 'cross_teams'
                ? app.api.teamgame.registerCrossTeamGame
                : app.api.teamgame.registerSingleTeamGame

            const result = await apiMethod({
                game_id: gameId,
                user_id: userId
            })

            if (result?.code === 200) {
                return { success: true }
            }
            return { success: false, message: result?.message || '报名失败' }
        } catch (err) {
            return { success: false, message: err.message || '网络错误' }
        }
    },

    /**
     * 取消选择
     */
    onCancel() {
        wx.navigateBack({ delta: 1 })
    }
})
