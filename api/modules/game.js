import request from '../request-simple'

const game = {
    getGameDetail: (data) => request('/test/gameDetail', data),
    getPlayerCombination: (data) => request('/Game/getPlayerCombination', data),
    getPlayerList: (data) => request('/test/playerList', data),
}

export default game