import { config, ErrorCode } from './config'
import storage from '../utils/storage'

/**
 * HTTP请求封装
 * 职责：网络请求、自动添加token、处理401响应、通知认证层、自动重试、统一loading管理
 * 
 * Loading功能特性：
 * 1. 自动loading管理 - 默认所有请求都显示loading
 * 2. 智能防闪烁 - 延迟显示和最小显示时间
 * 3. 并发请求支持 - 多个请求共享一个loading状态
 * 4. 灵活配置 - 支持自定义loading文案、遮罩等
 * 
 * 使用方式：
 * 
 * // 默认使用（自动显示loading）
 * await app.api.user.createAndSelect(userData)
 * 
 * // 自定义loading文案
 * await app.api.user.createAndSelect(userData, { 
 *     loadingTitle: '正在创建用户...' 
 * })
 * 
 * // 禁用loading
 * await app.api.user.getUserInfo({}, { 
 *     showLoading: false 
 * })
 * 
 * // 自定义loading配置
 * await app.api.course.searchCourse(data, {
 *     loadingTitle: '搜索中...',
 *     loadingMask: false
 * })
 * 
 * // 全局配置loading行为
 * app.http.setLoadingConfig({
 *     delay: 500,           // 延迟显示时间
 *     minDuration: 800,     // 最小显示时间
 *     defaultTitle: '请稍候...'
 * })
 */
class HttpClient {
    constructor(baseURL = config.baseURL) {
        this.baseURL = baseURL
        this.timeout = config.timeout
        this.header = config.header
        this.app = null // App实例，用于事件通信
        this.authManager = null // 认证管理器实例
        this.isRefreshing = false // 是否正在刷新token
        this.failedQueue = [] // 失败请求队列

        // Loading管理相关
        this.loadingCount = 0 // 当前loading请求数量
        this.loadingTimer = null // loading延迟显示定时器
        this.loadingHideTimer = null // loading延迟隐藏定时器
        this.loadingConfig = {
            delay: 300, // loading显示延迟时间(ms)，避免快速请求的闪烁
            minDuration: 200, // loading最小显示时间(ms)，避免闪烁（从500ms减少到200ms）
            defaultTitle: 'Loading...',
            defaultMask: true
        }
    }

    /**
     * 设置App实例，用于事件通信
     */
    setApp(app) {
        this.app = app
        console.log('🌐 HTTP客户端已连接到App')
    }

    /**
     * 设置认证管理器实例
     */
    setAuthManager(authManager) {
        this.authManager = authManager
        console.log('🔐 HTTP客户端已连接到认证管理器')
    }

    /**
     * Loading管理 - 显示loading
     * @param {object} options - loading配置选项
     */
    showLoading(options = {}) {
        const config = {
            title: options.title || this.loadingConfig.defaultTitle,
            mask: options.mask !== undefined ? options.mask : this.loadingConfig.defaultMask
        }

        // 增加loading计数
        this.loadingCount++


        // 如果是第一个请求，显示loading
        if (this.loadingCount === 1) {
            // 清除之前的定时器
            if (this.loadingTimer) {
                clearTimeout(this.loadingTimer)
                this.loadingTimer = null
            }

            // 延迟显示loading，避免快速请求的闪烁
            this.loadingTimer = setTimeout(() => {
                wx.showLoading(config)
                this.loadingStartTime = Date.now()
                console.log('📱 系统Loading已显示')
            }, this.loadingConfig.delay)
        }
    }

