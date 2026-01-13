import { isAuthError } from '../../utils/auth'
import { imageUrl } from '../../utils/image'

const app = getApp()

Page({
  data: {
    userInfo: {},
    qrcodeUrl: '',
    form: {
      nickname: '',
      signature: '',
      gender: 'unknown'
    },
    saving: false
  },

  onLoad() {
    this.handleUserInfoChange = this.refreshUserInfo.bind(this)
    this.refreshUserInfo()
    app.on('loginSuccess', this.handleUserInfoChange)
    app.on('userInfoChanged', this.handleUserInfoChange)
  },

  onUnload() {
    app.off('loginSuccess', this.handleUserInfoChange)
    app.off('userInfoChanged', this.handleUserInfoChange)
  },

  refreshUserInfo() {
    const state = typeof app.getUserState === 'function'
      ? app.getUserState()
      : { userInfo: app.globalData.userInfo }
    const userInfo = state.userInfo || {}

    this.setData({
      userInfo,
      qrcodeUrl: imageUrl(userInfo.qrcode),
      form: {
        nickname: userInfo.nickname || '',
        signature: userInfo.signature || '',
        gender: userInfo.gender || 'unknown'
      }
    })
  },

  onNicknameInput(e) {
    this.setData({ 'form.nickname': e.detail.value })
  },

  onSignatureInput(e) {
    this.setData({ 'form.signature': e.detail.value })
  },

  onGenderSelect(e) {
    const value = e.currentTarget.dataset.value
    if (!value) return
    this.setData({ 'form.gender': value })
  },

  onTapQrcode() {
    const url = this.data.qrcodeUrl
    if (!url) {
      wx.showToast({ title: '暂无二维码', icon: 'none' })
      return
    }
    wx.previewImage({ urls: [url] })
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
      const avatarUrl = response.data?.avatar || ''
      const updatedUser = { ...app.globalData.userInfo, avatar: avatarUrl }
      app.setUserInfo(updatedUser, app.globalData.profileStatus, app.globalData.needBindPhone)
      this.refreshUserInfo()
      wx.showToast({ title: '头像已更新', icon: 'success' })
      app.emit('loginSuccess')
    }).catch(error => {
      wx.showModal({
        title: '上传失败',
        content: isAuthError(error) ? '登录已过期' : error.message || '请重试',
        showCancel: false
      })
    })
  },

  async saveProfile() {
    if (this.data.saving) return

    const { form, userInfo } = this.data
    if (!userInfo?.id) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const nickname = (form.nickname || '').trim()
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (nickname.length > 20) {
      wx.showToast({ title: '昵称不能超过20个字符', icon: 'none' })
      return
    }

    const signature = (form.signature || '').trim()
    const gender = form.gender || 'unknown'

    const hasNicknameChange = nickname !== (userInfo.nickname || '')
    const profilePayload = {}
    if (signature !== (userInfo.signature || '')) {
      profilePayload.signature = signature
    }
    if (gender !== (userInfo.gender || 'unknown')) {
      profilePayload.gender = gender
    }

    if (!hasNicknameChange && Object.keys(profilePayload).length === 0) {
      wx.showToast({ title: '没有需要保存的修改', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    try {
      if (hasNicknameChange) {
        await app.api.user.updateNickName({
          user_id: userInfo.id,
          nickname
        }, {
          loadingTitle: '保存昵称...'
        })

        const updatedUser = { ...app.globalData.userInfo, nickname, nickName: nickname }
        app.setUserInfo(updatedUser, app.globalData.profileStatus, app.globalData.needBindPhone)
      }

      if (Object.keys(profilePayload).length) {
        const response = await app.api.user.updateProfile(profilePayload, {
          loadingTitle: '保存资料...'
        })

        if (response.code !== 200) {
          throw new Error(response.message || '保存失败')
        }

        const updatedUser = response.user || app.globalData.userInfo
        app.setUserInfo(updatedUser, app.globalData.profileStatus, app.globalData.needBindPhone)
      }

      this.refreshUserInfo()
      wx.showToast({ title: '已保存', icon: 'success' })
      app.emit('loginSuccess')
    } catch (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
