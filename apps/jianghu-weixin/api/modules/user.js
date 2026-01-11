// 用户相关API
import request from '../request-simple'

const user = {
    // 获取用户信息
    getUserInfo: (data, options) => request('/Weixin/getUserInfo', data, options),

    // 微信登录
    wxLogin: (data, options) => request('/Weixin/wxLogin', data, options),

    // 绑定手机号
    bindPhoneNumber: (data, options) => request('/Weixin/bindPhoneNumber', data, options),

    // 上传头像
    uploadAvatar: (data, options) => request('/User/uploadAvatar', data, options),

    // 设置昵称
    updateNickName: (data, options) => request('/User/updateNickName', data, options),

    // friends 
    getFriendList: (data, options) => request('/User/getFriendList', data, options),

    createAndSelect: (data, options) => request('/User/createAndSelect', data, options),

    // search by nickname 
    searchUserByNickname: (data, options) => request('/User/searchUserByNickname', data, options),

    // double-search mobile ,从小程序和app数据库
    doubleSearchMobile: (data, options) => request('/User/doubleSearchMobile', data, options),

    // billongBook 账本
    billongBook: (data, options) => request('/User/billongBook', data, options),

    // 获取其他用户的公开资料
    getUserProfile: (data, options) => request('/User/getUserProfile', data, options),
}

export default user