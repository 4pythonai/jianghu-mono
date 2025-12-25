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
    saveGameScore: (data, options) => request('/Game/saveGameScore', data, options),
    savePrivateWhiteList: (data, options) => request('/Game/savePrivateWhiteList', data, options),
    // set gameScoreStype,设置计分风格
    gameScoreStype: (data, options) => request('/Game/gameScoreStype', data, options),
    // 用户反馈
    userFeedback: (data, options) => request('/Game/userFeedback', data, options),

    // 取消比赛
    cancelGame: (data, options) => request('/Game/cancelGame', data, options),
    // 结束比赛
    finishGame: (data, options) => request('/Game/finishGame', data, options),

    // 设置T台
    setTee: (data, options) => request('/Game/setTee', data, options),
    // 获取比赛邀请二维码
    getGameInviteQrcode: (data, options) => request('/Game/getGameInviteQrcode', data, options),
    // 加入比赛
    joinGame: (data, options) => request('/Game/joinGame', data, options),

}

export default game
