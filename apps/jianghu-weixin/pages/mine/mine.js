import { config as apiConfig } from '../../api/config'
import { isAuthError } from '../../utils/authUtils'

const app = getApp()

const DEFAULT_PROFILE_STATUS = {
  hasNickname: false,
  hasAvatar: false,
  hasMobile: false
}

const ENTRY_SOURCES = {
  SELF: 'self',
  CREATE_GAME: 'create-game',
  SIGN_UP: 'signup'
}

Page({
  data: {
    userInfo: null,
    profileStatus: DEFAULT_PROFILE_STATUS,
    needBindPhone: false,
    showAuthButton: true,
    tempNickname: '',
    entrySource: ENTRY_SOURCES.SELF,
    hasShownNicknameHint: false
  },

  onLoad(options = {}) {
    const entrySource = this.consumeEntrySource(options) || ENTRY_SOURCES.SELF
    this.entrySource = entrySource

    const state = app.getUserState()
    this.syncFromAppState({
      user: state.userInfo,
      profileStatus: state.profileStatus,
      needBindPhone: state.needBindPhone
    })

    this.setData({
      entrySource
    })

    app.on('loginSuccess', this.handleLoginSuccess)
    app.on('needBindPhone', this.handleNeedBindPhone)
  },

  onShow() {
    const pendingSource = this.consumeEntrySource()
    if (pendingSource && pendingSource !== this.entrySource) {
      this.entrySource = pendingSource
      this.setData({
        entrySource: pendingSource
      })
    }
  },

  onUnload() {
    app.off('loginSuccess', this.handleLoginSuccess)
    app.off('needBindPhone', this.handleNeedBindPhone)
  },

  syncFromAppState(payload = {}) {
    const user = payload.user || app.globalData.userInfo || {}
    const normalizedUser = this.resolveAvatar(app.normalizeUserInfo ? app.normalizeUserInfo(user) : { ...user })
    const status = app.auth && typeof app.auth.normalizeProfileStatus === 'function'
      ? app.auth.normalizeProfileStatus(payload.profileStatus, normalizedUser)
      : (payload.profileStatus || DEFAULT_PROFILE_STATUS)
    const needBind = app.auth && typeof app.auth.normalizeNeedBindFlag === 'function'
      ? app.auth.normalizeNeedBindFlag(
        payload.needBindPhone !== undefined ? payload.needBindPhone : app.globalData.needBindPhone,
        status
      )
      : (payload.needBindPhone !== undefined ? payload.needBindPhone : app.globalData.needBindPhone)

    this.setData({
      userInfo: normalizedUser,
      profileStatus: status,
      needBindPhone: needBind,
      showAuthButton: !(status.hasNickname && status.hasAvatar),
      tempNickname: normalizedUser.nickName || ''
    })
  },

  consumeEntrySource(options = {}) {
    if (options && options.source !== undefined && options.source !== null) {
      return this.normalizeEntrySource(options.source)
    }

    const pending = app.globalData.pendingMineEntrySource
    if (pending !== undefined && pending !== null) {
      app.globalData.pendingMineEntrySource = null
      return this.normalizeEntrySource(pending)
    }

    return null
  },

  normalizeEntrySource(rawSource) {
    const source = (rawSource || '').toString().toLowerCase()

    if (source === ENTRY_SOURCES.CREATE_GAME || source === 'create_game' || source === 'creategame') {
      return ENTRY_SOURCES.CREATE_GAME
    }

    if (source === ENTRY_SOURCES.SIGN_UP || source === 'sign_up' || source === 'signup' || source === 'join' || source === 'join-game') {
      return ENTRY_SOURCES.SIGN_UP
    }

    return ENTRY_SOURCES.SELF
  },

  resolveAvatar(user) {
    const resolved = { ...user }
    const savedAvatarPath = app.storage.getUserAvatar()

    if (savedAvatarPath) {
      const fs = wx.getFileSystemManager()
      try {
        fs.accessSync(savedAvatarPath)
        resolved.avatarUrl = savedAvatarPath
      } catch (error) {
        app.storage.clearUserAvatar()
      }
    }

    resolved.avatarUrl = resolved.avatarUrl || '/images/default-avatar.png'
    return resolved
  },

  applyUserProfileChange(userInfo, profileStatusUpdate = {}, options = {}) {
    const baseStatus = options.replaceProfileStatus
      ? {}
      : (app.globalData.profileStatus || this.data.profileStatus || DEFAULT_PROFILE_STATUS)

    const mergedStatus = {
      ...DEFAULT_PROFILE_STATUS,
      ...baseStatus,
      ...profileStatusUpdate
    }

    const needBindFlag = options.needBindPhone !== undefined
      ? (app.auth && typeof app.auth.normalizeNeedBindFlag === 'function'
        ? app.auth.normalizeNeedBindFlag(options.needBindPhone, mergedStatus)
        : options.needBindPhone)
      : app.globalData.needBindPhone

    app.setUserInfo(userInfo, mergedStatus, needBindFlag)

    if (options.avatarIsLocal === true) {
      app.storage.setUserAvatar(userInfo.avatarUrl)
    } else if (options.avatarIsLocal === false) {
      app.storage.clearUserAvatar()
    }

    const latestStatus = app.globalData.profileStatus || mergedStatus
    const resolvedUser = this.resolveAvatar(app.globalData.userInfo)

    this.setData({
      userInfo: resolvedUser,
      profileStatus: latestStatus,
      needBindPhone: app.globalData.needBindPhone,
      showAuthButton: !(latestStatus.hasNickname && latestStatus.hasAvatar),
      tempNickname: resolvedUser.nickName || ''
    })

    const shouldEmit = options.emitLoginSuccess !== false
    if (shouldEmit) {
      app.emit('loginSuccess', {
        user: app.globalData.userInfo,
        profileStatus: latestStatus,
        needBindPhone: app.globalData.needBindPhone
      })
    }
  },

  handleLoginSuccess(payload) {
    this.syncFromAppState(payload)
  },

  handleNeedBindPhone() {
    const status = {
      ...(this.data.profileStatus || DEFAULT_PROFILE_STATUS),
      hasMobile: false
    }
    this.setData({
      profileStatus: status,
      needBindPhone: true,
      showAuthButton: !(status.hasNickname && status.hasAvatar)
    })
  },

  onChooseAvatar(e) {
    console.log('📸 选择头像:', e.detail)

    if (e.detail.errMsg && e.detail.errMsg !== 'chooseAvatar:ok') {
      console.error('❌ 选择头像失败:', e.detail.errMsg)
      if (e.detail.errMsg.includes('ENOENT') || e.detail.errMsg.includes('tmp')) {
        console.log('🔧 检测到开发工具bug, 尝试备用方案')
        this.chooseAvatarFallback()
        return
      }
      wx.showToast({
        title: '头像选择失败, 请重试',
        icon: 'none'
      })
      return
    }

    const { avatarUrl } = e.detail
    if (!avatarUrl) {
      console.error('❌ 未获取到头像地址')
      wx.showToast({
        title: '头像获取失败, 请重试',
        icon: 'none'
      })
      return
    }

    this.uploadAvatarToServer(avatarUrl)
  },

  chooseAvatarFallback() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          const tempFilePath = res.tempFiles[0].tempFilePath
          console.log('✅ 备用方案获取头像成功:', tempFilePath)
          this.uploadAvatarToServer(tempFilePath)
        }
      },
      fail: (err) => {
        console.error('❌ 备用方案也失败:', err)
        wx.showToast({
          title: '选择头像失败',
          icon: 'none'
        })
      }
    })
  },

  uploadAvatarToServer(tempFilePath) {
    console.log('🚀 开始上传头像到服务器:', tempFilePath)

    // 添加调试日志
    const token = app.storage.getToken()
    console.log('📤 准备上传头像:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
      userId: app.globalData.userInfo?.id,
      userInfo: app.globalData.userInfo
    })

    app.http.uploadFile('/User/uploadAvatar', tempFilePath, {
      name: 'avatar',
      formData: {
        platform: 'miniprogram',
        timestamp: Date.now()
      },
      loadingTitle: '上传头像中...'
    }).then(response => {
      console.log('✅ 头像上传成功:', response)
      const avatarUrl = response.data?.avatar_url || response.data?.avatarUrl || response.avatarUrl
      const fallbackUrl = response.data?.avatar_path || response.data?.path

      if (!avatarUrl && fallbackUrl) {
        const baseURL = app?.http?.baseURL || apiConfig?.baseURL || ''
        const normalizedBase = baseURL.replace(/\/index\.php$/, '')
        const finalUrl = normalizedBase ? normalizedBase + fallbackUrl : fallbackUrl
        this.updateUserAvatar(finalUrl, true)
      } else if (!avatarUrl) {
        throw new Error('服务器返回的头像地址为空')
      } else {
        this.updateUserAvatar(avatarUrl, true)
      }

      wx.showToast({
        title: '头像上传成功',
        icon: 'success'
      })
    }).catch(error => {
      console.error('❌ 头像上传失败:', error)

      // 区分不同类型的错误并给出相应提示
      let errorMessage = '头像上传失败，请重试'

      if (isAuthError(error)) {
        errorMessage = '登录已过期，请重新登录'
      } else if (error.message?.includes('网络') || error.errMsg?.includes('network')) {
        errorMessage = '网络连接失败，请检查网络'
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.errMsg) {
        errorMessage = error.errMsg
      }

      wx.showModal({
        title: '上传失败',
        content: errorMessage + '\n\n请稍后重试或联系客服',
        showCancel: false,
        confirmText: '我知道了'
      })
    })
  },


  updateUserAvatar(avatarUrl, isServerUrl = false) {
    const currentUserInfo = app.globalData.userInfo || {}
    const updatedUserInfo = {
      ...currentUserInfo,
      avatarUrl,
      avatar: avatarUrl
    }

    this.applyUserProfileChange(
      updatedUserInfo,
      { hasAvatar: true },
      {
        avatarIsLocal: !isServerUrl
      }
    )
  },

  onNicknameInput(e) {
    this.setData({
      tempNickname: e.detail.value
    })
  },

  onNicknameChange(e) {
    this.setData({
      tempNickname: e.detail.value
    })
  },

  onNicknameFocus() {
    // 当输入框获得焦点时，提示用户使用键盘上方的快捷按钮
    // 这个提示只显示一次，避免打扰用户
    if (!this.data.hasShownNicknameHint) {
      setTimeout(() => {
        wx.showToast({
          title: '键盘上方可选择微信昵称',
          icon: 'none',
          duration: 2000
        })
        this.setData({
          hasShownNicknameHint: true
        })
      }, 500)
    }
  },

  confirmUserInfo() {
    const { tempNickname } = this.data
    const currentUser = app.globalData.userInfo || {}
    // 优先使用 tempNickname，如果没有则使用已有的 userInfo.nickName
    const nicknameToUse = tempNickname || currentUser.nickName || currentUser.nickname || currentUser.wx_nickname || ''

    if (!nicknameToUse || nicknameToUse.trim() === '') {
      wx.showModal({
        title: '需要设置昵称',
        content: '请先点击"获取微信昵称"按钮授权获取您的昵称，否则无法完善个人资料。',
        showCancel: false,
        confirmText: '我知道了'
      })
      return
    }

    const trimmedNickname = nicknameToUse.trim()
    if (trimmedNickname.length > 20) {
      wx.showToast({
        title: '昵称不能超过20个字符',
        icon: 'none'
      })
      return
    }

    const userId = currentUser.id

    if (!userId) {
      wx.showToast({
        title: '用户信息缺失, 请重新登录',
        icon: 'none'
      })
      return
    }

    app.api.user.updateNickName({
      user_id: userId,
      nickname: trimmedNickname
    }, {
      loadingTitle: '保存中...'
    }).then(() => {
      console.log('✅ 昵称更新成功')
      const updatedUserInfo = {
        ...currentUser,
        nickName: trimmedNickname,
        nickname: trimmedNickname,
        wx_nickname: trimmedNickname
      }

      this.applyUserProfileChange(
        updatedUserInfo,
        { hasNickname: true }
      )

      wx.showToast({
        title: '信息保存成功',
        icon: 'success'
      })
    }).catch(error => {
      console.error('❌ 昵称更新失败:', error)

      // 区分不同类型的错误并给出相应提示
      let errorMessage = '保存失败，请重试'

      if (isAuthError(error)) {
        errorMessage = '登录已过期，请重新登录'
      } else if (error.message?.includes('网络') || error.errMsg?.includes('network')) {
        errorMessage = '网络连接失败，请检查网络'
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.errMsg) {
        errorMessage = error.errMsg
      }

      wx.showModal({
        title: '保存失败',
        content: errorMessage + '\n\n请稍后重试或联系客服',
        showCancel: false,
        confirmText: '我知道了'
      })
    })
  },

  getPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({
        title: '需要授权才能继续使用',
        icon: 'none'
      })
      return
    }

    wx.login({
      success: (res) => {
        if (!res.code) {
          wx.showToast({
            title: '获取code失败, 请重试',
            icon: 'none'
          })
          return
        }

        app.api.user.bindPhoneNumber({
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv,
          code: res.code
        }).then(response => {
          const normalizedStatus = app.auth && typeof app.auth.normalizeProfileStatus === 'function'
            ? app.auth.normalizeProfileStatus(response.profile_status, response.user)
            : (response.profile_status || DEFAULT_PROFILE_STATUS)
          const needBind = app.auth && typeof app.auth.normalizeNeedBindFlag === 'function'
            ? app.auth.normalizeNeedBindFlag(response.need_bind_phone, normalizedStatus)
            : (response.need_bind_phone !== undefined ? response.need_bind_phone : false)

          this.applyUserProfileChange(
            response.user,
            normalizedStatus,
            {
              replaceProfileStatus: true,
              needBindPhone: needBind
            }
          )

          wx.showToast({
            title: '手机号绑定成功',
            icon: 'success'
          })
        }).catch(err => {
          console.error('绑定手机号失败:', err)
          wx.showToast({
            title: '绑定失败, 请重试',
            icon: 'none'
          })
        })
      }
    })
  }
})
