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
    saveGameScores: (data, options) => {
        console.log('模拟API调用: saveGameScores, data:', data);
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.5) {
                    console.log('模拟API: 保存成功');
                    resolve({ code: 200, msg: '保存成功' });
                } else {
                    console.error('模拟API: 保存失败');
                    reject({ code: 500, msg: '网络错误，保存失败' });
                }
            }, 1500); // 模拟1.5秒网络延迟
        });
    }
}

export default game