import { config, ErrorCode } from './config'
import storage from '../utils/storage'

/**
 * HTTP请求封装
 * 职责：网络请求、自动添加token、处理401响应、通知认证层、自动重试
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
     * 发送请求
     * @param {string} url - 请求地址
     * @param {object} data - 请求数据
     * @param {object} options - 其他选项
     */
    async request(url, data = {}, options = {}) {
        // 构建请求配置
        const requestConfig = this.buildRequestConfig(url, data, options)

        // 记录请求日志
        this.logRequest(requestConfig)

        try {
            // 发送请求
            const response = await this.wxRequest(requestConfig)

            // 处理响应
            return this.handleResponse(response, requestConfig)

        } catch (error) {
            // 处理错误
            return this.handleError(error, requestConfig)
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
            return await this.handleAuthError(requestConfig)
        }

        // 检查业务状态码
        if (response.data?.code === ErrorCode.TOKEN_INVALID) {
            console.log('🔑 业务层token失效，尝试静默重新登录')
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

            // 重试原始请求
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

        queue.forEach(({ resolve, reject, requestConfig }) => {
            if (error) {
                reject(error)
            } else {
                // 重试请求
                this.retryOriginalRequest(requestConfig)
                    .then(resolve)
                    .catch(reject)
            }
        })
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
    logRequest(config) {
        console.log('🚀 发起请求:', {
            url: config.url,
            method: config.method,
            hasToken: !!config.header.Authorization,
            timestamp: new Date().toISOString()
        })
    }

    /**
     * 记录响应日志
     */
    logResponse(response, config) {
        console.log('✅ 请求成功:', {
            url: config.url,
            statusCode: response.statusCode,
            dataCode: response.data?.code,
            timestamp: new Date().toISOString()
        })
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
        return new Promise((resolve, reject) => {
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
                }
            }

            // 记录上传日志
            console.log('📤 开始文件上传:', {
                url: uploadConfig.url,
                name: uploadConfig.name,
                hasToken: !!token,
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