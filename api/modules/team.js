/**
 * 团队相关 API
 */
import { http } from '../http'

/**
 * 获取团队列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise} 团队列表
 */
export const list = (params) => {
    return http.post('/api/team/list', params)
}

/**
 * 获取团队详情
 * @param {string} teamId - 团队ID
 * @returns {Promise} 团队详情
 */
export const detail = (teamId) => {
    return http.post(`/api/team/${teamId}`)
}

/**
 * 创建团队
 * @param {Object} data - 团队信息
 * @returns {Promise} 创建结果
 */
export const create = (data) => {
    return http.post('/api/team/create', data)
}

/**
 * 更新团队信息
 * @param {string} teamId - 团队ID
 * @param {Object} data - 更新的团队信息
 * @returns {Promise} 更新结果
 */
export const update = (teamId, data) => {
    return http.put(`/api/team/${teamId}`, data)
}

/**
 * 加入团队
 * @param {string} teamId - 团队ID
 * @returns {Promise} 加入结果
 */
export const join = (teamId) => {
    return http.post(`/api/team/${teamId}/join`)
}

/**
 * 退出团队
 * @param {string} teamId - 团队ID
 * @returns {Promise} 退出结果
 */
export const leave = (teamId) => {
    return http.post(`/api/team/${teamId}/leave`)
}

/**
 * 解散团队
 * @param {string} teamId - 团队ID
 * @returns {Promise} 解散结果
 */
export const disband = (teamId) => {
    return http.delete(`/api/team/${teamId}`)
}