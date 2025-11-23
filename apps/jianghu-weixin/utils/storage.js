/**
 * 存储管理器
 * 职责:统一管理本地存储、错误处理、数据清理
 */
class StorageManager {
    constructor() {
        // 存储键名常量
        this.KEYS = {
            TOKEN: 'token',
            USER_INFO: 'userInfo',
            USER_AVATAR: 'userAvatarPath',
            APP_CONFIG: 'appConfig',
            LAST_LOGIN_TIME: 'lastLoginTime',
            WEIXIN_SESSION: 'weixinSession',
            PROFILE_STATUS: 'profileStatus',
            NEED_BIND_PHONE: 'needBindPhone'
        }
    }

    /**
     * 通用存储方法
     * @param {string} key - 存储键
     * @param {any} value - 存储值
     */
    set(key, value) {
        try {
            wx.setStorageSync(key, value)
            // console.log(`💾 存储成功: ${key}`)
            return true
        } catch (error) {
            // console.error(`❌ 存储失败: ${key}`, error)
            return false
        }
    }

    /**
     * 通用读取方法
     * @param {string} key - 存储键
     * @param {any} defaultValue - 默认值
     */
    get(key, defaultValue = null) {
        try {
            const data = wx.getStorageSync(key)
            if (data === '') {
                return defaultValue
            }
            return data
        } catch (error) {
            console.error(`❌ 读取失败: ${key}`, error)
            return defaultValue
        }
    }

    /**
     * 删除存储
     * @param {string} key - 存储键
     */
    remove(key) {
        try {
            wx.removeStorageSync(key)
            console.log(`🗑️ 删除成功: ${key}`)
            return true
        } catch (error) {
            console.error(`❌ 删除失败: ${key}`, error)
            return false
        }
    }

    /**
     * 清除所有存储
     */
    clear() {
        try {
            wx.clearStorageSync()
            console.log('🗑️ 清除所有存储成功')
            return true
        } catch (error) {
            console.error('❌ 清除存储失败:', error)
            return false
        }
    }

    /**
     * 获取存储信息
     */
    getInfo() {
        try {
            return wx.getStorageInfoSync()
        } catch (error) {
            console.error('❌ 获取存储信息失败:', error)
            return { keys: [], currentSize: 0, limitSize: 0 }
        }
    }

    // ==================== Token相关 ====================

    /**
     * 存储访问token
     */
    setToken(token) {
        if (!token) {
            console.warn('⚠️ 尝试存储空token')
            return false
        }
        return this.set(this.KEYS.TOKEN, token)
    }

    /**
     * 获取访问token
     */
    getToken() {
        return this.get(this.KEYS.TOKEN)
    }

    /**
     * 清除token
     */
    clearTokens() {
        return this.remove(this.KEYS.TOKEN)
    }

    /**
     * 检查token是否存在
     */
    hasToken() {
        return !!this.getToken()
    }

    // ==================== 用户信息相关 ====================

    /**
     * 存储用户信息
     */
    setUserInfo(userInfo) {
        if (!userInfo) {
            console.warn('⚠️ 尝试存储空用户信息')
            return false
        }

        // 记录最后登录时间
        this.set(this.KEYS.LAST_LOGIN_TIME, new Date().getTime())

        return this.set(this.KEYS.USER_INFO, userInfo)
    }

    /**
     * 获取用户信息
     */
    getUserInfo() {
        return this.get(this.KEYS.USER_INFO, {})
    }

    /**
     * 清除用户信息
     */
    clearUserInfo() {
        const results = [
            this.remove(this.KEYS.USER_INFO),
            this.remove(this.KEYS.LAST_LOGIN_TIME)
        ]
        return results.every(result => result === true)
    }

    /**
     * 存储用户头像路径
     */
    setUserAvatar(avatarPath) {
        return this.set(this.KEYS.USER_AVATAR, avatarPath)
    }

