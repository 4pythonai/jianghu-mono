const app = getApp()

Page({
  data: {
    webviewUrl: ''
  },

  onLoad() {
    const userInfo = app.globalData.userInfo || {}
    const userId = userInfo.id || ''

    // 构建 webview URL，传递用户ID
    const baseUrl = 'https://qiaoyincapital.com/v3/index.php/Jianghu/index'
    const webviewUrl = userId ? `${baseUrl}?userid=${userId}` : baseUrl

    this.setData({ webviewUrl })
  }
})
