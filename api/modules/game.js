import request from '../request-simple'

const game = {
    getGameDetail: (data) => request('/test/gameDetail', data),
    getPlayerCombination: (data) => request('/Game/getPlayerCombination', data),
    getPlayerList: (data) => request('/test/playerList', data),
    createBlankGame: (data) => request('/Game/createBlankGame', data),
    updateGameCourseid: (data) => request('/Game/updateGameCourseid', data),
    updateGameName: (data) => request('/Game/updateGameName', data),
    updateGamePrivate: (data) => request('/Game/updateGamePrivate', data),
    updateGamepPivacyPassword: (data) => request('/Game/updateGamepPivacyPassword', data),
    updateGameOpenTime: (data) => request('/Game/updateGameOpenTime', data),
    updateGameScoringType: (data) => request('/Game/updateGameScoringType', data),
}

export default game