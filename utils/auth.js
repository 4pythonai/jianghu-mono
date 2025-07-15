import api from '../api/index'
import storage from './storage'

/**
 * 认证管理器
 * 职责:微信登录、token验证、登录状态管理、静默重新登录
 */
class AuthManager {
    constructor() {
        this.app = null
        this.isRefreshing = false
        this.retryCount = 0
        this.maxRetries = 3
        this.silentLoginPromise = null // 静默登录的Promise，避免重复调用
    }

    /**
     * 初始化认证管理器
     * @param {Object} app - App实例
     */
    initialize(app) {
        this.app = app
        console.log('🔐 认证管理器初始化')

        // 数据迁移检查
        storage.migrate()

        // 监听HTTP层的认证失败事件
        this.setupEventListeners()

        // 开始认证检查
        return this.checkAuthState()
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 监听app的认证检查事件
        this.app.on('authCheck', () => {
            this.checkAuthState()
        })

        // 监听HTTP层的token失效事件
        this.app.on('tokenExpired', () => {
            this.handleTokenExpired()
        })
    }

    /**
     * 检查认证状态
     */
    async checkAuthState() {
        try {
            console.log('🔍 检查认证状态')

            // 检查本地是否有token
            if (!storage.hasToken()) {
                console.log('❌ 本地无token，开始微信登录')
                return await this.startWxLogin()
            }

            // 验证token有效性
            console.log('✅ 本地有token，开始验证')
            return await this.verifyToken()

        } catch (error) {
            console.error('❌ 认证状态检查失败:', error)
            return await this.startWxLogin()
        }
    }

    /**
     * 验证token有效性
     */
    async verifyToken() {
        try {
            console.log('🔑 验证token有效性')

            // 调用需要认证的API来验证token - 禁用loading(静默验证)
            const response = await api.user.getUserInfo({}, {
                showLoading: false
            })

            if (response?.user) {
                console.log('✅ Token验证成功')

                // 更新存储的用户信息
                storage.setUserInfo(response.user)

                this.app.handleLoginSuccess(response.user)
                return { success: true, user: response.user }
            }

            throw new Error('获取用户信息失败')

        } catch (error) {
            console.log('❌ Token验证失败:', error.message)

            // 判断是否需要重新登录
            if (this.shouldRetryLogin(error)) {
                return await this.startWxLogin()
            }

            throw error
        }
    }

    /**
     * 静默登录(用于HTTP客户端的自动重试)
     */
    async silentLogin() {
        // 如果已经有静默登录在进行中，返回同一个Promise
        if (this.silentLoginPromise) {
            console.log('⏳ 静默登录已在进行中，等待完成')
            return await this.silentLoginPromise
        }

        // 创建新的静默登录Promise
        this.silentLoginPromise = this.performSilentLogin()

        try {
            const result = await this.silentLoginPromise
            return result
        } finally {
            // 清除Promise引用
            this.silentLoginPromise = null
        }
    }

    /**
     * 执行静默登录
     */
    async performSilentLogin() {
        try {
            console.log('🤫 开始静默登录流程')

            // 清除过期的token
            storage.clearTokens()

            // 获取微信登录code
            const code = await this.getWxLoginCode()

            // 调用后端登录接口 - 禁用loading(静默登录)
            const response = await api.user.wxLogin({ code }, {
                showLoading: false
            })

            if (response?.token) {
                console.log('✅ 静默登录成功')

                // 存储新的token和用户信息
                await this.storeAuthData(response)

                // 不通知app(静默登录)
                return { success: true, user: response }
            }

            throw new Error('静默登录响应无效')

        } catch (error) {
            console.error('❌ 静默登录失败:', error)
            throw error
        }
    }

