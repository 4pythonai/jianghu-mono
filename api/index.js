/**
 * API 入口文件
 */
import * as user from './modules/user'
import * as team from './modules/team'
import * as game from './modules/game'
import * as course from './modules/course'
import { http } from './http'
import { config } from './config'

// API 模块集合
export const api = {
    user,
    team,
    game,
    course
}

/**
 * 初始化 API
 * @param {Object} options - 配置选项
 * @param {string} options.baseURL - API基础URL
 * @param {number} options.timeout - 超时时间
 * @param {Object} options.header - 请求头
 */
export const initApi = (options = {}) => {
    // 使用传入的配置或默认配置
    const {
        baseURL = config.baseURL,
        timeout = config.timeout,
        header = config.header
    } = options

    // 设置http实例的属性
    http.baseURL = baseURL
    http.timeout = timeout
    http.header = {
        ...http.header,
        ...header
    }
}

// 导出http实例，允许直接使用
export { http }