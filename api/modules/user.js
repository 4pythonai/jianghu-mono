// 用户相关API
import request from '../request-simple'

const user = {
    // 获取用户信息
    getUserInfo: () => request('/Weixin/getUserInfo'),

    // 微信登录
    wxLogin: (data) => request('/Weixin/wxLogin', data),

    // 绑定手机号
    bindPhoneNumber: (data) => request('/Weixin/bindPhoneNumber', data),

    // 上传头像
    uploadAvatar: (data) => request('/User/uploadAvatar', data),

    // 设置昵称
    updateNickName: (data) => request('/User/updateNickName', data),

    // friends 
    getFriendList: (data) => request('/User/getFriendList', data),

}

export default user