// start.js
Page({
    onReady() {
        setTimeout(() => {
            wx.switchTab({
                url: '/pages/live/live'
            })
        }, 3000)
    }
})