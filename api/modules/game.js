/**
 * 比赛相关 API
 */
import { http } from '../http'

/**
 * 获取比赛列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise} 比赛列表
 */
export const list = (params) => {
    return http.post('/api/game/list', params)
}

/**
 * 获取比赛详情
 * @param {string} gameId - 比赛ID
 * @returns {Promise} 比赛详情
 */
export const detail = (gameId) => {
    return http.post(`/api/game/${gameId}`)
}

/**
 * 创建比赛
 * @param {Object} data - 比赛信息
 * @param {string} data.name - 比赛名称
 * @param {string} data.time - 比赛时间
 * @param {string} data.location - 比赛地点
 * @param {number} data.maxPlayers - 最大参与人数
 * @returns {Promise} 创建结果
 */
export const create = (data) => {
    return http.post('/api/game/create', data)
}

/**
 * 更新比赛信息
 * @param {string} gameId - 比赛ID
 * @param {Object} data - 更新的比赛信息
 * @returns {Promise} 更新结果
 */
export const update = (gameId, data) => {
    return http.put(`/api/game/${gameId}`, data)
}

/**
 * 加入比赛
 * @param {string} gameId - 比赛ID
 * @returns {Promise} 加入结果
 */
export const join = (gameId) => {
    return http.post(`/api/game/${gameId}/join`)
}

/**
 * 退出比赛
 * @param {string} gameId - 比赛ID
 * @returns {Promise} 退出结果
 */
export const getGameDetail = (params) => {
    return http.post("/test/gameDetail", params)
}

/**
 * 取消比赛
 * @param {string} gameId - 比赛ID
 * @returns {Promise} 取消结果
 */
export const cancel = (gameId) => {
    return http.post(`/api/game/${gameId}/cancel`)
}

/**
 * 获取比赛参与者列表
 * @param {string} gameId - 比赛ID
 * @returns {Promise} 参与者列表
 */
export const getParticipants = (gameId) => {
    return http.get(`/api/game/${gameId}/participants`)
}