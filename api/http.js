/**
 * HTTP 请求封装
 * 参考 axios 的设计理念，封装 wx.request
 */

let baseConfig = {
    baseURL: '', // 这里填写你的接口基础地址
    timeout: 10000,
    header: {
        'content-type': 'application/json'
    }
}

// 设置配置
const setConfig = (config) => {
    baseConfig = {
        ...baseConfig,
        ...config,
        header: {
            ...baseConfig.header,
            ...(config.header || {})
        }
    }
}

// 请求拦截器
const requestInterceptors = []
// 响应拦截器
const responseInterceptors = []

// 添加请求拦截器
const addRequestInterceptor = (onFulfilled, onRejected) => {
    requestInterceptors.push({
        onFulfilled,
        onRejected
    })
}

// 添加响应拦截器
const addResponseInterceptor = (onFulfilled, onRejected) => {
    responseInterceptors.push({
        onFulfilled,
        onRejected
    })
}

// 执行请求拦截器
const executeRequestInterceptors = async (config) => {
    let currentConfig = { ...config }
    for (let interceptor of requestInterceptors) {
        try {
            const result = await interceptor.onFulfilled(currentConfig)
            currentConfig = result || currentConfig
        } catch (error) {
            interceptor.onRejected && interceptor.onRejected(error)
            throw error
        }
    }
    return currentConfig
}

// 执行响应拦截器
const executeResponseInterceptors = async (response) => {
    let currentResponse = { ...response }
    for (let interceptor of responseInterceptors) {
        try {
            const result = await interceptor.onFulfilled(currentResponse)
            currentResponse = result || currentResponse
        } catch (error) {
            interceptor.onRejected && interceptor.onRejected(error)
            throw error
        }
    }
    return currentResponse
}

// 创建请求实例
const request = (config) => {
    const fullConfig = {
        ...baseConfig,
        ...config,
        header: {
            ...baseConfig.header,
            ...config.header
        }
    }

    // 处理完整的URL
    if (fullConfig.baseURL && !config.url.startsWith('http')) {
        // 确保 baseURL 使用http协议且末尾没有斜杠，而 url 开头有斜杠
        let baseURL = fullConfig.baseURL.endsWith('/')
            ? fullConfig.baseURL.slice(0, -1)
            : fullConfig.baseURL

        // 强制使用http协议（开发环境）
        if (baseURL.startsWith('https://')) {
            baseURL = 'http://' + baseURL.slice(8)
        } else if (!baseURL.startsWith('http://')) {
            baseURL = 'http://' + baseURL
        }

        const url = config.url.startsWith('/')
            ? config.url
            : `/${config.url}`

        fullConfig.url = `${baseURL}${url}`
    }

    return new Promise((resolve, reject) => {
        executeRequestInterceptors(fullConfig)
            .then(interceptedConfig => {
                console.log('准备发起请求，完整URL:', interceptedConfig.url)
                console.log('请求配置:', interceptedConfig)

                wx.request({
                    ...interceptedConfig,
                    success: async (res) => {
                        try {
                            const interceptedResponse = await executeResponseInterceptors(res)
                            resolve(interceptedResponse)
                        } catch (error) {
                            reject(error)
                        }
                    },
                    fail: (error) => {
                        reject(error)
                    }
                })
            })
            .catch(error => {
                reject(error)
            })
    })
}

// 创建便捷方法
const http = {
    request,
    get: (url, config = {}) => request({ ...config, url, method: 'GET' }),
    post: (url, data, config = {}) => request({ ...config, url, method: 'POST', data }),
    put: (url, data, config = {}) => request({ ...config, url, method: 'PUT', data }),
    delete: (url, config = {}) => request({ ...config, url, method: 'DELETE' }),
    addRequestInterceptor,
    addResponseInterceptor,
    setConfig
}

export default http