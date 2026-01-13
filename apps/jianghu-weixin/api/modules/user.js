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

    // 关注用户
    followUser: (data, options) => request('/User/followUser', data, options),

    // 取消关注
    unfollowUser: (data, options) => request('/User/unfollowUser', data, options),

    // 通讯录概览 (球队数、关注数、粉丝数、非注册好友数、好友列表)
    getContactsOverview: (data, options) => request('/User/getContactsOverview', data, options),

    // 获取我的粉丝列表
    getFollowers: (data, options) => request('/User/getFollowers', data, options),

    // 获取我关注的人列表
    getFollowings: (data, options) => request('/User/getFollowings', data, options),

    // 获取非注册好友(占位用户)列表
    getGhostUsers: (data, options) => request('/User/getGhostUsers', data, options),

    // 删除非注册好友
    deleteGhostUser: (data, options) => request('/User/deleteGhostUser', data, options),

    // 获取历史比赛成绩
    getGameHistory: (data, options) => request('/User/getGameHistory', data, options),

    // 更新用户资料（签名、性别）
    updateProfile: (data, options) => request('/User/updateProfile', data, options),

    // 获取用户二维码
    getUserQrcode: (data, options) => request('/User/UserQrcode', data, options),
}

export default user