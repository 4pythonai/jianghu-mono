/**
 * 紧急修复loading问题的工具
 */

const app = getApp()

/**
 * 立即强制隐藏loading
 */
export const forceHideLoadingNow = () => {
    console.log('🚨 紧急隐藏loading')

    // 方法1：通过HttpClient
    if (app?.http) {
        app.http.forceHideLoading()
        console.log('✅ 通过HttpClient隐藏loading')
    }

    // 方法2：直接调用微信API
    try {
        wx.hideLoading()
        console.log('✅ 直接调用wx.hideLoading')
    } catch (error) {
        console.error('❌ wx.hideLoading失败:', error)
    }

    // 方法3：多次调用确保隐藏
    setTimeout(() => {
        try {
            wx.hideLoading()
            console.log('✅ 延迟调用wx.hideLoading')
        } catch (error) {
            console.error('❌ 延迟wx.hideLoading失败:', error)
        }
    }, 100)
}

/**
 * 检查并修复loading状态
 */
export const checkAndFixLoading = () => {
    console.log('🔧 检查并修复loading状态')

    if (!app?.http) {
        console.error('❌ app.http 未初始化')
        forceHideLoadingNow()
        return
    }

    const status = app.http.getLoadingStatus()
    console.log('📊 当前loading状态:', status)

    if (status.isLoading) {
        console.warn('⚠️ 发现loading异常，开始修复')

        // 重置loading状态
        app.http.loadingCount = 0
        if (app.http.loadingTimer) {
            clearTimeout(app.http.loadingTimer)
            app.http.loadingTimer = null
        }
        app.http.loadingStartTime = null

        // 强制隐藏
        wx.hideLoading()

        console.log('✅ loading状态已修复')
    } else {
        console.log('✅ loading状态正常')
    }
}

/**
 * 禁用loading功能（临时解决方案）
 */
export const disableLoading = () => {
    console.log('🚫 临时禁用loading功能')

    if (app?.http) {
        // 保存原始方法
        app.http._originalShowLoading = app.http.showLoading
        app.http._originalHideLoading = app.http.hideLoading

        // 替换为空方法
        app.http.showLoading = () => {
            console.log('🚫 loading已被禁用 - showLoading')
        }
        app.http.hideLoading = () => {
            console.log('🚫 loading已被禁用 - hideLoading')
        }

        // 强制隐藏当前loading
        forceHideLoadingNow()

        console.log('✅ loading功能已禁用')
    }
}

/**
 * 恢复loading功能
 */
export const enableLoading = () => {
    console.log('🔄 恢复loading功能')

    if (app?.http && app.http._originalShowLoading) {
        app.http.showLoading = app.http._originalShowLoading
        app.http.hideLoading = app.http._originalHideLoading

        delete app.http._originalShowLoading
        delete app.http._originalHideLoading

        console.log('✅ loading功能已恢复')
    }
}

// 导出快速修复方法
export default {
    forceHideLoadingNow,
    checkAndFixLoading,
    disableLoading,
    enableLoading
}
