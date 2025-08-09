import request from '../request-simple'

const gamble = {

    // AddGambleRule
    addGambleRule: (data, options) => request('/Gamble/addGambleRule', data, options),

    // UpdateGambleRule
    updateGambleRule: (data, options) => request('/Gamble/updateGambleRule', data, options),

    // DeleteGambleRule
    deleteGambleRule: (data, options) => request('/Gamble/deleteGambleRule', data, options),

    // 获取用户游戏规则
    getUserGambleRules: (data, options) => request('/Gamble/getUserGambleRules', data, options),

    // 获取单个游戏规则
    getUserGambleRule: (data, options) => request('/Gamble/getUserGambleRule', data, options),


    addRuntimeConfig: (data, options) => request('/Gamble/addRuntimeConfig', data, options),

    updateRuntimeConfig: (data, options) => request('/Gamble/updateRuntimeConfig', data, options),

    // deleteRuntimeConfig
    deleteRuntimeConfig: (data, options) => request('/Gamble/deleteRuntimeConfig', data, options),

    // listRuntimeConfig
    listRuntimeConfig: (data, options) => request('/Gamble/listRuntimeConfig', data, options),

    setGambleVisible: (data, options) => request('/Gamble/setGambleVisible', data, options),


    updateKickOffMultiplier: (data, options) => request('/Gamble/updateKickOffMultiplier', data, options),

    updateDonation: (data, options) => request('/Gamble/updateDonation', data, options),

    updateBigWind: (data, options) => request('/Gamble/updateBigWind', data, options),


    getGambleSummary: (data, options) => request('/Audit/getGambleSummary', data, options),


    changeStartHole: (data, options) => request('/Gamble/changeStartHole', data, options),

    // 跳洞设置
    changeHoleOrder: (data, options) => request('/Gamble/changeHoleOrder', data, options),

}

export default gamble