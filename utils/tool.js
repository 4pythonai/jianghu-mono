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


/**
 * 生成 UUID v4 (随机UUID)
 * 符合 RFC 4122 标准的 UUID 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * @returns {string} 返回标准格式的UUID字符串
 */
export const uuid = () => {
    // 使用 crypto API（如果可用）或回退到 Math.random()
    let d = new Date().getTime();
    let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16;
        if (d > 0) {
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};

/**
 * 生成简化的 UUID（去掉连字符）
 * @returns {string} 返回不带连字符的UUID字符串
 */
export const simpleUuid = () => {
    return uuid().replace(/-/g, '');
};

/**
 * 生成短 UUID（8位）
 * 适用于临时标识符，不保证全局唯一性
 * @returns {string} 返回8位随机字符串
 */
export const shortUuid = () => {
    return Math.random().toString(36).substr(2, 8);
};

/**
 * 生成带时间戳的 UUID
 * 在标准UUID前添加时间戳，便于排序和调试
 * @returns {string} 返回带时间戳前缀的UUID
 */
export const timestampUuid = () => {
    const timestamp = new Date().getTime();
    const standardUuid = uuid();
    return `${timestamp}-${standardUuid}`;
};