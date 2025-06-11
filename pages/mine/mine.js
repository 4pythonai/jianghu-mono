// mine.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    needBindPhone: false,
    showAuthButton: true,
    tempNickname: '' // 临时存储用户输入的昵称
  },

  onLoad() {
    // 获取用户信息，确保总是有一个默认对象
    const initUserInfo = app.globalData.userInfo || {}

    // 使用Storage层获取头像
    let avatarUrl = initUserInfo.avatarUrl || '/images/default-avatar.png'
    const savedAvatarPath = app.storage.getUserAvatar()

    if (savedAvatarPath) {
      // 检查文件是否存在
      const fs = wx.getFileSystemManager()
      try {
        fs.accessSync(savedAvatarPath)
        avatarUrl = savedAvatarPath
        console.log('📸 加载本地头像:', savedAvatarPath)
      } catch (error) {
        console.log('🖼️ 本地头像文件不存在，使用默认头像')
        // 清除无效的存储
        app.storage.clearUserAvatar()
      }
    }

    const safeUserInfo = {
      nickName: '',
      avatarUrl: avatarUrl,
      ...initUserInfo
    }

    this.setData({
      userInfo: safeUserInfo,
      needBindPhone: app.globalData.needBindPhone,
      showAuthButton: !safeUserInfo.nickName,
      tempNickname: safeUserInfo.nickName || ''
    })

    // 监听登录成功事件
    app.on('loginSuccess', this.handleLoginSuccess)

    // 监听需要绑定手机号事件
    app.on('needBindPhone', this.handleNeedBindPhone)
  },

  // 选择头像（增强版）
  onChooseAvatar(e) {
    console.log('📸 选择头像:', e.detail)

    // 检查是否有错误信息
    if (e.detail.errMsg && e.detail.errMsg !== 'chooseAvatar:ok') {
      console.error('❌ 选择头像失败:', e.detail.errMsg)

      // 如果是开发工具的tmp目录问题，尝试备用方案
      if (e.detail.errMsg.includes('ENOENT') || e.detail.errMsg.includes('tmp')) {
        console.log('🔧 检测到开发工具bug，尝试备用方案')
        this.chooseAvatarFallback()
        return
      }

      wx.showToast({
        title: '头像选择失败，请重试',
        icon: 'none'
      })
      return
    }

    const { avatarUrl } = e.detail

    // 检查是否获取到头像地址
    if (!avatarUrl) {
      console.error('❌ 未获取到头像地址')
      wx.showToast({
        title: '头像获取失败，请重试',
        icon: 'none'
      })
      return
    }

    // 保存头像到本地存储
    this.saveAvatarToLocal(avatarUrl)
  },

  // 备用头像选择方案
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
          this.saveAvatarToLocal(tempFilePath)
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

  // 保存头像到本地存储（优化版）
  saveAvatarToLocal(tempAvatarUrl) {
    // 显示加载提示
    wx.showLoading({
      title: '保存头像中...'
    })

    // 获取文件管理器
    const fs = wx.getFileSystemManager()
    const avatarName = `avatar_${Date.now()}.jpg`
    const avatarPath = `${wx.env.USER_DATA_PATH}/${avatarName}`

    try {
      // 将临时文件保存到本地存储
      fs.saveFile({
        tempFilePath: tempAvatarUrl,
        filePath: avatarPath,
        success: (res) => {
          console.log('✅ 头像保存成功:', res.savedFilePath)

          // 更新用户信息
          this.updateUserAvatar(res.savedFilePath)

          // 使用Storage层保存头像路径
          app.storage.setUserAvatar(res.savedFilePath)

          wx.hideLoading()
          wx.showToast({
            title: '头像保存成功',
            icon: 'success'
          })
        },
        fail: (err) => {
          console.error('❌ 头像保存失败:', err)

          // 如果保存失败，仍然使用临时路径
          this.updateUserAvatar(tempAvatarUrl)

          wx.hideLoading()
          wx.showToast({
            title: '头像设置成功',
            icon: 'success'
          })
        }
      })
    } catch (error) {
      console.error('❌ 文件系统操作失败:', error)

      // 降级处理：直接使用临时路径
      this.updateUserAvatar(tempAvatarUrl)

      wx.hideLoading()
      wx.showToast({
        title: '头像设置成功',
        icon: 'success'
      })
    }
  },

  // 更新用户头像
  updateUserAvatar(avatarUrl) {
    // 确保 userInfo 存在
    const currentUserInfo = this.data.userInfo || {
      nickName: '',
      avatarUrl: '/images/default-avatar.png'
    }

    // 更新头像
    const updatedUserInfo = {
      ...currentUserInfo,
      avatarUrl: avatarUrl
    }

    // 更新页面数据
    this.setData({
      userInfo: updatedUserInfo
    })

    // 更新全局数据和Storage
    app.globalData.userInfo = updatedUserInfo
    app.storage.setUserInfo(updatedUserInfo)
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      tempNickname: e.detail.value
    })
  },

  // 昵称改变
  onNicknameChange(e) {
    this.setData({
      tempNickname: e.detail.value
    })
  },

  // 确认用户信息
  confirmUserInfo() {
    const { tempNickname } = this.data
    // 安全获取当前用户信息，提供默认值
    const currentUserInfo = this.data.userInfo || {}
    const { avatarUrl } = currentUserInfo

    // 检查是否有昵称
    if (!tempNickname || tempNickname.trim() === '') {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    // 更新用户信息
    const updatedUserInfo = {
      ...currentUserInfo,
      nickName: tempNickname.trim(),
      avatarUrl: avatarUrl || '/images/default-avatar.png'
    }

    // 保存到全局数据
    app.globalData.userInfo = updatedUserInfo

    // 更新页面数据
    this.setData({
      userInfo: updatedUserInfo,
      showAuthButton: false
    })

    // 触发登录成功事件
    app.emit('loginSuccess', updatedUserInfo)

    wx.showToast({
      title: '信息完善成功',
      icon: 'success'
    })
  },

  onUnload() {
    // 取消事件监听
    app.off('loginSuccess', this.handleLoginSuccess)
    app.off('needBindPhone', this.handleNeedBindPhone)
  },

  // 处理登录成功事件
  handleLoginSuccess(userInfo) {
    // 确保传入的 userInfo 有默认值
    const safeUserInfo = {
      nickName: '',
      avatarUrl: '/images/default-avatar.png',
      ...(userInfo || {})
    }

    this.setData({
      userInfo: safeUserInfo,
      showAuthButton: !safeUserInfo.nickName,
      tempNickname: safeUserInfo.nickName || ''
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