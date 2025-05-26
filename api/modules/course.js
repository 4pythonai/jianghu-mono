/**
 * 球场相关 API
 */
import { http } from '../http'

/**
 * 获取最近的球场列表
 * @param {Object} params - 查询参数
 * @param {number} params.latitude - 纬度
 * @param {number} params.longitude - 经度
 * @param {number} [params.radius] - 搜索半径（单位：公里）
 * @param {number} [params.limit] - 返回数量限制
 * @returns {Promise} 球场列表
 */
export const getNearestCourses = (params) => {
    return http.post('/course/getNearestCourses', params)
}

/**
 * 获取球场详情
 * @param {string} courseId - 球场ID
 * @returns {Promise} 球场详情
 */
export const detail = (params) => {
    return http.post('/course/detail', params)
}

/**
 * 获取球场列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} [params.keyword] - 搜索关键词
 * @param {string} [params.city] - 城市
 * @returns {Promise} 球场列表
 */
export const list = (params) => {
    return http.post('/course/list', { params })
}

/**
 * 获取球场评论列表
 * @param {string} courseId - 球场ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise} 评论列表
 */
export const getComments = (courseId, params) => {
    return http.post(`/course/${courseId}/comments`, { params })
}


/**
 * 获取球场设施信息
 * @param {string} courseId - 球场ID
 * @returns {Promise} 设施信息
 */
export const getFacilities = (courseId) => {
    return http.post(`/course/${courseId}/facilities`)
}

/**
 * 获取球场价格信息
 * @param {string} courseId - 球场ID
 * @param {string} [date] - 日期，格式：YYYY-MM-DD
 * @returns {Promise} 价格信息
 */
export const getPricing = (courseId, date) => {
    return http.post(`/course/${courseId}/pricing`, {
        params: { date }
    })
}