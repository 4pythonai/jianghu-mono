import api from '../api/index'
import storage from './storage'

/**
 * 认证管理器
 * 职责:微信登录、token验证、静默重登、状态同步
 */
class AuthManager {
    constructor() {
        this.app = null
        this.isRefreshing = false
        this.retryCount = 0
        this.maxRetries = 3
        this.silentLoginPromise = null
    }

    initialize(app) {
        this.app = app
        storage.migrate()
        this.setupEventListeners()
        return this.checkAuthState()
    }

    setupEventListeners() {
        this.app.on('authCheck', () => {
            this.checkAuthState()
        })

        this.app.on('tokenExpired', () => {
            this.handleTokenExpired()
        })
    }

    async checkAuthState() {
        if (!storage.hasToken()) {
            return await this.startWxLogin()
        }
        try {
            return await this.verifyToken()
        } catch (error) {
            return await this.startWxLogin()
        }
    }

    async verifyToken() {
        const response = await api.user.getUserInfo({}, {
            showLoading: false
        })

        if (!response || !response.user) {
            throw new Error('获取用户信息失败')
        }

        const stored = this.storeAuthData({
            user: response.user,
            profileStatus: response.profile_status,
            needBindPhone: response.need_bind_phone
        })

        this.app.handleLoginSuccess(stored)
        return { success: true, ...stored }
    }

    async startWxLogin() {
        this.retryCount = 0

        while (this.retryCount < this.maxRetries) {
            try {
                return await this.loginOnce({
                    notifyApp: true,
                    showLoading: true,
                    loadingTitle: '登录中...'
                })
            } catch (error) {
                this.retryCount++

                if (this.retryCount >= this.maxRetries) {
                    this.app.handleLoginFailure(error)
                    throw error
                }

                await this.delay(2000 * this.retryCount)
            }
        }
    }

    async silentLogin() {
        if (this.silentLoginPromise) {
            return await this.silentLoginPromise
        }

        this.silentLoginPromise = this.loginOnce({
            notifyApp: false,
            showLoading: false,
            clearTokens: true
        })

        try {
            return await this.silentLoginPromise
        } finally {
            this.silentLoginPromise = null
        }
    }

    async loginOnce({ notifyApp, showLoading, loadingTitle, clearTokens }) {
        if (clearTokens) {
            storage.clearTokens()
        }

        const code = await this.getWxLoginCode()
        const requestOptions = showLoading === false ? { showLoading: false } : { loadingTitle: loadingTitle || '登录中...' }
        const response = await api.user.wxLogin({ code }, requestOptions)

        return this.applyLoginResult(response, notifyApp)
    }

    applyLoginResult(response, notifyApp) {
        if (!response || !response.token || !response.user) {
            throw new Error('登录响应无效')
        }

        const stored = this.storeAuthData({
            token: response.token,
            refreshToken: response.refreshToken,
            user: response.user,
            profileStatus: response.profile_status,
            needBindPhone: response.need_bind_phone,
            session: {
                openid: response.openid,
                sessionKey: response.session_key
            }
        })

        if (notifyApp) {
            this.app.handleLoginSuccess(stored)
        }

        return {
            success: true,
            token: response.token,
            refreshToken: response.refreshToken,
            ...stored
        }
    }

    async getWxLoginCode() {
        return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => {
                    if (res.code) {
                        resolve(res.code)
                    } else {
                        reject(new Error(res.errMsg || '获取code失败'))
                    }
                },
                fail: (err) => {
                    reject(new Error(err.errMsg || 'wx.login失败'))
                }
            })
        })
    }

    async handleTokenExpired() {
        if (this.isRefreshing) {
            return
        }

        this.isRefreshing = true

        try {
            this.clearAuthData()
            await this.startWxLogin()
        } catch (error) {
            this.app.handleLoginFailure(error)
        } finally {
            this.isRefreshing = false
        }
    }

    async logout() {
        this.clearAuthData()
        this.silentLoginPromise = null
        this.app.handleLogout()
    }

    storeAuthData({ token, refreshToken, user, profileStatus, needBindPhone, session }) {
        if (token || refreshToken) {
            storage.setTokens({ token, refreshToken })
        }

        const normalizedUser = user ? this.persistUser(user) : storage.getUserInfo()
        const normalizedProfileStatus = this.normalizeProfileStatus(profileStatus, normalizedUser)
        const bindPhoneFlag = this.normalizeNeedBindFlag(needBindPhone, normalizedProfileStatus)

        storage.setProfileStatus(normalizedProfileStatus)
        storage.setNeedBindPhone(bindPhoneFlag)

        if (session && (session.openid || session.sessionKey)) {
            storage.setWeixinSession(session)
        }

        return {
            user: normalizedUser,
            profileStatus: normalizedProfileStatus,
            needBindPhone: bindPhoneFlag,
            session: session || storage.getWeixinSession()
        }
    }

    persistUser(user) {
        const normalizedUser = this.normalizeUser(user)
        storage.setUserInfo(normalizedUser)

        if (normalizedUser.avatarUrl) {
            storage.setUserAvatar(normalizedUser.avatarUrl)
        } else if (normalizedUser.avatar) {
            storage.setUserAvatar(normalizedUser.avatar)
        }

        return normalizedUser
    }

    clearAuthData() {
        storage.clearUserData()
    }

    normalizeUser(user) {
        if (!user) {
            return {}
        }

        const normalized = { ...user }
        const displayName = normalized.nickName || normalized.nickname || normalized.wx_nickname || ''

        if (!normalized.nickName && displayName) {
            normalized.nickName = displayName
        }

        if (!normalized.wx_nickname && displayName) {
            normalized.wx_nickname = displayName
        }

        const avatarUrl = normalized.avatarUrl || normalized.avatar || ''
        if (avatarUrl) {
            normalized.avatarUrl = avatarUrl
        }

        return normalized
    }

    normalizeProfileStatus(profileStatus, user) {
        const status = profileStatus || {}
        const hasNickname = status.hasNickname ?? status.has_nickname ?? !!(user && (user.nickName || user.nickname || user.wx_nickname))
        const hasAvatar = status.hasAvatar ?? status.has_avatar ?? !!(user && (user.avatarUrl || user.avatar))
        const hasMobile = status.hasMobile ?? status.has_mobile ?? !!(user && user.mobile)

        return {
            hasNickname: !!hasNickname,
            hasAvatar: !!hasAvatar,
            hasMobile: !!hasMobile
        }
    }

    normalizeNeedBindFlag(rawFlag, profileStatus) {
        if (typeof rawFlag === 'boolean') {
            return rawFlag
        }

        if (rawFlag === 1 || rawFlag === '1') {
            return true
        }

        if (rawFlag === 0 || rawFlag === '0') {
            return false
        }

        return profileStatus ? !profileStatus.hasMobile : false
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    getAuthState() {
        const tokens = storage.getTokens()
        return {
            hasToken: storage.hasToken(),
            isRefreshing: this.isRefreshing,
            userInfo: storage.getUserInfo(),
            tokens: {
                hasAccessToken: !!tokens.token,
                hasRefreshToken: !!tokens.refreshToken
            },
            profileStatus: storage.getProfileStatus(),
            needBindPhone: storage.getNeedBindPhone(),
            session: storage.getWeixinSession()
        }
    }

    debug() {
        storage.debug()
    }
}

const authManager = new AuthManager()

export default authManager