    /**
     * 开始微信登录
     */
    async startWxLogin() {
        try {
            console.log('🚀 开始微信登录流程，重试次数:', this.retryCount)

            // 重置重试计数
            this.retryCount = 0

            // 获取微信登录code
            console.log('📱 获取微信登录code...')
            const code = await this.getWxLoginCode()
            console.log('✅ 获取微信code成功:', code)

            // 调用后端登录接口 - 使用自定义loading文案
            console.log('🌐 调用后端登录接口...')
            const response = await api.user.wxLogin({ code }, {
                loadingTitle: '登录中...'
            })
            console.log('📨 后端登录接口响应:', response)

            if (response?.token) {
                console.log('✅ 微信登录成功，token:', response.token?.substring(0, 10) + '...')

                // 存储token和用户信息
                await this.storeAuthData(response)

                // 通知app登录成功
                this.app.handleLoginSuccess(response)

                return { success: true, user: response }
            }

            console.error('❌ 登录响应无效，response:', response)
            throw new Error('登录响应无效')

        } catch (error) {
            console.error('❌ 微信登录失败:', error)

            // 重试机制
            if (this.retryCount < this.maxRetries) {
                this.retryCount++
                console.log(`🔄 登录重试 ${this.retryCount}/${this.maxRetries}`)

                // 延迟重试
                await this.delay(2000 * this.retryCount)
                return await this.startWxLogin()
            }

            // 重试次数耗尽，通知app登录失败
            console.error('❌ 登录重试次数耗尽，通知app登录失败')
            this.app.handleLoginFailure(error)
            throw error
        }
    }

    /**
     * 获取微信登录code
     */
    getWxLoginCode() {
        return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => {
                    if (res.code) {
                        console.log('✅ 获取微信code成功')
                        resolve(res.code)
                    } else {
                        console.error('❌ 获取code失败:', res.errMsg)
                        reject(new Error(`获取code失败: ${res.errMsg}`))
                    }
                },
                fail: (err) => {
                    console.error('❌ wx.login调用失败:', err)
                    reject(new Error(`wx.login失败: ${err.errMsg || err}`))
                }
            })
        })
    }

    /**
     * 处理token过期
     */
    async handleTokenExpired() {
        if (this.isRefreshing) {
            console.log('⏳ token刷新中，跳过重复处理')
            return
        }

        try {
            this.isRefreshing = true
            console.log('🔄 处理token过期，开始重新登录')

            // 清除过期的认证数据
            this.clearAuthData()

            // 重新登录
            await this.startWxLogin()

        } catch (error) {
            console.error('❌ 处理token过期失败:', error)
            this.app.handleLoginFailure(error)
        } finally {
            this.isRefreshing = false
        }
    }

    /**
     * 登出
     */
    async logout() {
        try {
            console.log('👋 开始登出流程')

            // 清除所有认证相关数据
            this.clearAuthData()

            // 清除静默登录Promise
            this.silentLoginPromise = null

            // 通知app登出
            this.app.handleLogout()

            console.log('✅ 登出成功')

        } catch (error) {
            console.error('❌ 登出失败:', error)
            throw error
        }
    }

    /**
     * 存储认证数据
     */
    async storeAuthData(response) {
        try {
            // 存储tokens
            const tokenResult = storage.setTokens({
                token: response.token,
                refreshToken: response.refreshToken
            })

            // 存储用户信息
            let userResult = true
            if (response.user || response.nickName) {
                userResult = storage.setUserInfo(response.user || response)
            }

            if (tokenResult && userResult) {
                // console.log('✅ 认证数据存储成功')
            } else {
                // console.warn('⚠️ 认证数据存储部分失败')
            }

        } catch (error) {
            console.error('❌ 存储认证数据失败:', error)
            throw error
        }
    }

    /**
     * 清除认证数据
     */
    clearAuthData() {
        const success = storage.clearUserData()
        if (success) {
            console.log('🗑️ 认证数据已清除')
        } else {
            console.warn('⚠️ 认证数据清除部分失败')
        }
        return success
    }

    /**
     * 判断是否应该重试登录
     */
    shouldRetryLogin(error) {
        // 如果是网络错误或401认证错误，需要重新登录
        return error.statusCode === 401 ||
            error.message?.includes('需要重新登录') ||
            error.message?.includes('token')
    }

    /**
     * 延迟工具函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * 获取当前认证状态
     */
    getAuthState() {
        const tokens = storage.getTokens()
        return {
            hasToken: storage.hasToken(),
            isRefreshing: this.isRefreshing,
            isSilentLogin: !!this.silentLoginPromise,
            userInfo: storage.getUserInfo(),
            tokens: {
                hasAccessToken: !!tokens.token,
                hasRefreshToken: !!tokens.refreshToken
            }
        }
    }

    /**
     * 调试信息
     */
    debug() {
        console.log('🔐 认证管理器状态:', this.getAuthState())
        storage.debug()
    }
}

// 创建单例实例
const authManager = new AuthManager()

export default authManager 