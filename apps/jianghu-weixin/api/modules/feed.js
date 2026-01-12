import request from '../request-simple'

const feed = {
    /**
     * 统一的 Feed 接口
     * @param {Object} data - { feed_type: 'my' | 'public' | 'registering' | 'registered' }
     */
    myFeeds: (data, options) => request('/Feed/myFeeds', data, options),
}

export default feed