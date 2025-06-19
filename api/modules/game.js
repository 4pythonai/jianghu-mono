import request from '../request-simple'

const game = {
    getGameDetail: (data, options) => request('/Game/gameDetail', data, options),
    getPlayerCombination: (data, options) => request('/Game/getPlayerCombination', data, options),
    getPlayerList: (data, options) => request('/test/playerList', data, options),
    createBlankGame: (data, options) => request('/Game/createBlankGame', data, options),
    updateGameCourseCourt: (data, options) => request('/Game/updateGameCourseCourt', data, options),
    updateGameName: (data, options) => request('/Game/updateGameName', data, options),
    updateGamePrivate: (data, options) => request('/Game/updateGamePrivate', data, options),
    updateGamepPivacyPassword: (data, options) => request('/Game/updateGamepPivacyPassword', data, options),
    updateGameOpenTime: (data, options) => request('/Game/updateGameOpenTime', data, options),
    updateGameScoringType: (data, options) => request('/Game/updateGameScoringType', data, options),
    updateGameGroupAndPlayers: (data, options) => request('/Game/updateGameGroupAndPlayers', data, options),
}

export default game