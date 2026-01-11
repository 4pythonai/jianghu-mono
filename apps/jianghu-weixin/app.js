// 导入 API 模块
import api from './api/index'
// 导入认证管理器
import authManager from './utils/auth'
// 导入HTTP客户端
import { httpClient } from './api/request-simple'
// 导入存储管理器
import storage from './utils/storage'
// 导入资料检查工具
import { createProfileChecker } from './utils/profile-checker'

// 全局分享配置 - 在所有页面上启用分享功能
const originalPage = Page
Page = (options) => {
    // 如果页面没有定义 onShareAppMessage，则添加默认的分享配置
    if (!options.onShareAppMessage) {
        options.onShareAppMessage = function () {
            const pages = getCurrentPages()
            const currentPage = pages[pages.length - 1]
            const route = currentPage.route
            const pageOptions = currentPage.options

            // 构建分享路径（包含当前页面参数）
            const params = Object.keys(pageOptions)
                .map(key => `${key}=${pageOptions[key]}`)
                .join('&')
            const path = params ? `/${route}?${params}` : `/${route}`

            return {
                title: '高尔夫江湖小程序',
                path: path,
                imageUrl: '' // 使用默认截图
            }
        }
    }
    originalPage(options)
}

App({
    api: api,
    auth: authManager, // 暴露认证管理器
    http: httpClient,  // 暴露HTTP客户端
    storage: storage,  // 暴露存储管理器
    profileChecker: null, // 暴露资料检查器，稍后初始化
    globalData: {
        userInfo: null,
        profileStatus: null,
        needBindPhone: false,
        systemInfo: null,
        isLoggedIn: false,    // 登录状态
        isInitialized: false, // 初始化状态
        _events: {},          // 事件系统存储
        pendingMineEntrySource: null
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

        // 初始化资料检查器
        this.profileChecker = createProfileChecker(this)
        console.log('✅ 资料检查器初始化完成')
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

            // 初始化 globalSystemInfo 用于自定义导航栏组件
            this.initNavBarSystemInfo()
        } catch (error) {
            console.error('❌ 获取系统信息失败:', error)
            // 降级处理:如果新 API 不可用, 尝试使用旧 API
            this.fallbackGetSystemInfo()
        }
    },

    /**
     * 判断是否是 iOS 系统
     */
    _isIOS(systemInfo) {
        return !!(systemInfo.system.toLowerCase().search('ios') + 1)
    },

    /**
     * 获取胶囊按钮位置，失败时返回默认值
     */
    _getCapsuleRect(systemInfo, isIOS) {
        try {
            const rect = wx.getMenuButtonBoundingClientRect?.() || null
            if (rect && rect.width && rect.top && rect.left && rect.height) {
                return rect
            }
            throw new Error('invalid rect')
        } catch {
            return this._getDefaultCapsuleRect(systemInfo, isIOS)
        }
    },

    /**
     * 获取默认胶囊按钮位置（各平台兜底值）
     */
    _getDefaultCapsuleRect(systemInfo, isIOS) {
        let gap, width = 96

        if (systemInfo.platform === 'android') {
            gap = 8
        } else if (systemInfo.platform === 'devtools') {
            gap = isIOS ? 5.5 : 7.5
        } else {
            gap = 4
            width = 88
        }

        const statusBarHeight = systemInfo.statusBarHeight ||
            (systemInfo.screenHeight - systemInfo.windowHeight - 20)

        return {
            bottom: statusBarHeight + gap + 32,
            height: 32,
            left: systemInfo.windowWidth - width - 10,
            right: systemInfo.windowWidth - 10,
            top: statusBarHeight + gap,
            width: width
        }
    },

    /**
     * 计算导航栏高度和扩展高度
     */
    _calcNavBarLayout(systemInfo, rect, isIOS) {
        const gap = rect.top - (systemInfo.statusBarHeight || 0)

        if (!systemInfo.statusBarHeight) {
            return {
                navBarHeight: 2 * gap + rect.height,
                statusBarHeight: 0,
                navBarExtendHeight: 0
            }
        }

        return {
            navBarHeight: systemInfo.statusBarHeight + 2 * gap + rect.height,
            statusBarHeight: systemInfo.statusBarHeight,
            navBarExtendHeight: isIOS ? 4 : 0
        }
    },

    /**
     * 初始化导航栏所需的系统信息
     * 用于自定义导航栏组件（navBar）
     */
    initNavBarSystemInfo() {
        try {
            const { getSystemInfo } = require('./utils/systemInfo')
            const systemInfo = getSystemInfo()
            const isIOS = this._isIOS(systemInfo)
            const rect = this._getCapsuleRect(systemInfo, isIOS)
            const layout = this._calcNavBarLayout(systemInfo, rect, isIOS)

            this.globalSystemInfo = {
                ...systemInfo,
                ...layout,
                capsulePosition: rect,
                ios: isIOS
            }

            console.log('📱 导航栏系统信息初始化成功:', {
                statusBarHeight: layout.statusBarHeight,
                navBarHeight: layout.navBarHeight,
                capsulePosition: rect,
                ios: isIOS
            })
        } catch (error) {
            console.error('❌ 导航栏系统信息初始化失败:', error)
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
                // 初始化导航栏系统信息
                this.initNavBarSystemInfo()
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
    setAuthState(isLoggedIn, userInfo = null, options = {}) {
        this.globalData.isLoggedIn = isLoggedIn
        this.globalData.isInitialized = true

        const profileStatus = options.profileStatus || this.globalData.profileStatus || this.storage.getProfileStatus()
        const needBindPhone = options.needBindPhone

        if (isLoggedIn && userInfo) {
            this.setUserInfo(userInfo, profileStatus, needBindPhone)
        } else if (!isLoggedIn) {
            this.clearUserInfo()
            this.globalData.profileStatus = null
            this.globalData.needBindPhone = false
            this.storage.clearProfileStatus()
            this.storage.clearNeedBindPhone()
        }

        // 发出状态变化事件
        this.emit('authStateChanged', {
            isLoggedIn,
            userInfo: this.globalData.userInfo,
            profileStatus: this.globalData.profileStatus,
            needBindPhone: this.globalData.needBindPhone
        })

        console.log('🔄 认证状态更新:', {
            isLoggedIn,
            hasUserInfo: !!this.globalData.userInfo
        })
    },

    /**
     * 设置用户信息
     */
    setUserInfo(userInfo, profileStatus = null, needBindPhone = undefined) {
        const normalized = this.normalizeUserInfo(userInfo)
        this.globalData.userInfo = normalized

        if (profileStatus) {
            this.globalData.profileStatus = profileStatus
            this.storage.setProfileStatus(profileStatus)
        } else if (!this.globalData.profileStatus) {
            this.globalData.profileStatus = this.storage.getProfileStatus()
        }

        this.storage.setUserInfo(normalized)

        this.updatePhoneBinding(this.globalData.profileStatus, normalized, needBindPhone)
        this.emit('userInfoChanged', {
            user: normalized,
            profileStatus: this.globalData.profileStatus,
            needBindPhone: this.globalData.needBindPhone
        })
    },

    /**
     * 清除用户信息
     */
    clearUserInfo() {
        this.globalData.userInfo = null
        this.globalData.needBindPhone = false
        this.globalData.profileStatus = null
        this.emit('userInfoCleared')
    },

    /**
     * 检查手机号绑定状态
     */
    updatePhoneBinding(profileStatus, userInfo, explicitFlag) {
        const previous = this.globalData.needBindPhone
        let needBind = typeof explicitFlag === 'boolean' ? explicitFlag : null

        if (needBind === null) {
            if (profileStatus) {
                needBind = !profileStatus.hasMobile
            } else {
                needBind = !userInfo?.mobile
            }
        }

        this.globalData.needBindPhone = !!needBind

        if (this.globalData.needBindPhone) {
            this.storage.setNeedBindPhone(true)
            if (!previous) {
                this.emit('needBindPhone')
            }
            console.log('📱 需要绑定手机号')
        } else {
            this.storage.setNeedBindPhone(false)
            console.log('✅ 手机号已绑定')
        }
    },

    /**
     * 处理登录成功
     * 由Auth层调用
     */
    handleLoginSuccess(payload) {
        const { user, profileStatus, needBindPhone } = this.resolveAuthPayload(payload)
        console.log('✅ 登录成功处理:', user)
        this.setAuthState(true, user, { profileStatus, needBindPhone })
        this.emit('loginSuccess', {
            user: this.globalData.userInfo,
            profileStatus: this.globalData.profileStatus,
            needBindPhone: this.globalData.needBindPhone
        })
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
            profileStatus: this.globalData.profileStatus,
            needBindPhone: this.globalData.needBindPhone
        }
    },

    resolveAuthPayload(payload) {
        if (!payload || typeof payload !== 'object') {
            return {
                user: payload || {},
                profileStatus: null,
                needBindPhone: undefined
            }
        }

        // 后端 Weixin/login, Weixin/getUserProfile, Weixin/bindPhoneNumber 返回的字段:
        // - user: 用户信息对象
        // - profile_status: 用户资料状态对象
        // - need_bind_phone: 是否需要绑定手机
        const user = payload.user || payload || {}
        const profileStatus = payload.profile_status || null
        const needBindPhone = payload.need_bind_phone

        return {
            user,
            profileStatus,
            needBindPhone
        }
    },

    normalizeUserInfo(userInfo) {
        // 标准化用户信息，确保字段名与数据库一致
        // 后端 MUser.getUserbyId 返回的 t_user 表字段:
        // - id: 用户ID
        // - nickname: 昵称
        // - avatar: 头像URL
        // - gender: 性别 ('male'/'female'/'unknown')
        // - mobile: 手机号
        const user = userInfo ? { ...userInfo } : {}

        // 确保 nickname 存在
        // 注意: 微信 wx.getUserProfile API 返回 nickName (驼峰)，需要转换
        if (!user.nickname) {
            user.nickname = user.nickName || ''
        }

        // 统一性别字段: 'male', 'female', 'unknown'
        if (!user.gender || (user.gender !== 'male' && user.gender !== 'female')) {
            user.gender = 'unknown'
        }

        // 统一头像字段: 微信 API 返回 avatarUrl，后端使用 avatar
        if (!user.avatar && user.avatarUrl) {
            user.avatar = user.avatarUrl
        }

        return user
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