    /**
     * 获取用户头像路径
     */
    getUserAvatar() {
        return this.get(this.KEYS.USER_AVATAR)
    }

    /**
     * 清除用户头像
     */
    clearUserAvatar() {
        return this.remove(this.KEYS.USER_AVATAR)
    }

    /**
     * 存储微信会话信息
     */
    setWeixinSession(session) {
        return this.set(this.KEYS.WEIXIN_SESSION, session)
    }

    /**
     * 获取微信会话信息
     */
    getWeixinSession() {
        return this.get(this.KEYS.WEIXIN_SESSION, {})
    }

    /**
     * 清除微信会话信息
     */
    clearWeixinSession() {
        return this.remove(this.KEYS.WEIXIN_SESSION)
    }

    /**
     * 存储资料完整度状态
     */
    setProfileStatus(status) {
        return this.set(this.KEYS.PROFILE_STATUS, status || {})
    }

    /**
     * 获取资料完整度状态
     */
    getProfileStatus() {
        return this.get(this.KEYS.PROFILE_STATUS, {
            hasNickname: false,
            hasAvatar: false,
            hasMobile: false
        })
    }

    /**
     * 清除资料完整度状态
     */
    clearProfileStatus() {
        return this.remove(this.KEYS.PROFILE_STATUS)
    }

    /**
     * 存储绑定手机号提示
     */
    setNeedBindPhone(flag) {
        return this.set(this.KEYS.NEED_BIND_PHONE, !!flag)
    }

    /**
     * 获取绑定手机号提示
     */
    getNeedBindPhone() {
        return !!this.get(this.KEYS.NEED_BIND_PHONE, false)
    }

    /**
     * 清除绑定手机号提示
     */
    clearNeedBindPhone() {
        return this.remove(this.KEYS.NEED_BIND_PHONE)
    }

    // ==================== 应用配置相关 ====================

    /**
     * 存储应用配置
     */
    setAppConfig(config) {
        return this.set(this.KEYS.APP_CONFIG, config)
    }

    /**
     * 获取应用配置
     */
    getAppConfig() {
        return this.get(this.KEYS.APP_CONFIG, {})
    }

    // ==================== 数据清理 ====================

    /**
     * 清除所有用户相关数据
     */
    clearUserData() {
        console.log('🧹 开始清除用户数据')

        const results = [
            this.clearTokens(),
            this.clearUserInfo(),
            this.clearUserAvatar(),
            this.clearWeixinSession(),
            this.clearProfileStatus(),
            this.clearNeedBindPhone()
        ]

        const success = results.every(result => result === true)
        console.log(success ? '✅ 用户数据清除成功' : '❌ 用户数据清除部分失败')

        return success
    }

    /**
     * 数据迁移(用于版本升级)
     */
    migrate() {
        try {
            console.log('🔄 开始数据迁移检查')

            // 这里可以添加版本升级时的数据迁移逻辑
            // 例如:修改存储结构、清理废弃数据等

            console.log('✅ 数据迁移检查完成')
            return true
        } catch (error) {
            console.error('❌ 数据迁移失败:', error)
            return false
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 获取存储大小(格式化)
     */
    getStorageSize() {
        const info = this.getInfo()
        return {
            current: `${(info.currentSize / 1024).toFixed(2)}KB`,
            limit: `${(info.limitSize / 1024).toFixed(2)}KB`,
            usage: `${((info.currentSize / info.limitSize) * 100).toFixed(1)}%`
        }
    }

    /**
     * 检查存储健康状态
     */
    checkHealth() {
        const info = this.getInfo()
        const usage = info.currentSize / info.limitSize

        return {
            healthy: usage < 0.8,
            usage: `${(usage * 100).toFixed(1)}%`,
            recommendation: usage > 0.8 ? '建议清理不必要的数据' : '存储状态良好'
        }
    }

    /**
     * 调试:打印所有存储内容
     */
    debug() { }
}

// 创建单例实例
const storage = new StorageManager()

export default storage 
