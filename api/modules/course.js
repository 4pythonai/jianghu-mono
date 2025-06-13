// 球场相关API
import request from '../request-simple'

const course = {
    // 获取最近的球场
    getNearestCourses: (data) => request('/course/getNearestCourses', data),

    // 获取球场详情
    getDetail: (data) => request('/course/getDetail', data),

    // 获取球场列表
    getList: (data) => request('/course/getList', data),

    // 获取常用球场
    getFavorites: (data) => request('/course/getFavorites', data),

    // 搜索球场
    searchCourse: (data) => request('/course/searchCourse', data),

    // 获取球场详情
    getCourseDetail: (data) => request('/course/getCourseDetail', data)
}

export default course