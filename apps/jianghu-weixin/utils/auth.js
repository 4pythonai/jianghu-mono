import api from '../api/index'
import storage from './storage'

/**
 * 判断是否是认证错误
 */
export function isAuthError(error) {
    return error.statusCode === 401 ||
        error.message?.includes('token') ||
        error.message?.includes('登录')
}

/**
 * 认证管理器
 */
class AuthManager {
    constructor() {
        this.app = null
        this.isRefreshing = false
        this.silentLoginPromise = null
    }

    initialize(app) {
        this.app = app
        storage.migrate()
        this.setupEventListeners()
        return this.checkAuthState()
    }

    setupEventListeners() {
        this.app.on('authCheck', () => this.checkAuthState())
        this.app.on('tokenExpired', () => this.handleTokenExpired())
    }

    async checkAuthState() {
        if (!storage.hasToken()) {
            return await this.login()
        }
        try {
            return await this.verifyToken()
        } catch (error) {
            return await this.login()
        }
    }

    async verifyToken() {
        const response = await api.user.getUserInfo({}, { showLoading: false })

        const stored = this.storeAuthData({
            user: response.user,
            profileStatus: response.profile_status,
            needBindPhone: response.need_bind_phone
        })

        this.app.handleLoginSuccess(stored)
        return { success: true, ...stored }
    }

    async login() {
        const code = await this.getWxLoginCode()
        const response = await api.user.wxLogin({ code }, { loadingTitle: '登录中...' })

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

        this.app.handleLoginSuccess(stored)
        return { success: true, token: response.token, ...stored }
    }

    async silentLogin() {
        if (this.silentLoginPromise) {
            return await this.silentLoginPromise
        }

        this.silentLoginPromise = (async () => {
            storage.clearTokens()
            const code = await this.getWxLoginCode()
            const response = await api.user.wxLogin({ code }, { showLoading: false })
            return this.storeAuthData({
                token: response.token,
                refreshToken: response.refreshToken,
                user: response.user,
                profileStatus: response.profile_status,
                needBindPhone: response.need_bind_phone
            })
        })()

        try {
            return await this.silentLoginPromise
        } finally {
            this.silentLoginPromise = null
        }
    }

    async getWxLoginCode() {
        return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => res.code ? resolve(res.code) : reject(new Error('获取code失败')),
                fail: (err) => reject(new Error(err.errMsg || 'wx.login失败'))
            })
        })
    }

    async handleTokenExpired() {
        if (this.isRefreshing) return

        this.isRefreshing = true
        try {
            storage.clearUserData()
            await this.login()
        } catch (error) {
            this.app.handleLoginFailure(error)
        } finally {
            this.isRefreshing = false
        }
    }

    async logout() {
        storage.clearUserData()
        this.silentLoginPromise = null
        this.app.handleLogout()
    }

    storeAuthData({ token, refreshToken, user, profileStatus, needBindPhone, session }) {
        if (token || refreshToken) {
            storage.setTokens({ token, refreshToken })
        }

        if (user) {
            const normalized = this.app.normalizeUserInfo?.(user) || user
            storage.setUserInfo(normalized)
            user = normalized
        } else {
            user = storage.getUserInfo()
        }

        const status = {
            hasNickname: !!(user?.nickName || user?.nickname),
            hasAvatar: !!(user?.avatarUrl || user?.avatar),
            hasMobile: !!(user?.mobile)
        }

        const needBind = typeof needBindPhone === 'boolean' ? needBindPhone : !status.hasMobile

        storage.setProfileStatus(status)
        storage.setNeedBindPhone(needBind)

        if (session?.openid || session?.sessionKey) {
            storage.setWeixinSession(session)
        }

        return {
            user,
            profileStatus: status,
            needBindPhone: needBind,
            session: session || storage.getWeixinSession()
        }
    }
}

const authManager = new AuthManager()

export default authManager
