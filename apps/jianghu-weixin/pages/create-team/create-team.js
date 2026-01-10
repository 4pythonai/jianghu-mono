const app = getApp()

Page({
  data: {
    mode: 'create', // 'create' 或 'edit'
    teamId: '',
    formData: {
      name: '',
      logo: '',
      slogan: '',
      description: ''
    },
    canSubmit: false,
    submitting: false,
    loading: false
  },

  onLoad(options) {
    const teamId = options.teamId || options.id
    if (teamId) {
      // 编辑模式
      this.setData({ mode: 'edit', teamId })
      this.loadTeamInfo(teamId)
    }
  },

  // 加载球队信息（编辑模式）
  async loadTeamInfo(teamId) {
    this.setData({ loading: true })
    try {
      const res = await app.api.team.getTeamDetail({ team_id: teamId })
      if (res.code === 200 && res.team) {
        const team = res.team
        this.setData({
          formData: {
            name: team.team_name || '',
            logo: team.team_avatar || '',
            slogan: team.sologan || '',
            description: team.description || ''
          },
          loading: false
        })
        this.checkCanSubmit()
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (error) {
      console.error('加载球队信息失败', error)
      wx.showToast({ title: error.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 选择 Logo
  chooseLogo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadLogo(tempFilePath)
      }
    })
  },

  // 上传 Logo
  async uploadLogo(tempFilePath) {
    wx.showLoading({ title: '上传中...' })
    
    try {
      const res = await app.http.uploadFile('/Team/uploadLogo', tempFilePath, {
        name: 'logo'
      })
      
      if (res.data?.logo) {
        this.setData({
          'formData.logo': res.data.logo
        })
        wx.showToast({ title: '上传成功', icon: 'success' })
      }
    } catch (error) {
      console.error('上传 Logo 失败', error)
      wx.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 球队名称输入
  onNameInput(e) {
    const name = e.detail.value
    this.setData({
      'formData.name': name
    })
    this.checkCanSubmit()
  },

  // 口号输入
  onSloganInput(e) {
    this.setData({
      'formData.slogan': e.detail.value
    })
  },

  // 描述输入
  onDescInput(e) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { name } = this.data.formData
    const canSubmit = name.trim().length >= 2
    this.setData({ canSubmit })
  },

  // 提交（创建或更新）
  async submitForm() {
    const { formData, canSubmit, submitting, mode, teamId } = this.data
    
    if (!canSubmit || submitting) return

    // 验证
    if (!formData.name.trim()) {
      wx.showToast({ title: '请输入球队名称', icon: 'none' })
      return
    }

    if (formData.name.trim().length < 2) {
      wx.showToast({ title: '球队名称至少2个字符', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      let res
      const payload = {
        team_name: formData.name.trim(),
        team_avatar: formData.logo || '',
        sologan: formData.slogan.trim() || '',
        description: formData.description.trim() || ''
      }

      if (mode === 'edit') {
        // 更新模式
        payload.team_id = teamId
        res = await app.api.team.updateTeam(payload)
      } else {
        // 创建模式
        res = await app.api.team.createTeam(payload)
      }

      if (res.code === 200) {
        wx.showToast({ 
          title: mode === 'edit' ? '保存成功' : '创建成功', 
          icon: 'success' 
        })
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        throw new Error(res.message || (mode === 'edit' ? '保存失败' : '创建失败'))
      }
    } catch (error) {
      console.error(mode === 'edit' ? '更新球队失败' : '创建球队失败', error)
      wx.showToast({ 
        title: error.message || (mode === 'edit' ? '保存失败，请重试' : '创建失败，请重试'), 
        icon: 'none' 
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
})

