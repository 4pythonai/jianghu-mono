/**
 * Loading调试工具 - 更新版
 * 用于诊断loading一直显示的问题
 */

const app = getApp()

/**
 * 获取详细的loading状态
 */
export const getDetailedLoadingStatus = () => {
    if (!app?.http) {
        console.error('❌ app.http 未初始化')
        return null
    }

    const status = app.http.getLoadingStatus()
    console.log('🔍 详细loading状态:', {
        ...status,
        config: app.http.loadingConfig
    })

    return status
}

/**
 * 强制重置loading状态
 */
export const forceResetLoading = () => {
    console.log('🚫 强制重置loading状态')

    if (app?.http) {
        app.http.forceHideLoading()
        console.log('✅ loading状态已重置')

        // 再次检查状态
        setTimeout(() => {
            const status = getDetailedLoadingStatus()
            if (status?.isLoading) {
                console.warn('⚠️ 重置后loading仍在显示，直接调用wx.hideLoading')
                wx.hideLoading()
            }
        }, 100)
    } else {
        // 直接调用微信API
        wx.hideLoading()
        console.log('✅ 直接隐藏微信loading')
    }
}

/**
 * 测试loading的显示和隐藏
 */
export const testLoadingCycle = async () => {
    console.log('🧪 测试loading完整周期')

    try {
        // 1. 检查初始状态
        console.log('1️⃣ 初始状态:')
        getDetailedLoadingStatus()

        // 2. 手动显示loading
        console.log('2️⃣ 手动显示loading')
        app.http.showLoading({ title: '测试loading...' })
        getDetailedLoadingStatus()

        // 3. 等待一段时间
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 4. 手动隐藏loading
        console.log('3️⃣ 手动隐藏loading')
        app.http.hideLoading()
        getDetailedLoadingStatus()

        // 5. 再等待一段时间检查最终状态
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('4️⃣ 最终状态:')
        getDetailedLoadingStatus()

    } catch (error) {
        console.error('❌ 测试失败:', error)
    }
}

/**
 * 监控loading状态变化
 */
export const monitorLoadingStatus = (duration = 10000) => {
    console.log(`📊 开始监控loading状态... (${duration}ms)`)

    const checkStatus = () => {
        const status = getDetailedLoadingStatus()
        if (status?.isLoading) {
            console.warn('⚠️ Loading仍在显示:', status)
        }
    }

    // 每2秒检查一次
    const timer = setInterval(checkStatus, 2000)

    // 指定时间后停止监控
    setTimeout(() => {
        clearInterval(timer)
        console.log('📊 停止监控loading状态')
    }, duration)

    return timer
}

// 导出所有方法
export default {
    getDetailedLoadingStatus,
    forceResetLoading,
    testLoadingCycle,
    monitorLoadingStatus
} 