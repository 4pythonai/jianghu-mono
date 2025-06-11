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

    // 上传头像到服务器
    this.uploadAvatarToServer(avatarUrl)
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

  // 上传头像到服务器（新版本）
  uploadAvatarToServer(tempFilePath) {
    console.log('🚀 开始上传头像到服务器:', tempFilePath)

    // 显示上传进度
    wx.showLoading({
      title: '上传头像中...'
    })

    // 使用HTTP客户端的uploadFile方法
    app.http.uploadFile('/User/uploadAvatar', tempFilePath, {
      name: 'avatar', // 后台接收的字段名
      formData: {
        platform: 'miniprogram',
        timestamp: Date.now()
      }
    }).then(response => {
      console.log('✅ 头像上传成功:', response)

      // 获取头像URL
      const avatarUrl = response.data?.avatarUrl || response.avatarUrl

      if (avatarUrl) {
        // 更新用户头像
        this.updateUserAvatar(avatarUrl, true) // true表示是服务器URL

        wx.hideLoading()
        wx.showToast({
          title: '头像上传成功',
          icon: 'success'
        })
      } else {
        throw new Error('服务器返回的头像地址为空')
      }

    }).catch(error => {
      console.error('❌ 头像上传失败:', error)

      // 降级处理：保存到本地
      console.log('🔄 上传失败，降级到本地保存')
      this.saveAvatarLocally(tempFilePath)
    })
  },

  // 降级方案：保存到本地（当服务器上传失败时）
  saveAvatarLocally(tempFilePath) {
    console.log('💾 降级到本地保存头像')

    const fs = wx.getFileSystemManager()
    const avatarName = `avatar_${Date.now()}.jpg`
    const avatarPath = `${wx.env.USER_DATA_PATH}/${avatarName}`

    fs.saveFile({
      tempFilePath: tempFilePath,
      filePath: avatarPath,
      success: (res) => {
        console.log('✅ 头像本地保存成功:', res.savedFilePath)

        // 更新用户头像（本地路径）
        this.updateUserAvatar(res.savedFilePath, false) // false表示是本地路径

        wx.hideLoading()
        wx.showToast({
          title: '头像已保存（本地）',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('❌ 本地保存也失败:', err)

        // 最后的降级：直接使用临时路径
        this.updateUserAvatar(tempFilePath, false)

        wx.hideLoading()
        wx.showToast({
          title: '头像设置成功',
          icon: 'success'
        })
      }
    })
  },

  // 更新用户头像（增强版）
  updateUserAvatar(avatarUrl, isServerUrl = false) {
    console.log('🖼️ 更新用户头像:', { avatarUrl, isServerUrl })

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

    // 更新全局数据
    app.globalData.userInfo = updatedUserInfo
    app.storage.setUserInfo(updatedUserInfo)

    // 如果是服务器URL，清除本地头像缓存
    if (isServerUrl) {
      app.storage.clearUserAvatar()
      console.log('🗑️ 清除本地头像缓存，使用服务器头像')
    } else {
      // 如果是本地路径，保存到Storage
      app.storage.setUserAvatar(avatarUrl)
      console.log('💾 保存本地头像路径')
    }
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

  // 确认用户信息（优化版）
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

    // 检查昵称长度
    const trimmedNickname = tempNickname.trim()
    if (trimmedNickname.length > 20) {
      wx.showToast({
        title: '昵称不能超过20个字符',
        icon: 'none'
      })
      return
    }

    // 显示保存提示
    wx.showLoading({
      title: '保存中...'
    })

    // 调用API更新昵称
    app.api.user.updateNickName({
      nickName: trimmedNickname
    }).then(response => {
      console.log('✅ 昵称更新成功:', response)

      // 更新用户信息
      const updatedUserInfo = {
        ...currentUserInfo,
        nickName: trimmedNickname,
        avatarUrl: avatarUrl || '/images/default-avatar.png'
      }

      // 保存到全局数据和Storage
      app.globalData.userInfo = updatedUserInfo
      app.storage.setUserInfo(updatedUserInfo)

      // 更新页面数据
      this.setData({
        userInfo: updatedUserInfo,
        showAuthButton: false
      })

      // 触发登录成功事件
      app.emit('loginSuccess', updatedUserInfo)

      wx.hideLoading()
      wx.showToast({
        title: '信息保存成功',
        icon: 'success'
      })

    }).catch(error => {
      console.error('❌ 昵称更新失败:', error)

      // 降级处理：只保存到本地
      console.log('🔄 API失败，降级到本地保存')

      const updatedUserInfo = {
        ...currentUserInfo,
        nickName: trimmedNickname,
        avatarUrl: avatarUrl || '/images/default-avatar.png'
      }

      // 保存到全局数据和Storage
      app.globalData.userInfo = updatedUserInfo
      app.storage.setUserInfo(updatedUserInfo)

      // 更新页面数据
      this.setData({
        userInfo: updatedUserInfo,
        showAuthButton: false
      })

      // 触发登录成功事件
      app.emit('loginSuccess', updatedUserInfo)

      wx.hideLoading()
      wx.showToast({
        title: '信息已保存（本地）',
        icon: 'success'
      })
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