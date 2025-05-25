/**
 * API 配置文件
 */

// 环境配置
const ENV = {
    development: {
        baseURL: 'http://140.179.50.120:7000/v2',
    },
    production: {
        baseURL: 'https:/.example.com',
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
        login: '/user/login',
        info: '/user/info',
        update: '/user/update'
    },
    // 比赛相关
    game: {
        list: '/game/list',
        detail: '/Test/gameDetail',
        create: '/game/create'
    },

    // 团队相关
    team: {
        list: '/team/list',
        detail: '/team/detail',
        create: '/team/create'
    },
    // 球场相关
    course: {
        getNearstCourses: '/course/getNearstCourses',
    }
}