/**
 * API 拦截器配置
 */
import { ErrorCode } from './config'

// 获取本地存储的 token
const getToken = () => {
    return wx.getStorageSync('token') || ''
}

// 处理错误响应
const handleErrorResponse = (error) => {
    let message = '服务器开小差了，请稍后再试'

    if (error.data) {
        switch (error.data.code) {
            case ErrorCode.TOKEN_INVALID:
                message = '登录已过期，请重新登录'
                // 可以在这里处理登录过期的逻辑，比如跳转到登录页
                wx.navigateTo({
                    url: '/pages/login/login'
                })
                break
            case ErrorCode.FORBIDDEN:
                message = '没有权限访问'
                break
            case ErrorCode.SERVER_ERROR:
                message = '服务器错误'
                break
            default:
                message = error.data.message || message
        }
    }

    // 显示错误提示
    wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
    })

    return Promise.reject(error)
}

// 请求拦截器
export const requestInterceptor = (config) => {
    // 添加 token 到请求头
    const token = getToken()
    if (token) {
        config.header = {
            ...config.header,
            'Authorization': `Bearer ${token}`
        }
    }

    return config
}

// 响应拦截器
export const responseInterceptor = (response) => {
    console.log('响应拦截器,🌻🌻🌻🌻 服务器返回: 🌻🌻🌻 ', response)
    // 这里可以对响应数据做统一处理
    if (response.statusCode === 200) {
        // 如果是业务成功
        if (response.data.code === ErrorCode.SUCCESS) {
            return response.data
        }
        // 业务错误
        return handleErrorResponse(response)
    }
    // HTTP 错误
    return handleErrorResponse(response)
}

// 响应错误拦截器
export const responseErrorInterceptor = (error) => {
    return handleErrorResponse(error)
}