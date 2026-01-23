const app = getApp()

Page({
    data: {
        gameId: null,
        passwordInput: '',
        errorMessage: '',
        gameDetail: null,
        loading: false,
        submitting: false,
        showPasswordModal: false,
        inputFocus: false
    },

    onLoad(options) {
        const gameId = Number.parseInt(options.gameid, 10)
        if (!gameId) {
            wx.showToast({ title: '无效的比赛信息', icon: 'none' })
            return
        }

        this.setData({ gameId })
        this.fetchGameDetail(gameId)
    },

    async fetchGameDetail(gameId) {
        this.setData({ loading: true, errorMessage: '' })

        try {
            const res = await app.api.game.getGameDetail(
                { gameid: gameId },
                { loadingTitle: '加载比赛...' }
            )

            if (res?.code === 200 && res.game_detail) {
                this.setData({ gameDetail: res.game_detail })
            } else {
                wx.showToast({ title: res?.message || '未找到比赛信息', icon: 'none' })
            }
        } catch (error) {
            console.error('❌ 加载比赛详情失败:', error)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    onUnlockTap() {
        if (this.data.loading) {
            return
        }
        this.setData({
            showPasswordModal: true,
            errorMessage: '',
            passwordInput: '',
            inputFocus: false
        })
        // 延迟设置焦点，确保弹窗渲染完成
        setTimeout(() => {
            this.setData({ inputFocus: true })
        }, 300)
    },

    onCloseModal() {
        this.setData({
            showPasswordModal: false,
            errorMessage: '',
            passwordInput: '',
            inputFocus: false
        })
    },

    // 点击输入框时手动获取焦点
    onInputTap() {
        if (!this.data.inputFocus) {
            this.setData({ inputFocus: true })
        }
    },

    // 阻止事件冒泡
    noop() {
        // 空函数，阻止点击事件冒泡到外层关闭弹窗
    },

    onPasswordInput(e) {
        this.setData({
            passwordInput: e.detail.value || '',
            errorMessage: ''
        })
    },

    async onSubmit() {
        if (this.data.loading || this.data.submitting) {
            return
        }

        if (!this.data.gameDetail) {
            wx.showToast({ title: '请稍后重试', icon: 'none' })
            return
        }

        const input = (this.data.passwordInput || '').trim()
        const correct = (this.data.gameDetail.privacy_password || '').trim()

        if (!input) {
            this.setData({ errorMessage: '请输入密码' })
            wx.showToast({ title: '请输入密码', icon: 'none' })
            return
        }

        if (input !== correct) {
            this.setData({ errorMessage: '密码不正确' })
            wx.showToast({ title: '密码不正确', icon: 'none' })
            return
        }

        this.setData({ submitting: true })
        try {
            await this.saveWhiteList()
            this.setData({ showPasswordModal: false })
            wx.showToast({ title: '验证成功', icon: 'success' })

            setTimeout(async () => {
                await this.navigateToGame()
            }, 1000)
        } catch (error) {
            console.error('❌ 验证/写入白名单失败:', error)
            wx.showToast({ title: error.message || '校验失败', icon: 'none' })
        } finally {
            this.setData({ submitting: false })
        }
    },

    async saveWhiteList() {
        const gameId = this.data.gameId
        let user_id = app.globalData?.userInfo?.id

        if (!user_id && app.storage) {
            const storedUser = app.storage.getUserInfo()
            user_id = storedUser?.id
        }

        if (!user_id) {
            throw new Error('用户未登录')
        }

        const res = await app.api.game.savePrivateWhiteList({ gameid: gameId, user_id: user_id })

        if (res?.code !== 200) {
            throw new Error(res?.message || '保存失败')
        }

        return res
    },

    async navigateToGame() {
        const detail = this.data.gameDetail || {}
        const gameid = detail.gameid || this.data.gameId
        const groups = detail.groups || []
        const game_type = detail.game_type || 'common'
        const navigationHelper = require('@/utils/navigationHelper.js')

        // 如果有2个或更多分组，进入 eventHubPanel
        if (groups && groups.length >= 2) {
            await navigationHelper.navigateTo(`/packageTeam/eventHubPanel/eventHubPanel?gameid=${gameid}&game_type=${game_type}`)
            return
        }

        // 单组或无分组，直接进入 score 页面
        const groupid = groups && groups.length === 1 ? groups[0]?.groupid : ''
        const url = groupid
            ? `/packageGame/gameDetail/score/score?gameid=${gameid}&groupid=${groupid}`
            : `/packageGame/gameDetail/score/score?gameid=${gameid}`
        await navigationHelper.navigateTo(url)
    }
})
