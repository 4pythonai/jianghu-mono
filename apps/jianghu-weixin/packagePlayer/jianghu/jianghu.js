const app = getApp()

Page({
  data: {
    webviewUrl: ''
  },

  onLoad() {
    const userInfo = app.globalData.userInfo || {}
    const user_id = userInfo.id || ''

    // 构建 webview URL，传递用户ID
    const baseUrl = 'https://qiaoyincapital.com/v3/index.php/Jianghu/index'
    const webviewUrl = user_id ? `${baseUrl}?user_id=${user_id}` : baseUrl

    this.setData({ webviewUrl })
  }
})
