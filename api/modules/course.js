// 球场相关API
import request from '../request'

const course = {
    // 获取最近的球场
    getNearestCourses: (data) => request('/course/getNearestCourses', data),

    // 获取球场详情
    getDetail: (data) => request('/course/getDetail', data),

    // 获取球场列表
    getList: (data) => request('/course/getList', data)
}

export default course