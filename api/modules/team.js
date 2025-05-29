// 团队相关API
import request from '../request'

const team = {
    // 获取团队列表
    list: (data) => request('/team/list', data),

    // 获取团队详情
    getDetail: (data) => request('/team/getDetail', data),

    // 创建团队
    create: (data) => request('/team/create', data),

    // 加入团队
    join: (data) => request('/team/join', data)
}

export default team