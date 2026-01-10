/**
 * 用户资料完整性检查工具
 * 
 * 用于统一处理用户昵称、头像等资料的完整性验证
 * 适用场景：创建比赛、加入比赛、发布动态等需要用户资料的功能
 * 
 * @example
 * // 在 app.js 中初始化
 * import { createProfileChecker } from './utils/profile-checker'
 * this.profileChecker = createProfileChecker(this)
 * 
 * // 在页面中使用
 * if (!app.profileChecker.ensureProfileCompleted({
 *     source: 'signup',
 *     modalContent: '加入比赛前请先设置昵称和头像'
 * })) {
 *     return
 * }
 */
class ProfileChecker {
    constructor(app) {
        this.app = app
    }

    /**
     * 检查用户资料是否完整
     * 
     * @param {Object} options - 配置选项
     * @param {Function} options.onSuccess - 资料完整时的回调
     * @param {Function} options.onIncomplete - 资料不完整时的回调
     * @param {String} options.source - 来源标识 ('create-game', 'signup', 'join-game' 等)
     * @param {Boolean} options.showModal - 是否显示提示弹窗，默认 true
     * @param {String} options.modalTitle - 弹窗标题，默认"完善资料"
     * @param {String} options.modalContent - 弹窗内容
     * @returns {Boolean} - 资料是否完整
     */
    ensureProfileCompleted(options = {}) {
        const {
            onSuccess,
            onIncomplete,
            source = 'default',
            showModal = true,
            modalTitle = '完善资料',
            modalContent = '请先设置昵称和头像，方便队友识别你。'
        } = options

        // 1. 获取用户状态
        const { profileStatus, userInfo } = this.getProfileSnapshot()

        // 2. 检查昵称和头像
        const hasNickname = this.resolveHasNickname(profileStatus, userInfo)
        const hasAvatar = this.resolveHasAvatar(profileStatus, userInfo)
        const isComplete = hasNickname && hasAvatar

        // 3. 资料完整
        if (isComplete) {
            if (typeof onSuccess === 'function') {
                onSuccess()
            }
            return true
        }

        // 4. 资料不完整
        if (typeof onIncomplete === 'function') {
            onIncomplete({ hasNickname, hasAvatar })
        }

        if (showModal) {
            this.showProfileModal({
                title: modalTitle,
                content: modalContent,
                source
            })
        }

        return false
    }

    /**
     * 获取用户资料快照
     * 
     * @returns {Object} { profileStatus, userInfo }
     */
    getProfileSnapshot() {
        const state = typeof this.app.getUserState === 'function'
            ? this.app.getUserState()
            : {}

        const profileStatus = state.profileStatus
            || (this.app.storage && typeof this.app.storage.getProfileStatus === 'function'
                ? this.app.storage.getProfileStatus()
                : null)
            || {}

        const userInfo = state.userInfo
            || (this.app.storage && typeof this.app.storage.getUserInfo === 'function'
                ? this.app.storage.getUserInfo()
                : null)
            || {}

        return { profileStatus, userInfo }
    }

    /**
     * 检查是否有昵称
     * 
     * @param {Object} profileStatus - 资料状态对象
     * @param {Object} userInfo - 用户信息对象
     * @returns {Boolean}
     */
    resolveHasNickname(profileStatus, userInfo) {
        if (profileStatus && typeof profileStatus.hasNickname === 'boolean') {
            return profileStatus.hasNickname
        }

        // userInfo 已通过 normalizeUserInfo 标准化，使用 nickname
        return !!(userInfo && userInfo.nickname)
    }

    /**
     * 检查是否有头像
     * 
     * @param {Object} profileStatus - 资料状态对象
     * @param {Object} userInfo - 用户信息对象
     * @returns {Boolean}
     */
    resolveHasAvatar(profileStatus, userInfo) {
        if (profileStatus && typeof profileStatus.hasAvatar === 'boolean') {
            return profileStatus.hasAvatar
        }

        const avatarUrl = userInfo && (
            userInfo.avatar ||
            ''
        )
        return !!(avatarUrl && !this.isDefaultAvatar(avatarUrl))
    }

    /**
     * 判断是否是默认头像
     * 
     * @param {String} avatarUrl - 头像URL
     * @returns {Boolean}
     */
    isDefaultAvatar(avatarUrl) {
        if (!avatarUrl) {
            return true
        }

        return avatarUrl.endsWith('/images/default-avatar.png')
            || avatarUrl === '/images/default-avatar.png'
            || avatarUrl.includes('user_default_avatar.png')
    }

    /**
     * 显示资料完善提示弹窗
     * 
     * @param {Object} options
     * @param {String} options.title - 弹窗标题
     * @param {String} options.content - 弹窗内容
     * @param {String} options.source - 来源标识
     */
    showProfileModal({ title, content, source }) {
        wx.showModal({
            title,
            content,
            confirmText: '去完善',
            cancelText: '稍后',
            success: (res) => {
                if (res.confirm) {
                    this.navigateToProfile(source)
                } else {
                    wx.showToast({
                        title: '已取消',
                        icon: 'none'
                    })
                }
            }
        })
    }

    /**
     * 跳转到个人资料页
     * 
     * @param {String} source - 来源标识
     */
    navigateToProfile(source) {
        this.app.globalData.pendingMineEntrySource = source

        // 尝试使用 switchTab（如果是 tabBar 页面）
        wx.switchTab({
            url: '/pages/mine/mine',
            success: () => {
                console.log('[ProfileChecker] 跳转到个人资料页（switchTab）')
            },
            fail: () => {
                // switchTab 失败时尝试 navigateTo
                wx.navigateTo({
                    url: `/pages/mine/mine?source=${source}`,
                    success: () => {
                        console.log('[ProfileChecker] 跳转到个人资料页（navigateTo）')
                    },
                    fail: () => {
                        this.app.globalData.pendingMineEntrySource = null
                        wx.showToast({
                            title: '跳转失败，请稍后重试',
                            icon: 'none'
                        })
                    }
                })
            }
        })
    }
}

// 单例实例
let profileCheckerInstance = null

/**
 * 创建或获取 ProfileChecker 单例
 * 
 * @param {Object} app - 小程序 App 实例
 * @returns {ProfileChecker}
 */
export function createProfileChecker(app) {
    if (!profileCheckerInstance) {
        profileCheckerInstance = new ProfileChecker(app)
    }
    return profileCheckerInstance
}

/**
 * 获取已创建的 ProfileChecker 实例
 * 
 * @returns {ProfileChecker|null}
 */
export function getProfileChecker() {
    return profileCheckerInstance
}

export default ProfileChecker
