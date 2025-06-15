/**
 * API 配置文件
 */

// 环境配置
const ENV = {
    development: {
        baseURL: 'http://140.179.50.120:7800/v2',
        webURL: 'http://140.179.50.120:7800/',
    },
    production: {
        baseURL: 'http://140.179.50.120:7800/v2',
        webURL: 'http://140.179.50.120:7800/',
    }
}

// 当前环境
const currentEnv = 'development'

// 导出配置
export const config = {
    ...ENV[currentEnv],
    timeout: 10000,
    header: {
        'content-type': 'application/json'
    }
}

// API 错误码配置
export const ErrorCode = {
    SUCCESS: 200,
    TOKEN_INVALID: 401,
    FORBIDDEN: 403,
    SERVER_ERROR: 500
}