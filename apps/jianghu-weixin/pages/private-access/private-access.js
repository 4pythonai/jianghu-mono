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
        let userid = app.globalData?.userInfo?.id

        if (!userid && app.storage) {
            const storedUser = app.storage.getUserInfo()
            userid = storedUser?.id
        }

        if (!userid) {
            throw new Error('用户未登录')
        }

        const res = await app.api.game.savePrivateWhiteList({ gameid: gameId, userid })

        if (res?.code !== 200) {
            throw new Error(res?.message || '保存失败')
        }

        return res
    },

    async navigateToGame() {
        const detail = this.data.gameDetail || {}
        const gameid = detail.gameid || this.data.gameId
        const groups = detail.groups || []
        const gameName = detail.game_name || ''
        const course = detail.course || ''
        const navigationHelper = require('@/utils/navigationHelper.js')

        if (!groups || groups.length === 0) {
            await navigationHelper.navigateTo(`/pages/gameDetail/score/score?gameid=${gameid}`)
            return
        }

        if (groups.length === 1) {
            const groupid = groups[0]?.groupid
            await navigationHelper.navigateTo(`/pages/gameDetail/score/score?gameid=${gameid}&groupid=${groupid}`)
            return
        }

        const appInstance = getApp()
        appInstance.globalData = appInstance.globalData || {}
        appInstance.globalData.currentGameGroups = {
            gameid,
            gameName,
            course,
            groups
        }

        await navigationHelper.navigateTo(`/pages/groupsList/groupsList?gameid=${gameid}`)
    }
})
