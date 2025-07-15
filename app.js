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

        // wx.loadFontFace({
        //     family: 'DouyinSansBold',
        //     source: 'url("https://web.golf-brother.com/DouyinSansBold.otf")',
        //     success: console.log
        // })

        // 获取系统信息
        this.initSystemInfo()

        // 初始化网络和认证
        this.initNetworkAndAuth()
    },

    /**
     * 初始化系统信息 - 使用新的 API
     */
    initSystemInfo() {
        try {
            // 使用新的 API 获取系统信息
            const deviceInfo = wx.getDeviceInfo()
            const windowInfo = wx.getWindowInfo()
            const appBaseInfo = wx.getAppBaseInfo()

            // 合并系统信息, 保持与旧 API 的兼容性
            this.globalData.systemInfo = {
                ...deviceInfo,
                ...windowInfo,
                ...appBaseInfo,
                // 添加一些常用的计算属性
                screenWidth: windowInfo.screenWidth,
                screenHeight: windowInfo.screenHeight,
                windowWidth: windowInfo.windowWidth,
                windowHeight: windowInfo.windowHeight,
                pixelRatio: windowInfo.pixelRatio,
                platform: deviceInfo.platform,
                system: deviceInfo.system,
                version: appBaseInfo.version,
                SDKVersion: appBaseInfo.SDKVersion
            }

            console.log('📱 系统信息获取成功:', this.globalData.systemInfo)
        } catch (error) {
            console.error('❌ 获取系统信息失败:', error)
            // 降级处理:如果新 API 不可用, 尝试使用旧 API
            this.fallbackGetSystemInfo()
        }
    },

    /**
     * 降级处理:使用旧的系统信息 API
     */
    fallbackGetSystemInfo() {
        wx.getSystemInfo({
            success: (res) => {
                this.globalData.systemInfo = res
                console.log('📱 系统信息获取成功(降级模式)')
            },
            fail: (err) => {
                console.error('❌ 获取系统信息失败(降级模式):', err)
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

            // 连接HTTP客户端到认证管理器
            httpClient.setAuthManager(authManager)

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
        // 应用切换到前台时, 可以检查认证状态
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
    },

    /**
     * 全局调试方法 - 可在控制台直接调用
     */

    // 检查loading状态
    checkLoading() {
        console.log('🔍 检查loading状态')
        if (!this.http) {
            console.error('❌ HTTP客户端未初始化')
            return null
        }

        const status = this.http.getLoadingStatus()
        console.log('📊 Loading状态:', status)

        // 检查是否有异常状态
        if (status.isLoading && status.loadingCount === 0) {
            console.warn('⚠️ 异常:isLoading为true但loadingCount为0')
        }

        if (status.hasShowTimer && status.hasHideTimer) {
            console.warn('⚠️ 异常:同时存在显示和隐藏定时器')
        }

        return status
    },

    // 强制隐藏loading
    fixLoading() {
        console.log('🚨 强制修复loading')

        // 方法1:通过HttpClient
        if (this.http) {
            console.log('1️⃣ 通过HttpClient清理')
        }

        // 方法2:直接调用微信API
        console.log('2️⃣ 直接调用wx.hideLoading')
        try {
            wx.hideLoading()
        } catch (error) {
            console.error('❌ wx.hideLoading失败:', error)
        }

        // 方法3:多次调用确保清理
        console.log('3️⃣ 延迟再次清理')
        setTimeout(() => {
            try {
                wx.hideLoading()
                console.log('✅ 延迟清理完成')
            } catch (error) {
                console.error('❌ 延迟清理失败:', error)
            }
        }, 100)

        console.log('✅ Loading修复完成')
    },

    // 全面诊断loading问题
    diagnoseLoading() {
        console.log('🔬 开始全面诊断loading问题')

        // 1. 检查HttpClient状态
        console.log('1️⃣ 检查HttpClient状态')
        if (this.http) {
            const status = this.http.getLoadingStatus()
            console.log('HttpClient状态:', status)

            // 检查内部变量
            console.log('内部变量:', {
                loadingCount: this.http.loadingCount,
                loadingTimer: !!this.http.loadingTimer,
                loadingHideTimer: !!this.http.loadingHideTimer,
                loadingStartTime: this.http.loadingStartTime,
                isRefreshing: this.http.isRefreshing
            })
        }

        // 2. 检查当前页面
        console.log('2️⃣ 检查当前页面')
        const pages = getCurrentPages()
        if (pages.length > 0) {
            const currentPage = pages[pages.length - 1]
            console.log('当前页面:', currentPage.route)

            // 检查页面data中的loading状态
            if (currentPage.data && typeof currentPage.data.loading !== 'undefined') {
                console.log('页面loading状态:', currentPage.data.loading)
            }
        }

        // 3. 尝试修复
        console.log('3️⃣ 尝试修复')
        this.fixLoading()

        // 4. 再次检查
        setTimeout(() => {
            console.log('4️⃣ 修复后状态检查')
            this.checkLoading()
        }, 200)
    }
})