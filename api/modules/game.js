import request from '../request-simple'

const game = {
    getGameDetail: (data) => request('/test/gameDetail', data),
    getPlayerCombination: (data) => request('/Game/getPlayerCombination', data),
    getPlayerList: (data) => request('/test/playerList', data),
    createBlankGame: (data) => request('/Game/createBlankGame', data),
    updateGameCourseCourt: (data) => request('/Game/updateGameCourseCourt', data),
    updateGameName: (data) => request('/Game/updateGameName', data),
    updateGamePrivate: (data) => request('/Game/updateGamePrivate', data),
    updateGamepPivacyPassword: (data) => request('/Game/updateGamepPivacyPassword', data),
    updateGameOpenTime: (data) => request('/Game/updateGameOpenTime', data),
    updateGameScoringType: (data) => request('/Game/updateGameScoringType', data),
    updateGameGroupAndPlayers: (data) => request('/Game/updateGameGroupAndPlayers', data),
}

export default game