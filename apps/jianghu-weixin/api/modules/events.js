import request from '../request-simple'

const events = {
    // 获取赛事轮播图
    getEventBanners: (data, options) => request('/Events/getEventBanners', data, options),

    // 获取可报名赛事列表
    getAvailableEvents: (data, options) => request('/Events/getAvailableEvents', data, options),

    // 获取已报名赛事列表
    getMyEvents: (data, options) => request('/Events/getMyEvents', data, options),

    // 记录围观（用户浏览比赛详情时调用）
    addSpectator: (data, options) => request('/Events/addSpectator', data, options),

    // 获取围观者列表（分页）
    getSpectatorList: (data, options) => request('/Events/getSpectatorList', data, options),
}

export default events
