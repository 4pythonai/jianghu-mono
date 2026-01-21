const app = getApp()
const { imageUrl } = require('@/utils/image')

const PERMISSION_OPTIONS = [
    { key: 'admin', label: '球队管理员' },
    { key: 'group_player', label: '本组球员' },
    { key: 'caddie', label: '球童' }
]

Page({
    data: {
        gameId: null,
        gameType: 'single_team',
        permissionOptions: PERMISSION_OPTIONS.map(option => ({
            ...option,
            checked: false
        })),
        selectedPermissions: [],
        saving: false,
        caddieQrcode: '',
        loadingQrcode: false,
        showCaddieQrcode: false
    },

    onLoad(options) {
        const gameId = Number(options.game_id)
        const gameType = options.game_type || 'single_team'

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        this.setData({ gameId, gameType })
        this.loadScorePermission(gameId, gameType)
    },

    onPermissionChange(e) {
        const selectedPermissions = (e.detail.value || []).map(value => String(value))
        const permissionOptions = this.buildPermissionOptions(selectedPermissions)
        const showCaddieQrcode = selectedPermissions.includes('caddie')
        this.setData({ selectedPermissions, permissionOptions, showCaddieQrcode })

        // 如果选中了球童，加载二维码
        if (showCaddieQrcode && !this.data.caddieQrcode) {
            this.loadCaddieQrcode()
        }
    },

    buildScorePermissionPayload() {
        const { permissionOptions, selectedPermissions } = this.data
        return permissionOptions.reduce((payload, option) => {
            payload[option.key] = selectedPermissions.includes(option.key)
            return payload
        }, {})
    },

    buildPermissionOptions(selectedPermissions) {
        const selectedSet = new Set((selectedPermissions || []).map(value => String(value)))
        return PERMISSION_OPTIONS.map(option => ({
            ...option,
            checked: selectedSet.has(option.key)
        }))
    },

    async loadScorePermission(gameIdParam, gameTypeParam) {
        const gameId = gameIdParam || this.data.gameId
        const gameType = gameTypeParam || this.data.gameType

        if (!gameId) {
            return
        }

        wx.showLoading({ title: '加载中...' })

        try {
            const apiMethod = gameType === 'cross_teams'
                ? app.api.teamgame.getCrossTeamGameDetail
                : app.api.teamgame.getSingleTeamGameDetail
            const result = await apiMethod({ game_id: gameId })

            console.log('[scorePermissionManage] detail response:', {
                gameId,
                gameType,
                code: result?.code,
                score_permission: result?.data?.score_permission
            })

            wx.hideLoading()

            if (result?.code !== 200 || !result.data) {
                wx.showToast({ title: result?.message || '加载失败', icon: 'none' })
                return
            }

            if (!gameTypeParam && result.data.game_type) {
                this.setData({ gameType: result.data.game_type })
            }

            let scorePermission = result.data.score_permission
            if (!scorePermission) {
                return
            }

            if (typeof scorePermission === 'string') {
                try {
                    scorePermission = JSON.parse(scorePermission)
                } catch (err) {
                    console.error('[scorePermissionManage] score_permission 解析失败:', err)
                    return
                }
            }

            console.log('[scorePermissionManage] score_permission parsed:', scorePermission)

            if (!scorePermission || typeof scorePermission !== 'object') {
                return
            }

            const selectedPermissions = this.data.permissionOptions
                .filter(option => !!scorePermission[option.key])
                .map(option => option.key)
            const permissionOptions = this.buildPermissionOptions(selectedPermissions)

            console.log('[scorePermissionManage] selectedPermissions:', selectedPermissions)

            const showCaddieQrcode = selectedPermissions.includes('caddie')
            this.setData({ selectedPermissions, permissionOptions, showCaddieQrcode })

            // 如果已选中球童，加载二维码
            if (showCaddieQrcode) {
                this.loadCaddieQrcode()
            }
        } catch (err) {
            wx.hideLoading()
            console.error('[scorePermissionManage] 加载失败:', err)
            wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' })
        }
    },

    async loadCaddieQrcode() {
        const { gameId, loadingQrcode, caddieQrcode } = this.data
        if (loadingQrcode || caddieQrcode) return

        this.setData({ loadingQrcode: true })

        try {
            const result = await app.api.teamgame.caddieInputQrcode({ game_id: gameId })
            console.log('[scorePermissionManage] caddieInputQrcode response:', result)

            if (result?.code === 200 && result.data?.qrcode) {
                this.setData({ caddieQrcode: imageUrl(result.data.qrcode) })
            }
        } catch (err) {
            console.error('[scorePermissionManage] 获取球童二维码失败:', err)
        } finally {
            this.setData({ loadingQrcode: false })
        }
    },

    async onSave() {
        const { gameId, selectedPermissions, saving } = this.data

        if (saving) {
            return
        }

        if (!gameId) {
            wx.showToast({ title: '赛事信息缺失', icon: 'none' })
            return
        }

        if (selectedPermissions.length === 0) {
            wx.showToast({ title: '请至少选择一项', icon: 'none' })
            return
        }

        this.setData({ saving: true })
        wx.showLoading({ title: '保存中...' })

        try {
            const result = await app.api.game.updateScorePermission({
                gameid: gameId,
                score_permission: this.buildScorePermissionPayload()
            })

            wx.hideLoading()

            if (result?.code === 200) {
                wx.showToast({ title: result.message || '保存成功', icon: 'success' })
                wx.navigateBack({ delta: 1 })
                return
            }

            wx.showToast({ title: result?.message || '保存失败', icon: 'none' })
        } catch (err) {
            wx.hideLoading()
            console.error('[scorePermissionManage] 保存失败:', err)
            wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
        } finally {
            this.setData({ saving: false })
        }
    }
})
