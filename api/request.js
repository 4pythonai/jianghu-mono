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
     * @param {object} data - 请求数据
     * @param {object} options - 其他选项
     */
    request(url, data = {}, options = {}) {
        // Token验证和格式化
        const validateAndFormatToken = (token) => {
            if (!token) return null;

            // 基本token格式验证（可根据实际token格式调整）
            const isValidFormat = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token) ||
                token.startsWith('Bearer ');

            if (!isValidFormat) {
                console.warn('⚠️ Token格式可能不正确:', token.substring(0, 10) + '...');
            }

            // 确保token有Bearer前缀
            return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }

        // 获取并验证token
        const token = wx.getStorageSync('token')
        console.log('🔐 Token状态:', {
            exists: !!token,
            token: token ? `${token.substring(0, 10)}...` : 'null',
            storageKeys: wx.getStorageInfoSync().keys,
            timestamp: new Date().toISOString()
        })

        // 构建认证头
        let authHeader = {}
        const formattedToken = validateAndFormatToken(token)
        if (formattedToken) {
            authHeader = { 'Authorization': formattedToken }
            console.log('🔑 添加认证头:', {
                token: formattedToken.substring(0, 20) + '...',
                timestamp: new Date().toISOString()
            })
        } else {
            console.warn('⚠️ 无有效token，请求将以未认证方式发送')
        }

        // 构建最终请求头
        const header = {
            ...this.header,
            ...authHeader,
            ...options.header
        }

        // 记录完整请求信息
        const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2)
        console.log(`🚀 发起请求 [${requestId}]:`, {
            url: this.baseURL + url,
            headers: header,
            data,
            options,
            timestamp: new Date().toISOString()
        })
        return new Promise((resolve, reject) => {
            wx.request({
                url: this.baseURL + url,
                method: 'POST',
                data,
                header,
                timeout: options.timeout || this.timeout,
                success: (res) => {
                    // 检查响应头中的token信息
                    const responseToken = res.header['Authorization'] || res.header['authorization']
                    if (responseToken) {
                        console.log('🔄 服务器返回了新的token:', responseToken.substring(0, 20) + '...')
                    }

                    console.log(`✅ 请求成功 [${requestId}]:`, {
                        url,
                        statusCode: res.statusCode,
                        dataCode: res.data.code,
                        timestamp: new Date().toISOString(),
                        headers: res.header
                    })

                    // 处理token失效
                    if (res.data.code === ErrorCode.TOKEN_INVALID) {
                        console.log(`🔑 Token失效 [${requestId}]:`, {
                            url,
                            originalToken: token ? token.substring(0, 20) + '...' : 'null'
                        })

                        if (!isRefreshing) {
                            isRefreshing = true
                            console.log('🔄 开始刷新Token流程')
                            this.refreshToken()
                                .then(() => {
                                    console.log('✅ Token刷新成功，当前队列长度:', requestQueue.length)
                                    isRefreshing = false
                                    // 重试队列中的请求
                                    requestQueue.forEach(cb => cb())
                                    requestQueue = []
                                })
                                .catch(error => {
                                    console.error('❌ Token刷新失败，清空队列并跳转登录', {
                                        error: error.message || error,
                                        queueLength: requestQueue.length
                                    })
                                    isRefreshing = false
                                    requestQueue = []
                                    wx.navigateTo({ url: '/pages/login/login' })
                                    reject(error)
                                })
                        }

                        // 将请求加入重试队列
                        console.log(`➕ 将请求加入重试队列 [${requestId}]:`, {
                            url,
                            queueLength: requestQueue.length + 1
                        })
                        requestQueue.push(() => {
                            console.log(`🔄 开始重试请求 [${requestId}]:`, url)
                            this.request(url, data, options)
                                .then(resolve)
                                .catch(reject)
                        })
                        return
                    }

                    // 检查其他错误码
                    if (res.data.code !== ErrorCode.SUCCESS) {
                        console.warn(`⚠️ 请求返回错误码 [${requestId}]:`, {
                            url,
                            code: res.data.code,
                            message: res.data.message || '未知错误',
                            timestamp: new Date().toISOString()
                        })
                    }

                    resolve(res.data)
                },
                fail: (err) => {
                    console.error(`❌ 请求失败 [${requestId}]:`, {
                        url: this.baseURL + url,
                        error: err.message || err,
                        errorDetails: err,
                        requestData: data,
                        requestOptions: options,
                        headers: header,
                        timestamp: new Date().toISOString()
                    })

                    // 增强错误信息
                    const enhancedError = {
                        ...err,
                        requestId,
                        url: this.baseURL + url,
                        requestData: data,
                        requestOptions: options,
                        headers: header,
                        timestamp: new Date().toISOString()
                    }
                    reject(enhancedError)
                }
            })
        })
    }

    /**
     * 刷新token
     */
    async refreshToken() {
        const refreshId = Date.now().toString(36)
        console.log(`🔑 开始刷新Token流程 [${refreshId}]`)

        // 获取并验证refreshToken
        const refreshToken = wx.getStorageSync('refreshToken')
        console.log(`🔍 检查refreshToken [${refreshId}]:`, {
            exists: !!refreshToken,
            token: refreshToken ? `${refreshToken.substring(0, 10)}...` : 'null',
            storageKeys: wx.getStorageInfoSync().keys,
            timestamp: new Date().toISOString()
        })

        if (!refreshToken) {
            console.error(`❌ 刷新Token失败 [${refreshId}]：本地无refreshToken`)
            throw new Error('No refresh token')
        }

        try {
            // 构建刷新请求头
            const header = {
                ...this.header,
                'Content-Type': 'application/json'
            }

            console.log(`🔄 发起刷新Token请求 [${refreshId}]:`, {
                url: this.baseURL + '/auth/refresh',
                refreshToken: refreshToken.substring(0, 10) + '...',
                headers: header,
                timestamp: new Date().toISOString()
            })

            const res = await wx.request({
                url: this.baseURL + '/auth/refresh',
                method: 'POST',
                data: { refreshToken },
                header: header
            })

            console.log(`📦 刷新Token响应 [${refreshId}]:`, {
                statusCode: res.statusCode,
                dataCode: res.data.code,
                hasToken: !!res.data.data?.token,
                hasRefreshToken: !!res.data.data?.refreshToken,
                headers: res.header,
                timestamp: new Date().toISOString()
            })

            if (res.data.code === ErrorCode.SUCCESS) {
                // 验证返回的token
                if (!res.data.data?.token) {
                    console.error(`❌ 刷新Token失败 [${refreshId}]：响应中无token`)
                    throw new Error('Response missing token')
                }

                console.log(`✅ 刷新Token成功 [${refreshId}]，更新本地存储`, {
                    newToken: res.data.data.token.substring(0, 10) + '...',
                    newRefreshToken: res.data.data.refreshToken.substring(0, 10) + '...',
                    timestamp: new Date().toISOString()
                })

                // 保存新token
                wx.setStorageSync('token', res.data.data.token)
                wx.setStorageSync('refreshToken', res.data.data.refreshToken)

                // 验证存储是否成功
                const storedToken = wx.getStorageSync('token')
                console.log(`🔍 验证token存储 [${refreshId}]:`, {
                    success: !!storedToken,
                    token: storedToken ? storedToken.substring(0, 10) + '...' : 'null'
                })

                return res.data
            }

            console.error(`❌ 刷新Token失败 [${refreshId}]：服务器返回错误`, {
                code: res.data.code,
                message: res.data.message || '未知错误',
                timestamp: new Date().toISOString()
            })
            throw new Error('Refresh token failed: ' + (res.data.message || '未知错误'))
        } catch (error) {
            console.error(`❌ 刷新Token请求异常 [${refreshId}]`, {
                error: error.message || error,
                stack: error.stack,
                url: this.baseURL + '/auth/refresh',
                timestamp: new Date().toISOString()
            })
            throw error
        }
    }
}

const http = new Http()

// 导出请求方法
export default (endpoint, data = {}, options = {}) => {
    return http.request(endpoint, data, options)
}