/**
 * 微信小程序导航工具类
 * 提供统一的页面跳转方法，确保跳转逻辑的一致性和可维护性
 */

class NavigationHelper {
    constructor() {
        this.MAX_PAGE_STACK = 10; // 微信小程序页面栈最大深度
        this.jumpLog = []; // 跳转日志
    }

    /**
     * 记录跳转日志
     */
    _logNavigation(type, url, options = {}) {
        const log = {
            type,
            url,
            options,
            timestamp: new Date().toISOString(),
            stackLength: getCurrentPages().length
        };
        this.jumpLog.push(log);
        console.log(`[Navigation] ${type}:`, log);
        
        // 保留最近100条记录
        if (this.jumpLog.length > 100) {
            this.jumpLog = this.jumpLog.slice(-100);
        }
    }

    /**
     * 检查页面栈深度
     */
    _checkPageStack() {
        const pages = getCurrentPages();
        const currentDepth = pages.length;
        
        if (currentDepth >= this.MAX_PAGE_STACK - 1) {
            console.warn(`[Navigation] 页面栈即将超出限制! 当前深度: ${currentDepth}`);
            this._logPageStack(pages);
            return false;
        }
        return true;
    }

    /**
     * 记录当前页面栈状态（用于调试）
     */
    _logPageStack(pages) {
        console.log(`[Navigation] 当前页面栈 (${pages.length}层):`);
        pages.forEach((page, index) => {
            console.log(`  ${index + 1}. ${page.route} ${page.options ? JSON.stringify(page.options) : ''}`);
        });
    }

    /**
     * 智能页面栈清理
     * 移除中间不必要的页面，保留关键导航路径
     */
    smartCleanPageStack(keepPaths = []) {
        const pages = getCurrentPages();
        const currentDepth = pages.length;
        
        if (currentDepth < 6) {
            return Promise.resolve(false); // 不需要清理
        }

        console.log(`[Navigation] 开始智能清理页面栈，当前深度: ${currentDepth}`);
        
        // 定义重要页面路径，这些页面应该保留
        const importantPaths = [
            'pages/live/live',
            'pages/gameDetail/score/score',
            'pages/gameDetail/bbs/bbs',
            'pages/gameDetail/gamble/gamble',
            'pages/gameDetail/gameDetail',
            'pages/createGame/createGame',
            'pages/rules/rules',
            ...keepPaths
        ];

        // 计算需要返回的层数，跳过中间页面回到重要页面
        let deltaToImportant = 0;
        for (let i = pages.length - 2; i >= 0; i--) {
            deltaToImportant++;
            const page = pages[i];
            if (importantPaths.some(path => page.route.includes(path))) {
                break;
            }
            if (deltaToImportant >= 5) break; // 最多清理5层
        }

        if (deltaToImportant > 1) {
            console.log(`[Navigation] 清理页面栈：返回 ${deltaToImportant} 层`);
            return this.navigateBack(deltaToImportant);
        }

        return Promise.resolve(false);
    }

    /**
     * 获取当前页面信息
     */
    getCurrentPageInfo() {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        return {
            route: currentPage?.route,
            stackDepth: pages.length,
            canGoBack: pages.length > 1
        };
    }

