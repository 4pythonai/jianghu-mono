/**
 * 用户相关 API
 */
import http from '../http'
import { ApiUrls } from '../config'

/**
 * 用户登录
 * @param {Object} data - 登录参数
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise} 登录结果
 */
export const login = (data) => {
    return http.post(ApiUrls.user.login, data)
}

/**
 * 获取用户信息
 * @param {string} userId - 用户ID，不传则获取当前登录用户信息
 * @returns {Promise} 用户信息
 */
export const getUserInfo = (userId = '') => {
    return http.post(ApiUrls.user.info, {
        data: userId ? { userId } : {}
    })
}

/**
 * 更新用户信息
 * @param {Object} data - 用户信息
 * @returns {Promise} 更新结果
 */
export const updateUserInfo = (data) => {
    return http.post(ApiUrls.user.update, data)
}