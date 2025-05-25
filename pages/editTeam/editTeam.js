// editTeam.js
const app = getApp()
const { api } = app.globalData

Page({
    data: {
        teamId: '',
        teamInfo: null,
        formData: {
            name: '',
            description: '',
            location: '',
            avatar: ''
        },
        loading: false,
        submitting: false
    },

    onLoad(options) {
        if (options.id) {
            this.setData({ teamId: options.id })
            this.loadTeamInfo()
        } else {
            wx.showToast({
                title: '参数错误',
                icon: 'error'
            })
            setTimeout(() => {
                wx.navigateBack()
            }, 1500)
        }
    },

    // 加载团队信息
    async loadTeamInfo() {
        if (this.data.loading) return

        this.setData({ loading: true })
        wx.showLoading({ title: '加载中...' })

        try {
            const teamInfo = await api.team.detail(this.data.teamId)

            // 检查当前用户是否为管理员
            const userInfo = app.globalData.userInfo
            if (!userInfo || teamInfo.adminId !== userInfo.id) {
                wx.showToast({
                    title: '无权限编辑',
                    icon: 'none'
                })
                setTimeout(() => {
                    wx.navigateBack()
                }, 1500)
                return
            }

            this.setData({
                teamInfo,
                formData: {
                    name: teamInfo.name || '',
                    description: teamInfo.description || '',
                    location: teamInfo.location || '',
                    avatar: teamInfo.avatar || ''
                }
            })
        } catch (error) {
            console.error('加载团队信息失败：', error)
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            })
            setTimeout(() => {
                wx.navigateBack()
            }, 1500)
        } finally {
            wx.hideLoading()
            this.setData({ loading: false })
        }
    },

    // 表单输入处理
    onInput(e) {
        const { field } = e.currentTarget.dataset
        const { value } = e.detail

        this.setData({
            [`formData.${field}`]: value
        })
    },

    // 选择位置
    chooseLocation() {
        wx.chooseLocation({
            success: (res) => {
                this.setData({
                    'formData.location': res.name || res.address
                })
            },
            fail: (err) => {
                if (err.errMsg.indexOf('auth deny') >= 0) {
                    wx.showModal({
                        title: '提示',
                        content: '需要授权位置信息才能选择位置',
                        confirmText: '去授权',
                        success: (res) => {
                            if (res.confirm) {
                                wx.openSetting()
                            }
                        }
                    })
                }
            }
        })
    },

    // 选择头像
    chooseAvatar() {
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                // 这里应该上传图片到服务器，获取URL
                // 为了简化，我们直接使用本地临时路径
                const tempFilePath = res.tempFilePaths[0]

                // 实际项目中，应该调用上传API
                // 这里模拟上传成功后设置头像URL
                this.uploadAvatar(tempFilePath)
            }
        })
    },

    // 上传头像（实际项目中应该实现真正的上传逻辑）
    async uploadAvatar(filePath) {
        wx.showLoading({ title: '上传中...' })

        try {
            // 模拟上传延迟
            await new Promise(resolve => setTimeout(resolve, 1000))

            // 实际项目中，这里应该是服务器返回的URL
            this.setData({
                'formData.avatar': filePath
            })

            wx.showToast({
                title: '上传成功',
                icon: 'success'
            })
        } catch (error) {
            console.error('上传头像失败：', error)
            wx.showToast({
                title: '上传失败',
                icon: 'none'
            })
        } finally {
            wx.hideLoading()
        }
    },

    // 提交表单
    async submitForm() {
        // 表单验证
        const { name } = this.data.formData
        if (!name.trim()) {
            wx.showToast({
                title: '团队名称不能为空',
                icon: 'none'
            })
            return
        }

        if (this.data.submitting) return
        this.setData({ submitting: true })
        wx.showLoading({ title: '保存中...' })

        try {
            await api.team.update(this.data.teamId, this.data.formData)

            wx.showToast({
                title: '保存成功',
                icon: 'success'
            })

            // 返回上一页并刷新
            setTimeout(() => {
                // 设置上一页需要刷新
                const pages = getCurrentPages()
                const prevPage = pages[pages.length - 2]
                if (prevPage) {
                    prevPage.setData({ needRefresh: true })
                }
                wx.navigateBack()
            }, 1500)
        } catch (error) {
            console.error('保存团队信息失败：', error)
            wx.showToast({
                title: '保存失败',
                icon: 'none'
            })
        } finally {
            wx.hideLoading()
            this.setData({ submitting: false })
        }
    },

    // 解散团队
    disbandTeam() {
        wx.showModal({
            title: '解散团队',
            content: '确定要解散该团队吗？此操作不可撤销！',
            confirmText: '解散',
            confirmColor: '#FF0000',
            success: async (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: '处理中...' })

                    try {
                        await api.team.disband(this.data.teamId)

                        wx.showToast({
                            title: '团队已解散',
                            icon: 'success'
                        })

                        // 返回团队列表页
                        setTimeout(() => {
                            wx.navigateBack({
                                delta: 2 // 返回两级，跳过团队详情页
                            })
                        }, 1500)
                    } catch (error) {
                        console.error('解散团队失败：', error)
                        wx.showToast({
                            title: '操作失败',
                            icon: 'none'
                        })
                    } finally {
                        wx.hideLoading()
                    }
                }
            }
        })
    }
})