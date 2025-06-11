// 导入 API 模块
import api from './api/index'
// 导入认证管理器
import authManager from './utils/auth'
// 导入HTTP客户端
import { httpClient } from './api/request-simple'
// 导入存储管理器
import storage from './utils/storage'

App({
    api: api,
    auth: authManager, // 暴露认证管理器
    http: httpClient,  // 暴露HTTP客户端
    storage: storage,  // 暴露存储管理器
    globalData: {
        userInfo: null,
        needBindPhone: false,
        systemInfo: null,
        isLoggedIn: false,    // 登录状态
        isInitialized: false, // 初始化状态
        _events: {}           // 事件系统存储
    },

    /**
     * 事件系统 - 用于组件间通信
     */
    on(eventName, callback) {
        if (!this.globalData._events[eventName]) {
            this.globalData._events[eventName] = []
        }
        this.globalData._events[eventName].push(callback)
    },

    off(eventName, callback) {
        const callbacks = this.globalData._events[eventName]
        if (callbacks) {
            this.globalData._events[eventName] = callbacks.filter(cb => cb !== callback)
        }
    },

    emit(eventName, ...args) {
        const callbacks = this.globalData._events[eventName]
        if (callbacks) {
            for (const cb of callbacks) {
                cb(...args)
            }
        }
    },

    /**
     * 应用启动
     */
    onLaunch() {
        console.log('🚀 应用启动')
        // 获取系统信息
        this.initSystemInfo()

        // 初始化网络和认证
        this.initNetworkAndAuth()
    },

    /**
     * 初始化系统信息
     */
    initSystemInfo() {
        wx.getSystemInfo({
            success: (res) => {
                this.globalData.systemInfo = res
                console.log('📱 系统信息获取成功')
            },
            fail: (err) => {
                console.error('❌ 获取系统信息失败:', err)
            }
        })
    },

    /**
     * 初始化网络和认证
     */
    async initNetworkAndAuth() {
        try {
            console.log('🔐 开始初始化网络和认证')

            // 连接HTTP客户端到App
            httpClient.setApp(this)

            // 初始化认证管理器
            await authManager.initialize(this)

        } catch (error) {
            console.error('❌ 网络和认证初始化失败:', error)
            this.setAuthState(false)
        }
    },

    /**
     * 设置认证状态
     */
    setAuthState(isLoggedIn, userInfo = null) {
        this.globalData.isLoggedIn = isLoggedIn
        this.globalData.isInitialized = true

        if (isLoggedIn && userInfo) {
            this.setUserInfo(userInfo)
        } else if (!isLoggedIn) {
            this.clearUserInfo()
        }

        // 发出状态变化事件
        this.emit('authStateChanged', {
            isLoggedIn,
            userInfo: this.globalData.userInfo
        })

        console.log('🔄 认证状态更新:', {
            isLoggedIn,
            hasUserInfo: !!userInfo
        })
    },

    /**
     * 设置用户信息
     */
    setUserInfo(userInfo) {
        this.globalData.userInfo = userInfo
        this.checkPhoneBinding(userInfo)
        this.emit('userInfoChanged', userInfo)
    },

    /**
     * 清除用户信息
     */
    clearUserInfo() {
        this.globalData.userInfo = null
        this.globalData.needBindPhone = false
        this.emit('userInfoCleared')
    },

    /**
     * 检查手机号绑定状态
     */
    checkPhoneBinding(userInfo) {
        if (!userInfo?.mobile) {
            this.globalData.needBindPhone = true
            this.emit('needBindPhone')
            console.log('📱 需要绑定手机号')
        } else {
            this.globalData.needBindPhone = false
            console.log('✅ 手机号已绑定')
        }
    },

    /**
     * 处理登录成功
     * 由Auth层调用
     */
    handleLoginSuccess(userInfo) {
        console.log('✅ 登录成功处理:', userInfo)
        this.setAuthState(true, userInfo)
        this.emit('loginSuccess', userInfo)
    },

    /**
     * 处理登录失败
     * 由Auth层调用
     */
    handleLoginFailure(error) {
        console.error('❌ 登录失败处理:', error)
        this.setAuthState(false)
        this.emit('loginFailure', error)
    },

    /**
     * 处理登出
     */
    handleLogout() {
        console.log('👋 用户登出')
        this.setAuthState(false)
        this.emit('logout')
    },

    /**
     * 获取用户状态
     */
    getUserState() {
        return {
            isLoggedIn: this.globalData.isLoggedIn,
            isInitialized: this.globalData.isInitialized,
            userInfo: this.globalData.userInfo,
            needBindPhone: this.globalData.needBindPhone
        }
    },

    /**
     * 应用显示
     */
    onShow() {
        console.log('👁️ 应用显示')
        // 应用切换到前台时，可以检查认证状态
        if (this.globalData.isInitialized) {
            this.emit('appShow')
        }
    },

    /**
     * 应用隐藏
     */
    onHide() {
        console.log('🙈 应用隐藏')
        this.emit('appHide')
    },

    /**
     * 应用错误处理
     */
    onError(error) {
        console.error('💥 应用错误:', error)
        this.emit('appError', error)
    }
})