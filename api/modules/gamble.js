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


    addRuntimeConfig: (data, options) => request('/Gamble/addRuntimeConfig', data, options),

    updateRuntimeConfig: (data, options) => request('/Gamble/updateRuntimeConfig', data, options),

    // deleteRuntimeConfig
    deleteRuntimeConfig: (data, options) => request('/Gamble/deleteRuntimeConfig', data, options),

    // listRuntimeConfig
    listRuntimeConfig: (data, options) => request('/Gamble/listRuntimeConfig', data, options),

    setGamblesVisible: (data, options) => request('/Gamble/setGambileVisible', data, options),

    setGamblesBigWind: (data, options) => request('/Gamble/setGamblesBigWind', data, options),

    updateKickOffMultiplier: (data, options) => request('/Gamble/updateKickOffMultiplier', data, options),

    updateDonation: (data, options) => request('/Gamble/updateDonation', data, options),
}

export default gamble