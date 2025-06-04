import request from '../request'

const game = {
    getGameDetail: (data) => request('/test/gameDetail', data),
}

export default game