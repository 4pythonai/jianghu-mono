/**
 * API 统一导出文件
 */
import http from './http'
import { config } from './config'
import { requestInterceptor, responseInterceptor, responseErrorInterceptor } from './interceptors'

// 导出所有 API 模块
import * as userApi from './modules/user'
import * as gameApi from './modules/game'
import * as teamApi from './modules/team'

// 初始化 API
const initApi = () => {
    // 设置基础配置
    http.setConfig(config)

    // 添加请求拦截器
    http.addRequestInterceptor(requestInterceptor)

    // 添加响应拦截器
    http.addResponseInterceptor(responseInterceptor, responseErrorInterceptor)

    console.log('API 初始化完成')
}

// 导出
export default {
    init: initApi,
    http,
    user: userApi,
    game: gameApi,
    team: teamApi
}