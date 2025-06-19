/**
 * 快速检查loading状态的工具
 */

const app = getApp()

/**
 * 立即检查loading状态
 */
export const checkLoadingNow = () => {
    console.log('🔍 立即检查loading状态')

    if (!app?.http) {
        console.error('❌ app.http 未初始化')
        return false
    }

    const status = app.http.getLoadingStatus()
    console.log('📊 当前loading状态:', status)

    if (status.isLoading) {
        console.warn('⚠️ 发现loading仍在显示!')
        console.log('🔧 正在强制清理...')
        app.http.forceHideLoading()

        // 再次检查
        setTimeout(() => {
            const newStatus = app.http.getLoadingStatus()
            if (newStatus.isLoading) {
                console.error('❌ 强制清理后loading仍在显示，直接调用wx.hideLoading')
                wx.hideLoading()
            } else {
                console.log('✅ loading已成功清理')
            }
        }, 100)

        return false
    } else {
        console.log('✅ loading状态正常')
        return true
    }
}

/**
 * 在控制台快速调用的方法
 */
export const quickFix = () => {
    console.log('🚨 快速修复loading')
    app.http.forceHideLoading()
    wx.hideLoading()
    console.log('✅ 快速修复完成')
}

// 导出到全局，方便在控制台调用
if (typeof global !== 'undefined') {
    global.checkLoadingNow = checkLoadingNow
    global.quickFix = quickFix
}

export default {
    checkLoadingNow,
    quickFix
} 