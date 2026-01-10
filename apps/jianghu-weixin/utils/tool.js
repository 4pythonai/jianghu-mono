/**
 * 工具函数集合
 */

import { config } from '../api/config'




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
 * 符合 RFC 4122 标准的 UUID 格式:xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * @returns {string} 返回标准格式的UUID字符串
 */
export const uuid = () => {
    // 使用 crypto API(如果可用)或回退到 Math.random()
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
 * 生成简化的 UUID(去掉连字符)
 * @returns {string} 返回不带连字符的UUID字符串
 */
export const simpleUuid = () => {
    return uuid().replace(/-/g, '');
};

/**
 * 生成短 UUID(8位)
 * 适用于临时标识符, 不保证全局唯一性
 * @returns {string} 返回8位随机字符串
 */
export const shortUuid = () => {
    return Math.random().toString(36).substr(2, 8);
};

/**
 * 生成带时间戳的 UUID
 * 在标准UUID前添加时间戳, 便于排序和调试
 * @returns {string} 返回带时间戳前缀的UUID
 */
export const timestampUuid = () => {
    const timestamp = new Date().getTime();
    const standardUuid = uuid();
    return `${timestamp}-${standardUuid}`;
};

/**
 * 安全解析日期字符串（兼容 iOS）
 * iOS 不支持 "yyyy-MM-dd HH:mm:ss" 格式，需要转换为 "yyyy-MM-ddTHH:mm:ss" 或 "yyyy/MM/dd HH:mm:ss"
 * @param {string|number|Date} dateStr - 日期字符串、时间戳或 Date 对象
 * @returns {Date} 返回 Date 对象，解析失败返回 Invalid Date
 */
export const parseDate = (dateStr) => {
    if (!dateStr) return new Date(NaN);
    
    // 如果已经是 Date 对象，直接返回
    if (dateStr instanceof Date) return dateStr;
    
    // 如果是数字（时间戳），直接创建
    if (typeof dateStr === 'number') return new Date(dateStr);
    
    // 字符串处理：将 "yyyy-MM-dd HH:mm:ss" 转换为 "yyyy-MM-ddTHH:mm:ss"
    // iOS 支持的格式：
    // - "yyyy/MM/dd"
    // - "yyyy/MM/dd HH:mm:ss"
    // - "yyyy-MM-dd"
    // - "yyyy-MM-ddTHH:mm:ss"
    // - "yyyy-MM-ddTHH:mm:ss+HH:mm"
    const str = String(dateStr).trim();
    
    // 如果包含空格且是 "yyyy-MM-dd HH:mm:ss" 格式，替换为 T
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
        return new Date(str.replace(' ', 'T'));
    }
    
    // 其他格式直接尝试解析
    return new Date(str);
};

/**
 * 格式化日期为指定格式
 * @param {string|number|Date} dateStr - 日期字符串、时间戳或 Date 对象
 * @param {string} format - 格式模板，支持 yyyy, MM, dd, HH, mm, ss
 * @returns {string} 格式化后的日期字符串，解析失败返回空字符串
 */
export const formatDate = (dateStr, format = 'yyyy-MM-dd') => {
    const date = parseDate(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
        .replace('yyyy', year)
        .replace('MM', month)
        .replace('dd', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
};