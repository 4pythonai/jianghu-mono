/**
 * 比赛相关 API
 */
import http from '../http'
import { ApiUrls } from '../config'

/**
 * 获取比赛列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.status - 比赛状态
 * @returns {Promise} 比赛列表
 */
export const getGameList = (params) => {
    return http.post(ApiUrls.game.list, { data: params })
}

/**
 * 获取比赛详情
 * @param {string} gameId - 比赛ID
 * @returns {Promise} 比赛详情
 */
export const getGameDetail = (data) => {
    return http.post(ApiUrls.game.detail, data)
}

/**
 * 创建比赛
 * @param {Object} data - 比赛信息
 * @returns {Promise} 创建结果
 */
export const createGame = (data) => {
    return http.post(ApiUrls.game.create, data)
}

/**
 * 更新比赛信息
 * @param {string} gameId - 比赛ID
 * @param {Object} data - 更新的比赛信息
 * @returns {Promise} 更新结果
 */
export const updateGame = (gameId, data) => {
    return http.post(`${ApiUrls.game.detail}/${gameId}`, data)
}