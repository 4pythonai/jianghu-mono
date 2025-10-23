// 球场相关API
import request from '../request-simple'

const course = {
    // 获取最近的球场
    getNearestCourses: (data, options) => request('/course/getNearestCourses', data, options),

    // 获取球场详情
    getDetail: (data, options) => request('/course/getDetail', data, options),

    // 获取球场列表
    getList: (data, options) => request('/course/getList', data, options),

    // 获取常用球场
    getFavorites: (data, options) => request('/course/getFavorites', data, options),

    // 搜索球场
    searchCourse: (data, options) => request('/course/searchCourse', data, options),

    // 获取球场详情
    getCourseDetail: (data, options) => request('/course/getCourseDetail', data, options)
}

export default course