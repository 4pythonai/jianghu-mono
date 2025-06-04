// mine.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    needBindPhone: false
  },

  onLoad() {
    // 获取用户信息
    this.setData({
      userInfo: app.globalData.userInfo,
      needBindPhone: app.globalData.needBindPhone
    })

    // 监听登录成功事件
    wx.event.on('loginSuccess', this.handleLoginSuccess)

    // 监听需要绑定手机号事件
    wx.event.on('needBindPhone', this.handleNeedBindPhone)
  },

  onUnload() {
    // 取消事件监听
    wx.event.off('loginSuccess', this.handleLoginSuccess)
    wx.event.off('needBindPhone', this.handleNeedBindPhone)
  },

  // 处理登录成功事件
  handleLoginSuccess(userInfo) {
    this.setData({
      userInfo: userInfo
    })
  },

  // 处理需要绑定手机号事件
  handleNeedBindPhone() {
    this.setData({
      needBindPhone: true
    })
  },

  // 获取手机号码
  getPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 用户同意授权，获取到加密数据
      wx.login({
        success: (res) => {
          if (res.code) {
            // 调用绑定手机号接口
            app.api.user.bindPhoneNumber({
              encryptedData: e.detail.encryptedData,
              iv: e.detail.iv,
              code: res.code
            }).then(response => {
              // 更新用户信息
              app.globalData.userInfo = response.data
              app.globalData.needBindPhone = false

              this.setData({
                userInfo: response.data,
                needBindPhone: false
              })

              wx.showToast({
                title: '手机号绑定成功',
                icon: 'success'
              })
            }).catch(err => {
              console.error('绑定手机号失败：', err)
              wx.showToast({
                title: '绑定失败，请重试',
                icon: 'none'
              })
            })
          }
        }
      })
    } else {
      // 用户拒绝授权
      wx.showToast({
        title: '需要授权才能继续使用',
        icon: 'none'
      })
    }
  }
})