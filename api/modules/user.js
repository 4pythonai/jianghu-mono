// 用户相关API
import request from '../request'

const user = {
    // 获取用户信息
    getUserInfo: () => request('/Weixin/getUserInfo'),

    // 微信登录
    wxLogin: (data) => request('/Weixin/wxLogin', data),

    // 绑定手机号
    bindPhone: (data) => request('/Weixin/bindPhone', data)
}

export default user