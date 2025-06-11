import { config, ErrorCode } from './config'
import storage from '../utils/storage'

/**
 * HTTP请求封装
 * 职责：网络请求、自动添加token、处理401响应、通知认证层
 */
class HttpClient {
    constructor(baseURL = config.baseURL) {
        this.baseURL = baseURL
        this.timeout = config.timeout
        this.header = config.header
        this.app = null // App实例，用于事件通信
    }

    /**
     * 设置App实例，用于事件通信
     */
    setApp(app) {
        this.app = app
        console.log('🌐 HTTP客户端已连接到App')
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
    handleResponse(response, requestConfig) {
        // 检查HTTP状态码
        if (response.statusCode === 401) {
            console.log('🔑 收到401响应，通知认证层处理')
            this.notifyTokenExpired()
            throw new Error('需要重新登录')
        }

        // 检查业务状态码
        if (response.data?.code === ErrorCode.TOKEN_INVALID) {
            console.log('🔑 业务层token失效，通知认证层处理')
            this.notifyTokenExpired()
            throw new Error('需要重新登录')
        }

        // 记录成功响应
        this.logResponse(response, requestConfig)

        return response.data
    }

    /**
     * 处理错误
     */
    handleError(error, requestConfig) {
        // 记录错误
        this.logError(error, requestConfig)

        // 检查是否是认证相关错误
        if (this.isAuthError(error)) {
            console.log('🔑 认证错误，通知认证层处理')
            this.notifyTokenExpired()
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