import request from '../request-simple'

const feed = {

    // 我的
    myFeeds: (data, options) => request('/Feed/myFeeds', data, options),
    // 广场
    publicFeeds: (data, options) => request('/Feed/publicFeeds', data, options),
}

export default feed