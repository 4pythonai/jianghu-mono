// 导入 API 模块
import api from './api/index'

App({
    globalData: {
        userInfo: null,
        api: api,
        needBindPhone: false,
        systemInfo: null,
        token: null, // 新增token存储
        _events: {} // 添加事件系统存储
    },

    // 添加简单的事件系统
    on(eventName, callback) {
        if (!this.globalData._events[eventName]) {
            this.globalData._events[eventName] = []
        }
        this.globalData._events[eventName].push(callback)
    },

    off(eventName, callback) {
        const callbacks = this.globalData._events[eventName]
        if (callbacks) {
            this.globalData._events[eventName] = callbacks.filter(cb => cb !== callback)
        }
    },

    emit(eventName, ...args) {
        const callbacks = this.globalData._events[eventName]
        if (callbacks) {
            callbacks.forEach(cb => cb(...args))
        }
    },

    onLaunch() {
        // 获取系统信息
        this.getSystemInfo()

        // 检查本地token
        this.checkLocalToken()
    },

    // 获取系统信息
    getSystemInfo() {
        wx.getSystemInfo({
            success: (res) => {
                this.globalData.systemInfo = res
            },
            fail: (err) => {
                console.error('获取系统信息失败:', err)
            }
        })
    },

    // 检查本地token
    checkLocalToken() {
        try {
            const token = wx.getStorageSync('token')
            if (token) {
                this.globalData.token = token
                // 如果有token，验证token有效性
                this.verifyToken(token)
            } else {
                // 没有token则执行微信登录
                this.wxLogin()
            }
        } catch (err) {
            console.error('读取本地token失败:', err)
            this.wxLogin()
        }
    },

    // 验证token有效性
    verifyToken(token) {
        this.globalData.api.user.getUserInfo()
            .then(response => {
                this.globalData.userInfo = response.data
                this.checkPhoneBinding(response.data)
                this.emit('loginSuccess', response.data)
            })
            .catch(err => {
                console.error('token验证失败:', err)
                this.wxLogin()
            })
    },

    // 微信登录方法（优化版）
    wxLogin() {
        wx.login({
            success: (res) => {
                if (res.code) {
                    this.handleWxLogin(res.code)
                } else {
                    console.error('获取code失败:', res.errMsg)
                    this.retryLogin()
                }
            },
            fail: (err) => {
                console.error('wx.login调用失败:', err)
                this.retryLogin()
            }
        })
    },

    // 处理微信登录
    handleWxLogin(code) {
        this.globalData.api.user.wxLogin({ code })
            .then(response => {
                console.log(" wxlogin 🌻🌻🌻 🌻", response)
                this.handleLoginSuccess(response)
            })
            .catch(err => {
                console.error('微信登录失败:', err)
                this.retryLogin()
            })
    },

    // 处理登录成功
    handleLoginSuccess(data) {
        // 存储token
        if (data.token) {
            this.globalData.token = data.token
            try {
                wx.setStorageSync('token', data.token)
            } catch (err) {
                console.error('存储token失败:', err)
            }
        }

        // 存储用户信息
        this.globalData.userInfo = data
        this.checkPhoneBinding(data)
        this.emit('loginSuccess', data)
    },

    // 重试登录
    retryLogin() {
        setTimeout(() => {
            this.wxLogin()
        }, 2000) // 2秒后重试
    },

    // 检查是否绑定手机号（保持不变）
    checkPhoneBinding(userInfo) {
        if (!userInfo.phoneNumber) {
            this.globalData.needBindPhone = true
            this.emit('needBindPhone')
        } else {
            this.globalData.needBindPhone = false
        }
    },

    onShow() {
        // 小程序显示时执行
    },

    onHide() {
        // 小程序隐藏时执行
    }
})