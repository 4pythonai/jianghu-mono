import { http } from '../http'

export const login = (data) => {
    return http.post('/user/login', data)
}

export const wxLogin = (data) => {
    return http.post('/weixin/wxLogin', data)
}

export const bindPhoneNumber = (data) => {
    return http.post('/user/bind-phone', data)
}

export const getUserInfo = (userId = '') => {
    return http.post('/user/info', userId ? { userId } : {})
}

export const updateUserInfo = (data) => {
    return http.post('/user/update', data)
}

export const register = (data) => {
    return http.post('/user/register', data)
}

export const changePassword = (data) => {
    return http.post('/user/change-password', data)
}

export const logout = () => {
    return http.post('/user/logout').then(res => {
        // 清除本地token
        try {
            wx.removeStorageSync('token')
        } catch (err) {
            console.error('清除token失败:', err)
        }
        return res
    })
}