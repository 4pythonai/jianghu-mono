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
      const avatarUrl = response.data?.avatar || response.data?.avatar_url || ''

      const updatedUser = { ...app.globalData.userInfo, avatar: avatarUrl }
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

    // 检查session是否有效，虽然解密依赖的是服务端缓存的session_key
    // 但如果session已过期，服务端可能也无法解密（取决于服务端缓存策略）
    // 这里直接发送加密数据，假设服务端有有效的session_key（由app启动时的login建立）

    // 使用新的获取手机号方式 (code换取)
    // 注意: e.detail.code 是获取手机号专用的code，与wx.login的code不同
    const phoneCode = e.detail.code

    if (!phoneCode) {
      // 降级处理或提示用户
      wx.showToast({ title: '获取手机号失败(无code)', icon: 'none' })
      return
    }

    app.api.user.bindPhoneNumber({
      code: phoneCode
    }).then(response => {
      // 检查业务状态码
      if (response.code !== 200) {
        throw new Error(response.message || '绑定失败')
      }

      const updatedStatus = {
        hasNickname: !!(response.user?.nickName || response.user?.nickname),
        hasAvatar: !!(response.user?.avatar),
        hasMobile: true
      }

      app.setUserInfo(response.user, updatedStatus, false)
      this.syncUserState()

      wx.showToast({ title: '手机号绑定成功', icon: 'success' })
      app.emit('loginSuccess')
    }).catch((err) => {
      console.error('绑定手机号失败', err)
      const message = err.message || '绑定失败，请重试'
      wx.showToast({ title: message, icon: 'none' })
    })
  }
})
