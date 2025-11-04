/**
 * API 配置文件
 */

// 环境配置
const ENV = {
    development: {
        baseURL: 'https://qiaoyincapital.com/v3/index.php',
        wsURL: 'wss://qiaoyincapital.com/ws/'
    },
    production: {
        baseURL: 'https://qiaoyincapital.com/v3/index.php',
        wsURL: 'wss://qiaoyincapital.com/ws/'

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
