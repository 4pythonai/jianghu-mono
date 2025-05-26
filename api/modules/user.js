/**
 * 用户相关 API
 */
import { http } from '../http'

/**
 * 用户登录
 * @param {Object} data - 登录参数
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise} 登录结果
 */
export const login = (data) => {
    return http.post('/user/login', data)
}

/**
 * 获取用户信息
 * @param {string} userId - 用户ID，不传则获取当前登录用户信息
 * @returns {Promise} 用户信息
 */
export const getUserInfo = (userId = '') => {
    return http.post('/user/info', userId ? { userId } : {})
}

/**
 * 更新用户信息
 * @param {Object} data - 用户信息
 * @returns {Promise} 更新结果
 */
export const updateUserInfo = (data) => {
    return http.post('/user/update', data)
}

/**
 * 用户注册
 * @param {Object} data - 注册参数
 * @returns {Promise} 注册结果
 */
export const register = (data) => {
    return http.post('/user/register', data)
}

/**
 * 修改密码
 * @param {Object} data - 密码参数
 * @returns {Promise} 修改结果
 */
export const changePassword = (data) => {
    return http.post('/user/change-password', data)
}

/**
 * 退出登录
 * @returns {Promise} 退出结果
 */
export const logout = () => {
    return http.post('/user/logout')
}