    /**
     * Loading管理 - 隐藏loading
     */
    hideLoading() {
        // 减少loading计数
        this.loadingCount = Math.max(0, this.loadingCount - 1)

        // console.log('✅ 隐藏Loading:', {
        //     count: this.loadingCount,
        //     timestamp: new Date().toISOString()
        // })

        // 如果没有pending的请求了，隐藏loading
        if (this.loadingCount === 0) {
            // 检查是否有延迟显示的定时器
            if (this.loadingTimer) {
                clearTimeout(this.loadingTimer)
                this.loadingTimer = null
                // console.log('⏹️ 取消Loading显示（请求太快）')
                // 注意：这里不return，因为loading可能已经显示了
            }

            // 检查loading是否已经显示
            if (this.loadingStartTime) {
                // loading已经显示，需要隐藏
                const showDuration = Date.now() - this.loadingStartTime
                const remainingTime = Math.max(0, this.loadingConfig.minDuration - showDuration)

                if (remainingTime > 0) {
                    // console.log(`⏱️ Loading最小显示时间未到，延迟${remainingTime}ms隐藏`)

                    // 清除之前的隐藏定时器（如果存在）
                    if (this.loadingHideTimer) {
                        clearTimeout(this.loadingHideTimer)
                        this.loadingHideTimer = null
                    }

                    const hideTimer = setTimeout(() => {
                        // 简化条件检查：只要loadingCount为0就隐藏
                        if (this.loadingCount === 0) {
                            wx.hideLoading()
                            // console.log('📱 系统Loading已隐藏（延迟）')
                            this.loadingStartTime = null
                        } else {
                            // console.log('⚠️ 延迟隐藏时发现有新请求，保持loading显示')
                        }
                        // 清理定时器引用
                        this.loadingHideTimer = null
                    }, remainingTime)

                    // 保存定时器引用，以便在forceHideLoading时清理
                    this.loadingHideTimer = hideTimer
                } else {
                    // 立即隐藏loading
                    wx.hideLoading()
                    // console.log('📱 系统Loading已隐藏')
                    this.loadingStartTime = null
                }
            } else {
                // loading从未显示过，无需隐藏
                // console.log('📱 Loading从未显示，无需隐藏')
            }
        }
    }



    /**
     * 配置loading行为
     * @param {object} config - loading配置
     */
    setLoadingConfig(config = {}) {
        this.loadingConfig = {
            ...this.loadingConfig,
            ...config
        }
        // console.log('⚙️ Loading配置已更新:', this.loadingConfig)
    }

    /**
     * 获取当前loading状态
     */
    getLoadingStatus() {
        return {
            isLoading: this.loadingCount > 0,
            loadingCount: this.loadingCount,
            hasShowTimer: !!this.loadingTimer,
            hasHideTimer: !!this.loadingHideTimer,
            loadingStartTime: this.loadingStartTime
        }
    }

    /**
     * 发送请求
     * @param {string} url - 请求地址
     * @param {object} data - 请求数据
     * @param {object} options - 其他选项
     */
    async request(url, data = {}, options = {}) {
        // 解析loading配置
        const loadingOptions = {
            showLoading: options.showLoading !== false, // 默认显示loading
            loadingTitle: options.loadingTitle || this.loadingConfig.defaultTitle,
            loadingMask: options.loadingMask !== undefined ? options.loadingMask : this.loadingConfig.defaultMask
        }

        // 构建请求配置
        const requestConfig = this.buildRequestConfig(url, data, options)

        // 记录请求日志
        this.logRequest(requestConfig, loadingOptions)

        // 显示loading
        if (loadingOptions.showLoading) {
            this.showLoading({
                title: loadingOptions.loadingTitle,
                mask: loadingOptions.loadingMask
            })
        }

        try {
            // 发送请求
            const response = await this.wxRequest(requestConfig)

            // 处理响应
            return this.handleResponse(response, requestConfig)

        } catch (error) {
            // 处理错误
            return this.handleError(error, requestConfig)
        } finally {
            // 隐藏loading
            if (loadingOptions.showLoading) {
                // console.log('🔍 request finally块 - 准备隐藏loading, 当前状态:', this.getLoadingStatus())
                this.hideLoading()
                // console.log('🔍 request finally块 - 隐藏loading后状态:', this.getLoadingStatus())
            }
        }
    }

    /**
     * 构建请求配置
     */
    buildRequestConfig(url, data, options) {
        // 使用Storage层获取token
        const token = storage.getToken()
        const header = {
            ...this.header,
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.header
        }

        return {
            url: `${this.baseURL}${url}`,
            method: options.method || 'POST',
            data,
            header,
            timeout: options.timeout || this.timeout,
            // 保存原始请求信息，用于重试
            _originalUrl: url,
            _originalData: data,
            _originalOptions: options
        }
    }

