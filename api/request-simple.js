import { config, ErrorCode } from './config'

/**
 * 简化版HTTP请求封装
 */
class SimpleHttp {
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
    async request(url, data = {}, options = {}) {
        // 获取token并构建请求头
        const token = wx.getStorageSync('token')
        const header = {
            ...this.header,
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.header
        }

        try {
            const res = await this.wxRequest({
                url: `${this.baseURL}${url}`,
                method: 'POST',
                data,
                header,
                timeout: options.timeout || this.timeout
            })

            // 处理token失效，自动刷新并重试
            if (res.data.code === ErrorCode.TOKEN_INVALID) {
                console.log('Token失效，正在刷新...')
                await this.refreshToken()

                // 重新构建请求头
                const newToken = wx.getStorageSync('token')
                const newHeader = {
                    ...this.header,
                    ...(newToken && { 'Authorization': `Bearer ${newToken}` }),
                    ...options.header
                }

                // 重试请求
                const retryRes = await this.wxRequest({
                    url: `${this.baseURL}${url}`,
                    method: 'POST',
                    data,
                    header: newHeader,
                    timeout: options.timeout || this.timeout
                })

                return retryRes.data
            }

            return res.data
        } catch (error) {
            console.error('请求失败:', error)
            throw error
        }
    }

    /**
     * Promise化的wx.request
     */
    wxRequest(options) {
        return new Promise((resolve, reject) => {
            wx.request({
                ...options,
                success: resolve,
                fail: reject
            })
        })
    }

    /**
     * 刷新token
     */
    async refreshToken() {
        const refreshToken = wx.getStorageSync('refreshToken')
        if (!refreshToken) {
            throw new Error('没有refreshToken')
        }

        try {
            const res = await this.wxRequest({
                url: `${this.baseURL}/auth/refresh`,
                method: 'POST',
                data: { refreshToken },
                header: {
                    ...this.header,
                    'Content-Type': 'application/json'
                }
            })

            if (res.data.code === ErrorCode.SUCCESS && res.data.data?.token) {
                wx.setStorageSync('token', res.data.data.token)
                wx.setStorageSync('refreshToken', res.data.data.refreshToken)
                console.log('Token刷新成功')
                return res.data
            }

            throw new Error(`Token刷新失败: ${res.data.message || '未知错误'}`)
        } catch (error) {
            console.error('Token刷新失败:', error)
            // 清除本地token并跳转登录
            wx.removeStorageSync('token')
            wx.removeStorageSync('refreshToken')
            wx.navigateTo({ url: '/pages/login/login' })
            throw error
        }
    }
}

const simpleHttp = new SimpleHttp()

// 导出请求方法
export default (endpoint, data = {}, options = {}) => {
    return simpleHttp.request(endpoint, data, options)
} 