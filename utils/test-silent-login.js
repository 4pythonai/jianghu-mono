/**
 * 静默重新登录功能测试
 * 用于验证401错误时的自动重试机制
 */

const app = getApp()

/**
 * 测试静默重新登录功能
 */
export async function testSilentLogin() {
    console.log('🧪 开始测试静默重新登录功能')

    try {
        // 1. 模拟token过期，清除当前token
        console.log('1️⃣ 模拟token过期')
        app.storage.clearTokens()

        // 2. 发起一个需要认证的请求
        console.log('2️⃣ 发起需要认证的请求')
        const result = await app.api.user.getUserInfo()

        console.log('✅ 静默重新登录测试成功:', result)
        return { success: true, result }

    } catch (error) {
        console.error('❌ 静默重新登录测试失败:', error)
        return { success: false, error }
    }
}

/**
 * 测试并发请求的静默重新登录
 */
export async function testConcurrentSilentLogin() {
    console.log('🧪 开始测试并发请求的静默重新登录')

    try {
        // 1. 模拟token过期
        console.log('1️⃣ 模拟token过期')
        app.storage.clearTokens()

        // 2. 同时发起多个需要认证的请求
        console.log('2️⃣ 同时发起多个需要认证的请求')
        const promises = [
            app.api.user.getUserInfo(),
            app.api.course.getFavorites(),
            app.api.course.searchCourse({ keyword: '测试' })
        ]

        const results = await Promise.all(promises)

        console.log('✅ 并发静默重新登录测试成功:', results)
        return { success: true, results }

    } catch (error) {
        console.error('❌ 并发静默重新登录测试失败:', error)
        return { success: false, error }
    }
}

/**
 * 在页面中调用测试
 */
export function runTests() {
    console.log('🚀 开始运行静默重新登录测试')

    // 延迟执行，确保app已初始化
    setTimeout(async () => {
        // 测试单个请求
        await testSilentLogin()

        // 等待一段时间后测试并发请求
        setTimeout(async () => {
            await testConcurrentSilentLogin()
        }, 3000)

    }, 2000)
} 