    /**
     * 处理响应
     */
    async handleResponse(response, requestConfig) {
        // 检查HTTP状态码
        if (response.statusCode === 401) {
            console.log('🔑 收到401响应，尝试静默重新登录')
            console.log('🔍 401错误时loading状态:', this.getLoadingStatus())
            return await this.handleAuthError(requestConfig)
        }

        // 检查业务状态码
        if (response.data?.code === ErrorCode.TOKEN_INVALID) {
            console.log('🔑 业务层token失效，尝试静默重新登录')
            console.log('🔍 token失效时loading状态:', this.getLoadingStatus())
            return await this.handleAuthError(requestConfig)
        }

        // 记录成功响应
        this.logResponse(response, requestConfig)

        return response.data
    }

    /**
     * 处理认证错误，静默重新登录并重试请求
     */
    async handleAuthError(requestConfig) {
        // 如果正在刷新token，将请求加入队列
        if (this.isRefreshing) {
            console.log('⏳ 正在刷新token，请求加入等待队列')
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject, requestConfig })
            })
        }

        // 开始刷新token
        this.isRefreshing = true
        console.log('🔄 开始静默重新登录')

        try {
            // 调用认证管理器进行静默登录
            if (!this.authManager) {
                throw new Error('认证管理器未设置')
            }

            await this.authManager.silentLogin()
            console.log('✅ 静默重新登录成功，开始重试请求')

            // 重试原始请求 - 注意：这里不需要额外的loading管理，因为原始请求的finally会处理
            const retryResult = await this.retryOriginalRequest(requestConfig)

            // 处理队列中的请求
            this.processFailedQueue(null)

            return retryResult

        } catch (error) {
            console.error('❌ 静默重新登录失败:', error)

            // 处理队列中的请求（全部失败）
            this.processFailedQueue(error)

            // 通知认证层处理登录失败
            this.notifyTokenExpired()

            throw error
        } finally {
            this.isRefreshing = false
        }
    }

    /**
     * 重试原始请求
     */
    async retryOriginalRequest(requestConfig) {
        console.log('🔄 重试原始请求:', requestConfig._originalUrl)

        // 重新构建请求配置（获取新的token）
        const newRequestConfig = this.buildRequestConfig(
            requestConfig._originalUrl,
            requestConfig._originalData,
            requestConfig._originalOptions
        )

        // 发送请求
        const response = await this.wxRequest(newRequestConfig)

        // 处理响应（不再处理401，避免无限循环）
        if (response.statusCode === 401) {
            throw new Error('重试后仍然401，认证失败')
        }

        this.logResponse(response, newRequestConfig)
        return response.data
    }

    /**
     * 处理失败队列中的请求
     */
    processFailedQueue(error) {
        const queue = this.failedQueue.splice(0) // 清空队列

        for (const { resolve, reject, requestConfig } of queue) {
            if (error) {
                reject(error)
            } else {
                // 重试请求
                this.retryOriginalRequest(requestConfig)
                    .then(resolve)
                    .catch(reject)
            }
        }
    }

    /**
     * 处理错误
     */
    handleError(error, requestConfig) {
        // 记录错误
        this.logError(error, requestConfig)

        // 检查是否是认证相关错误
        if (this.isAuthError(error)) {
            console.log('🔑 认证错误，尝试静默重新登录')
            return this.handleAuthError(requestConfig)
        }

        // 抛出错误
        throw this.enhanceError(error, requestConfig)
    }

    /**
     * Promise化的wx.request
     */
    wxRequest(options) {
        return new Promise((resolve, reject) => {
            wx.request({
                ...options,
                success: (res) => {
                    resolve(res)
                },
                fail: (err) => {
                    reject(err)
                }
            })
        })
    }

    /**
     * 通知认证层token过期
     */
    notifyTokenExpired() {
        if (this.app) {
            this.app.emit('tokenExpired')
        } else {
            console.warn('⚠️ App实例未设置，无法通知token过期')
        }
    }

    /**
     * 判断是否是认证错误
     */
    isAuthError(error) {
        return error.statusCode === 401 ||
            error.message?.includes('需要重新登录') ||
            error.message?.includes('token') ||
            error.message?.includes('认证')
    }

    /**
     * 增强错误信息
     */
    enhanceError(error, requestConfig) {
        return {
            ...error,
            url: requestConfig.url,
            method: requestConfig.method,
            requestData: requestConfig.data,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * 记录请求日志
     */
    logRequest(config, loadingOptions = {}) {
        // console.log('🚀 发起请求:', {
        //     url: config.url,
        //     method: config.method,
        //     hasToken: !!config.header.Authorization,
        //     showLoading: loadingOptions.showLoading,
        //     loadingTitle: loadingOptions.loadingTitle,
        //     timestamp: new Date().toISOString()
        // })
    }

    /**
     * 记录响应日志
     */
    logResponse(response, config) {
        // console.log('✅ 请求成功:', {
        //     url: config.url,
        //     statusCode: response.statusCode,
        //     dataCode: response.data?.code,
        //     timestamp: new Date().toISOString()
        // })
    }

    /**
     * 记录错误日志
     */
    logError(error, config) {
        console.error('❌ 请求失败:', {
            url: config.url,
            error: error.message || error,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString()
        })
    }

    /**
     * 重试请求（由认证层在token刷新后调用）
     */
    async retryRequest(url, data, options) {
        console.log('🔄 重试请求:', url)
        return await this.request(url, data, options)
    }

    /**
     * 文件上传方法
     * @param {string} url - 上传地址
     * @param {string} filePath - 文件路径
     * @param {object} options - 上传选项
     */
    uploadFile(url, filePath, options = {}) {
        // 解析loading配置
        const loadingOptions = {
            showLoading: options.showLoading !== false, // 默认显示loading
            loadingTitle: options.loadingTitle || '上传中...',
            loadingMask: options.loadingMask !== undefined ? options.loadingMask : this.loadingConfig.defaultMask
        }

        return new Promise((resolve, reject) => {
            // 显示loading
            if (loadingOptions.showLoading) {
                this.showLoading({
                    title: loadingOptions.loadingTitle,
                    mask: loadingOptions.loadingMask
                })
            }

            // 使用Storage层获取token
            const token = storage.getToken()
            const header = {
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.header
            }

            const uploadConfig = {
                url: `${this.baseURL}${url}`,
                filePath: filePath,
                name: options.name || 'file',
                header: header,
                formData: options.formData || {},
                success: (res) => {
                    console.log('📤 文件上传成功:', {
                        url,
                        statusCode: res.statusCode,
                        timestamp: new Date().toISOString()
                    })

                    try {
                        // 尝试解析响应数据
                        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data

                        // 检查业务状态码
                        if (data.code !== undefined && data.code !== 200 && !data.success) {
                            throw new Error(data.message || '上传失败')
                        }

                        resolve(data)
                    } catch (parseError) {
                        console.error('❌ 解析上传响应失败:', parseError)
                        reject(parseError)
                    }
                },
                fail: (error) => {
                    console.error('❌ 文件上传失败:', {
                        url,
                        error: error.errMsg || error,
                        timestamp: new Date().toISOString()
                    })

                    // 检查是否是认证错误
                    if (this.isAuthError(error)) {
                        this.notifyTokenExpired()
                    }

                    reject(error)
                },
                complete: () => {
                    // 隐藏loading
                    if (loadingOptions.showLoading) {
                        this.hideLoading()
                    }
                }
            }

            // 记录上传日志
            console.log('📤 开始文件上传:', {
                url: uploadConfig.url,
                name: uploadConfig.name,
                hasToken: !!token,
                showLoading: loadingOptions.showLoading,
                loadingTitle: loadingOptions.loadingTitle,
                timestamp: new Date().toISOString()
            })

            wx.uploadFile(uploadConfig)
        })
    }

    /**
     * 支持不同HTTP方法的便捷方法
     */
    get(url, options = {}) {
        return this.request(url, {}, { ...options, method: 'GET' })
    }

    post(url, data = {}, options = {}) {
        return this.request(url, data, { ...options, method: 'POST' })
    }

    put(url, data = {}, options = {}) {
        return this.request(url, data, { ...options, method: 'PUT' })
    }

    delete(url, options = {}) {
        return this.request(url, {}, { ...options, method: 'DELETE' })
    }
}

const httpClient = new HttpClient()

// 导出HTTP客户端实例
export { httpClient }

// 导出请求方法（保持向后兼容）
export default (endpoint, data = {}, options = {}) => {
    return httpClient.request(endpoint, data, options)
} 