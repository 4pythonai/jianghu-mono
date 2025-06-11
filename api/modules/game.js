import request from '../request-simple'

const game = {
    getGameDetail: (data) => request('/test/gameDetail', data),
}

export default game