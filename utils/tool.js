/**
 * 工具函数集合
 */

import { config } from '../api/config'

/**
 * 获取基础URL
 * @returns {string} 返回配置中的 webURL
 */
export const getBaseUrl = () => {
    return config.webURL
}

/**
 * 获取API基础URL
 * @returns {string} 返回配置中的 baseURL
 */
export const getApiBaseUrl = () => {
    return config.baseURL
}

/**
 * 其他工具函数可以在这里添加
 */
