/**
 * 团队相关 API
 */
import http from '../http'
import { ApiUrls } from '../config'

/**
 * 获取团队列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise} 团队列表
 */
export const getTeamList = (params) => {
    return http.get(ApiUrls.team.list, { data: params })
}

/**
 * 获取团队详情
 * @param {string} teamId - 团队ID
 * @returns {Promise} 团队详情
 */
export const getTeamDetail = (teamId) => {
    return http.get(`${ApiUrls.team.detail}/${teamId}`)
}

/**
 * 创建团队
 * @param {Object} data - 团队信息
 * @returns {Promise} 创建结果
 */
export const createTeam = (data) => {
    return http.post(ApiUrls.team.create, data)
}

/**
 * 更新团队信息
 * @param {string} teamId - 团队ID
 * @param {Object} data - 更新的团队信息
 * @returns {Promise} 更新结果
 */
export const updateTeam = (teamId, data) => {
    return http.put(`${ApiUrls.team.detail}/${teamId}`, data)
}

/**
 * 加入团队
 * @param {string} teamId - 团队ID
 * @returns {Promise} 加入结果
 */
export const joinTeam = (teamId) => {
    return http.post(`${ApiUrls.team.detail}/${teamId}/join`)
}

/**
 * 退出团队
 * @param {string} teamId - 团队ID
 * @returns {Promise} 退出结果
 */
export const leaveTeam = (teamId) => {
    return http.post(`${ApiUrls.team.detail}/${teamId}/leave`)
}