// 导入 API 模块
import { api, initApi } from './api/index'

App({
    globalData: {
        // 全局数据
        userInfo: null,
        // 当前比赛数据
        currentGame: null,
        // API 实例
        api: api
    },

    onLaunch() {
        // 小程序启动时执行
        // 初始化 API
        initApi()

        wx.getSystemInfo({
            success: (res) => {
                this.globalData.systemInfo = res
            }
        })
    },

    onShow() {
        // 小程序显示时执行
    },

    onHide() {
        // 小程序隐藏时执行
    }
})