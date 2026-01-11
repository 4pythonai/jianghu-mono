/**
 * 系统信息工具函数
 * 用于替代已废弃的 wx.getSystemInfoSync()
 */

// 缓存系统信息，避免重复调用
let cachedSystemInfo = null

/**
 * 获取系统信息（兼容新旧 API）
 * 使用新的 API: getWindowInfo, getDeviceInfo, getAppBaseInfo
 * @returns {Object} 系统信息对象
 */
export function getSystemInfo() {
    if (cachedSystemInfo) {
        return cachedSystemInfo
    }

    try {
        // 使用新的 API
        const windowInfo = wx.getWindowInfo()
        const deviceInfo = wx.getDeviceInfo()
        const appBaseInfo = wx.getAppBaseInfo()

        cachedSystemInfo = {
            // 窗口信息
            statusBarHeight: windowInfo.statusBarHeight,
            windowWidth: windowInfo.windowWidth,
            windowHeight: windowInfo.windowHeight,
            screenWidth: windowInfo.screenWidth,
            screenHeight: windowInfo.screenHeight,
            safeArea: windowInfo.safeArea,
            pixelRatio: windowInfo.pixelRatio,

            // 设备信息
            platform: deviceInfo.platform,
            system: deviceInfo.system,
            model: deviceInfo.model,
            brand: deviceInfo.brand,

            // 应用信息
            SDKVersion: appBaseInfo.SDKVersion,
            language: appBaseInfo.language,
            version: appBaseInfo.version,
            theme: appBaseInfo.theme
        }
    } catch (e) {
        // 降级到旧 API（兼容低版本）
        console.warn('[systemInfo] 新 API 不可用，降级使用 getSystemInfoSync')
        cachedSystemInfo = wx.getSystemInfoSync()
    }

    return cachedSystemInfo
}

/**
 * 获取导航栏高度
 * @returns {number} 导航栏高度（状态栏 + 44px）
 */
export function getNavBarHeight() {
    const info = getSystemInfo()
    return (info.statusBarHeight || 0) + 44
}

/**
 * 获取状态栏高度
 * @returns {number} 状态栏高度
 */
export function getStatusBarHeight() {
    const info = getSystemInfo()
    return info.statusBarHeight || 0
}

/**
 * 判断是否为 iOS 设备
 * @returns {boolean}
 */
export function isIOS() {
    const info = getSystemInfo()
    const system = (info.system || '').toLowerCase()
    const platform = (info.platform || '').toLowerCase()
    return system.includes('ios') || platform === 'ios'
}

/**
 * 获取窗口宽度
 * @returns {number}
 */
export function getWindowWidth() {
    const info = getSystemInfo()
    return info.windowWidth || 375
}

/**
 * 获取窗口高度
 * @returns {number}
 */
export function getWindowHeight() {
    const info = getSystemInfo()
    return info.windowHeight || 667
}

/**
 * 清除缓存（用于需要刷新系统信息的场景）
 */
export function clearCache() {
    cachedSystemInfo = null
}
