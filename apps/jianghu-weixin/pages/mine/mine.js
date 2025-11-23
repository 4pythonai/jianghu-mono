import { isAuthError } from '../../utils/auth'

const app = getApp()

Page({
  data: {
    userInfo: null,
    profileStatus: {
      hasNickname: false,
      hasAvatar: false,
      hasMobile: false
    },
    needBindPhone: false,
    showAuthButton: true,
    tempNickname: ''
  },

  onLoad() {
    this.syncUserState()
    app.on('loginSuccess', () => this.syncUserState())
  },

  syncUserState() {
    const state = app.getUserState()
    const status = state.profileStatus || this.data.profileStatus

    this.setData({
      userInfo: state.userInfo || {},
      profileStatus: status,
      needBindPhone: state.needBindPhone,
      showAuthButton: !(status.hasNickname && status.hasAvatar),
      tempNickname: state.userInfo?.nickName || ''
    })
  },

  onChooseAvatar(e) {
    if (e.detail.errMsg && e.detail.errMsg !== 'chooseAvatar:ok') {
      wx.showToast({ title: '选择头像失败', icon: 'none' })
      return
    }

    const { avatarUrl } = e.detail
    if (!avatarUrl) {
      wx.showToast({ title: '未获取到头像', icon: 'none' })
      return
    }

    this.uploadAvatar(avatarUrl)
  },

  uploadAvatar(tempFilePath) {
    app.http.uploadFile('/User/uploadAvatar', tempFilePath, {
      name: 'avatar',
      loadingTitle: '上传头像中...'
    }).then(response => {
      const avatarUrl = response.data?.avatar_url || response.data?.avatarUrl || response.avatarUrl

      const updatedUser = { ...app.globalData.userInfo, avatarUrl, avatar: avatarUrl }
      const updatedStatus = { ...app.globalData.profileStatus, hasAvatar: true }

      app.setUserInfo(updatedUser, updatedStatus, app.globalData.needBindPhone)
      this.syncUserState() // 这会自动更新 showAuthButton

      wx.showToast({ title: '头像上传成功', icon: 'success' })
      app.emit('loginSuccess')
    }).catch(error => {
      wx.showModal({
        title: '上传失败',
        content: isAuthError(error) ? '登录已过期' : error.message || '请重试',
        showCancel: false
      })
    })
  },

  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail.value })
  },

  onNicknameChange(e) {
    // 当用户点击键盘上方的"用微信昵称"按钮时，这个事件会触发
    this.setData({ tempNickname: e.detail.value })
  },

  onNicknameFocus() {
    // 输入框获得焦点时不需要额外操作，提示文字已在WXML中显示
  },

  confirmUserInfo() {
    const nickname = this.data.tempNickname?.trim()

    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    if (nickname.length > 20) {
      wx.showToast({ title: '昵称不能超过20个字符', icon: 'none' })
      return
    }

    app.api.user.updateNickName({
      user_id: app.globalData.userInfo.id,
      nickname
    }, {
      loadingTitle: '保存中...'
    }).then(() => {
      const updatedUser = { ...app.globalData.userInfo, nickName: nickname, nickname }
      const updatedStatus = { ...app.globalData.profileStatus, hasNickname: true }

      app.setUserInfo(updatedUser, updatedStatus, app.globalData.needBindPhone)
      this.syncUserState() // 这会自动更新 showAuthButton

      wx.showToast({ title: '保存成功', icon: 'success' })
      app.emit('loginSuccess')
    }).catch(error => {
      wx.showModal({
        title: '保存失败',
        content: error.message || '请重试',
        showCancel: false
      })
    })
  },

  getPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({ title: '需要授权才能继续', icon: 'none' })
      return
    }

    wx.login({
      success: (res) => {
        if (!res.code) {
          wx.showToast({ title: '获取code失败', icon: 'none' })
          return
        }

        app.api.user.bindPhoneNumber({
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv,
          code: res.code
        }).then(response => {
          const updatedStatus = {
            hasNickname: !!(response.user?.nickName || response.user?.nickname),
            hasAvatar: !!(response.user?.avatarUrl || response.user?.avatar),
            hasMobile: true
          }

          app.setUserInfo(response.user, updatedStatus, false)
          this.syncUserState()

          wx.showToast({ title: '手机号绑定成功', icon: 'success' })
          app.emit('loginSuccess')
        }).catch(() => {
          wx.showToast({ title: '绑定失败，请重试', icon: 'none' })
        })
      }
    })
  }
})
