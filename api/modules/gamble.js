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

    // addRuntimeConfig
    addRuntimeConfig: (data, options) => request('/Gamble/addRuntimeConfig', data, options),

    // updateRuntimeConfig
    updateRuntimeConfig: (data, options) => request('/Gamble/updateRuntimeConfig', data, options),

    // deleteRuntimeConfig
    deleteRuntimeConfig: (data, options) => request('/Gamble/deleteRuntimeConfig', data, options),

}

export default gamble