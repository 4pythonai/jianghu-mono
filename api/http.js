import { config, ErrorCode } from './config'

// 请求队列
let requestQueue = []
// 是否正在刷新token
let isRefreshing = false

/**
 * HTTP 请求封装
 */
class Http {
    constructor(baseURL = config.baseURL) {
        this.baseURL = baseURL
        this.timeout = config.timeout
        this.header = config.header
    }

    /**
     * 发送请求
     * @param {string} url - 请求地址
     * @param {string} method - 请求方法
     * @param {object} data - 请求数据
     * @param {object} options - 其他选项
     */
    request(url, method = 'POST', data = {}, options = {}) {
        const token = wx.getStorageSync('token')
        const header = {
            ...this.header,
            ...(token ? { 'Authorization': `${token}` } : {}),
            ...options.header
        }

        return new Promise((resolve, reject) => {
            wx.request({
                url: this.baseURL + url,
                method,
                data,
                header,
                timeout: options.timeout || this.timeout,
                success: (res) => {
                    // 处理token失效
                    if (res.data.code === ErrorCode.TOKEN_INVALID) {
                        if (!isRefreshing) {
                            isRefreshing = true
                            this.refreshToken()
                                .then(() => {
                                    isRefreshing = false
                                    // 重试队列中的请求
                                    requestQueue.forEach(cb => cb())
                                    requestQueue = []
                                })
                                .catch(error => {
                                    isRefreshing = false
                                    requestQueue = []
                                    wx.navigateTo({ url: '/pages/login/login' })
                                    reject(error)
                                })
                        }
                        // 将请求加入重试队列
                        requestQueue.push(() => {
                            this.request(url, method, data, options)
                                .then(resolve)
                                .catch(reject)
                        })
                        return
                    }
                    resolve(res.data)
                },
                fail: reject
            })
        })
    }

    /**
     * GET 请求
     */
    get(url, data = {}, options = {}) {
        return this.request(url, 'GET', data, options)
    }

    /**
     * POST 请求
     */
    post(url, data = {}, options = {}) {
        return this.request(url, 'POST', data, options)
    }

    /**
     * PUT 请求
     */
    put(url, data = {}, options = {}) {
        return this.request(url, 'PUT', data, options)
    }

    /**
     * DELETE 请求
     */
    delete(url, data = {}, options = {}) {
        return this.request(url, 'DELETE', data, options)
    }

    /**
     * 刷新token
     */
    async refreshToken() {
        const refreshToken = wx.getStorageSync('refreshToken')
        if (!refreshToken) {
            throw new Error('No refresh token')
        }

        try {
            const res = await wx.request({
                url: this.baseURL + '/auth/refresh',
                method: 'POST',
                data: { refreshToken },
                header: this.header
            })

            if (res.data.code === ErrorCode.SUCCESS) {
                wx.setStorageSync('token', res.data.data.token)
                wx.setStorageSync('refreshToken', res.data.data.refreshToken)
                return res.data
            }
            throw new Error('Refresh token failed')
        } catch (error) {
            throw error
        }
    }
}

export const http = new Http()