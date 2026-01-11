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
    tempNickname: '',
    hasNotification: false
  },

  onLoad() {
    this.syncUserState()
    app.on('loginSuccess', () => this.syncUserState())
  },

  onShow() {
    this.syncUserState()
  },

  syncUserState() {
    const state = app.getUserState()
    const status = state.profileStatus || this.data.profileStatus

    this.setData({
      userInfo: state.userInfo || {},
      profileStatus: status,
      needBindPhone: state.needBindPhone,
      showAuthButton: !(status.hasNickname && status.hasAvatar),
      tempNickname: state.userInfo?.nickname || ''
    })
  },

  // 跳转到个人资料
  goToProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  // 跳转到通信录
  goToContacts() {
    wx.navigateTo({ url: '/pages/contacts/contacts' })
  },

  // 跳转到历史成绩
  goToHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  // 跳转到江湖足迹
  goToFootprint() {
    wx.navigateTo({ url: '/pages/footprint/footprint' })
  },

  // 跳转到我的球队
  goToMyTeam() {
    wx.navigateTo({ url: '/pages/my-team/my-team' })
  },

  // 跳转到我的钱包
  goToWallet() {
    wx.navigateTo({ url: '/pages/wallet/wallet' })
  },

  // 跳转到小账本
  goToLedger() {
    wx.navigateTo({ url: '/pages/ledger/ledger' })
  },

  // 跳转到设置
  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
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
      // 后端 User/uploadAvatar 返回 data.avatar 字段
      const avatarUrl = response.data?.avatar || ''

      const updatedUser = { ...app.globalData.userInfo, avatar: avatarUrl }
      const updatedStatus = { ...app.globalData.profileStatus, hasAvatar: true }

      app.setUserInfo(updatedUser, updatedStatus, app.globalData.needBindPhone)
      this.syncUserState()

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
    this.setData({ tempNickname: e.detail.value })
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
      this.syncUserState()

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

    const phoneCode = e.detail.code

    if (!phoneCode) {
      wx.showToast({ title: '获取手机号失败(无code)', icon: 'none' })
      return
    }

    app.api.user.bindPhoneNumber({
      code: phoneCode
    }).then(response => {
      if (response.code !== 200) {
        throw new Error(response.message || '绑定失败')
      }

      // response.user 来自后端，字段是 nickname
      const updatedStatus = {
        hasNickname: !!(response.user?.nickname),
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
