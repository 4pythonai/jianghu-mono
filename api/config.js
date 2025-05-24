/**
 * API 配置文件
 */

// 环境配置
const ENV = {
    development: {
        baseURL: 'http://api.golf-brother.com',
    },
    production: {
        baseURL: 'https://api.example.com',
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

// API 接口地址配置
export const ApiUrls = {
    // 用户相关
    user: {
        login: '/api/user/login',
        info: '/api/user/info',
        update: '/api/user/update'
    },
    // 比赛相关
    game: {
        list: '/api/game/list',
        detail: '/web/miniapi/',
        create: '/api/game/create'
    },
    // 团队相关
    team: {
        list: '/api/team/list',
        detail: '/api/team/detail',
        create: '/api/team/create'
    }
}