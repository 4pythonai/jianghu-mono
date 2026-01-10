import api from '../api/index'
import storage from './storage'
import { getProfileChecker } from './profile-checker'

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
            // 尝试静默登录刷新token
            console.log('🔄 Token过期，尝试静默刷新')
            await this.silentLogin()
            console.log('✅ 静默刷新成功')
        } catch (error) {
            console.error('❌ 静默刷新失败，需要重新登录', error)
            storage.clearUserData()
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

    computeProfileStatus(user) {
        // 使用 ProfileChecker 的 isDefaultAvatar 方法
        const profileChecker = getProfileChecker() || this.app.profileChecker
        const isDefaultAvatar = profileChecker?.isDefaultAvatar?.bind(profileChecker)

        // 如果 profileChecker 未初始化，保守处理：认为默认头像就是没有头像
        const hasAvatar = isDefaultAvatar
            ? !!(user?.avatar && !isDefaultAvatar(user?.avatar))
            : false

        // user 已通过 normalizeUserInfo 标准化，使用 nickname
        return {
            hasNickname: !!(user?.nickname),
            hasAvatar: hasAvatar,
            hasMobile: !!(user?.mobile)
        }
    }



    storeAuthData({ token, user, profileStatus, needBindPhone, session }) {
        if (token) {
            storage.setToken(token)
        }

        if (user) {
            const normalized = this.app.normalizeUserInfo?.(user) || user
            storage.setUserInfo(normalized)
            user = normalized
        } else {
            user = storage.getUserInfo()
        }

        const status = this.computeProfileStatus(user)

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