    /**
     * 层级导航 - 保留当前页面到页面栈
     * 适用场景：列表→详情、表单→选择器、主页面→子页面
     */
    navigateTo(url, options = {}) {
        const { autoFallback = true } = options;
        
        return new Promise((resolve, reject) => {
            if (!this._checkPageStack()) {
                if (autoFallback) {
                    console.warn(`[Navigation] 页面栈超限，自动降级为 redirectTo: ${url}`);
                    // 自动降级为页面替换
                    return this.redirectTo(url, '页面栈超限自动降级', options)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error('页面栈深度超限，建议使用 redirectTo 或清理页面栈'));
                    return;
                }
            }

            this._logNavigation('navigateTo', url, options);
            
            wx.navigateTo({
                url,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    console.error(`[Navigation] navigateTo 失败:`, err);
                    reject(err);
                }
            });
        });
    }

    /**
     * 页面替换 - 关闭当前页面，跳转到新页面
     * 适用场景：登录成功→主页、重要流程完成→结果页、错误页→正确页
     */
    redirectTo(url, reason = '', options = {}) {
        return new Promise((resolve, reject) => {
            this._logNavigation('redirectTo', url, { reason, ...options });
            
            wx.redirectTo({
                url,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    console.error(`[Navigation] redirectTo 失败:`, err);
                    reject(err);
                }
            });
        });
    }

    /**
     * Tab页面切换
     * 适用场景：底部Tab切换
     */
    switchTab(url, options = {}) {
        return new Promise((resolve, reject) => {
            this._logNavigation('switchTab', url, options);
            
            wx.switchTab({
                url,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    console.error(`[Navigation] switchTab 失败:`, err);
                    reject(err);
                }
            });
        });
    }

    /**
     * 返回上一页
     */
    navigateBack(delta = 1, options = {}) {
        return new Promise((resolve, reject) => {
            const pages = getCurrentPages();
            if (pages.length <= delta) {
                console.warn(`[Navigation] 无法返回 ${delta} 层，当前只有 ${pages.length} 层`);
                reject(new Error('返回层数超出页面栈深度'));
                return;
            }

            this._logNavigation('navigateBack', `delta:${delta}`, options);
            
            wx.navigateBack({
                delta,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    console.error(`[Navigation] navigateBack 失败:`, err);
                    reject(err);
                }
            });
        });
    }

    /**
     * 应用重启 - 关闭所有页面，跳转到指定页面
     * 适用场景：登录过期、严重错误、应用更新
     */
    reLaunch(url, reason = '', options = {}) {
        return new Promise((resolve, reject) => {
            this._logNavigation('reLaunch', url, { reason, ...options });
            
            wx.reLaunch({
                url,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    console.error(`[Navigation] reLaunch 失败:`, err);
                    reject(err);
                }
            });
        });
    }

    /**
     * 智能导航 - 根据目标页面类型自动选择跳转方式
     */
    smartNavigate(url, options = {}) {
        const { 
            forceType = null,  // 强制指定跳转类型
            reason = '',       // 跳转原因
            replaceWhenDeep = true  // 深度超限时是否替换
        } = options;

        // 强制指定类型
        if (forceType) {
            switch (forceType) {
                case 'navigateTo': return this.navigateTo(url, options);
                case 'redirectTo': return this.redirectTo(url, reason, options);
                case 'switchTab': return this.switchTab(url, options);
                case 'reLaunch': return this.reLaunch(url, reason, options);
                default: return Promise.reject(new Error(`不支持的跳转类型: ${forceType}`));
            }
        }

        // Tab页面检测
        const tabPages = [
            'pages/live/live',
            'pages/events/events', 
            'pages/createGame/createGame',
            'pages/community/community',
            'pages/mine/mine'
        ];
        
        const targetPath = url.split('?')[0];
        if (tabPages.some(page => targetPath.includes(page))) {
            return this.switchTab(url, options);
        }

        // 页面栈深度检查
        if (!this._checkPageStack()) {
            if (replaceWhenDeep) {
                console.warn(`[Navigation] 页面栈深度超限，自动使用 redirectTo`);
                return this.redirectTo(url, '页面栈深度超限自动替换', options);
            } else {
                return Promise.reject(new Error('页面栈深度超限'));
            }
        }

        // 默认使用层级导航
        return this.navigateTo(url, options);
    }

    /**
     * 获取导航历史
     */
    getNavigationHistory() {
        return [...this.jumpLog];
    }

    /**
     * 清除导航历史
     */
    clearNavigationHistory() {
        this.jumpLog = [];
    }

    /**
     * 测试函数 - 验证自动降级是否正常工作
     */
    testAutoFallback() {
        console.log('[Navigation] 开始测试自动降级功能');
        const currentInfo = this.getCurrentPageInfo();
        console.log('[Navigation] 当前页面信息:', currentInfo);
        
        // 模拟页面栈检查
        const isStackOk = this._checkPageStack();
        console.log('[Navigation] 页面栈检查结果:', isStackOk);
        
        return {
            currentDepth: currentInfo.stackDepth,
            maxDepth: this.MAX_PAGE_STACK,
            canNavigate: isStackOk
        };
    }
}

// 创建单例实例
const navigationHelper = new NavigationHelper();

// 兼容 CommonJS 和 ES6 模块系统
module.exports = navigationHelper;
module.exports.default = navigationHelper;
