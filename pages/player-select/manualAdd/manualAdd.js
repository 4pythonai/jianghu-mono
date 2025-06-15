// 引入API
const app = getApp()

Page({
    data: {
        groupIndex: 0,
        slotIndex: 0,
        remarkName: '',
        mobile: '',
        isFormValid: false,
        isSubmitting: false
    },

    onLoad(options) {
        console.log('manualAdd页面加载，参数:', options);

        if (options.groupIndex !== undefined) {
            this.setData({
                groupIndex: Number.parseInt(options.groupIndex)
            });
        }

        if (options.slotIndex !== undefined) {
            this.setData({
                slotIndex: Number.parseInt(options.slotIndex)
            });
        }
    },

    /**
     * 昵称输入处理
     */
    onNicknameInput(e) {
        const remarkName = e.detail.value.trim()
        this.setData({
            remarkName
        }, () => {
            this.validateForm()
        })
    },

    /**
     * 手机号输入处理
     */
    onMobileInput(e) {
        const mobile = e.detail.value.trim()
        this.setData({
            mobile
        }, () => {
            this.validateForm()
        })
    },

    /**
     * 表单验证
     */
    validateForm() {
        const { remarkName, mobile } = this.data
        // 昵称长度至少2位，手机号11位数字
        const isNicknameValid = remarkName.length >= 2
        // const isMobileValid = /^1[3-9]\d{9}$/.test(mobile)

        this.setData({
            isFormValid: isNicknameValid
        })
    },

    /**
 * 提交表单
 */
    async onSubmit() {
        if (!this.data.isFormValid || this.data.isSubmitting) {
            return
        }

        const { remarkName, mobile, groupIndex, slotIndex } = this.data

        // 如果填写了手机号，需要验证格式
        if (mobile && !/^1[3-9]\d{9}$/.test(mobile)) {
            wx.showToast({
                title: '请输入正确的手机号格式',
                icon: 'none',
                duration: 2000
            })
            return
        }

        try {
            this.setData({ isSubmitting: true })

            wx.showLoading({
                title: '创建中...',
                mask: true
            })

            // 调用创建并选择API
            const result = await app.api.user.createAndSelect({
                remarkName,
                mobile,
                groupIndex,
                slotIndex
            })

            wx.hideLoading()

            if (result?.success) {
                wx.showToast({
                    title: '创建成功',
                    icon: 'success',
                    duration: 1500
                })

                // 延迟返回上一页
                setTimeout(() => {
                    wx.navigateBack({
                        delta: 1
                    })
                }, 1500)
            } else {
                throw new Error(result?.message || '创建失败')
            }

        } catch (error) {
            wx.hideLoading()
            console.error('创建用户失败:', error)

            wx.showToast({
                title: error.message || '创建失败，请重试',
                icon: 'none',
                duration: 2000
            })
        } finally {
            this.setData({ isSubmitting: false })
        }
    }

}) 