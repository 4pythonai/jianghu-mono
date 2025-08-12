Component({
    properties: {
        // 游戏ID
        gameid: {
            type: String,
            value: ''
        },
        // 组别ID
        groupid: {
            type: String,
            value: ''
        },
        // 创建时间
        createTime: {
            type: String,
            value: ''
        },
        // 游戏状态
        gameStatus: {
            type: String,
            value: '进行中'
        }
    },

    data: {
        model: false,
        animationData: {}
    },

    methods: {
        handleShowTecModelClick: function (e) {
            this.initModel(e.currentTarget.dataset.status)
        },

        handleCancelTecClick: function (e) {
            this.initModel(e.currentTarget.dataset.status)
        },

        handleChangeTecClick: function (e) {
            this.initModel(e.currentTarget.dataset.status)
            // 触发确定事件
            this.triggerEvent('confirm')
        },

        initModel: function (status) {
            const animation = wx.createAnimation({
                duration: 300,
                timingFunction: "ease",
                delay: 0
            })
            this.animation = animation;
            animation.translateX(100).step();
            this.setData({
                animationData: animation.export()
            })
            setTimeout(function () {
                animation.translateX(0).step()
                this.setData({
                    animationData: animation.export()
                })
                if (status === "close") {
                    this.setData({
                        model: false
                    })
                    // 触发关闭事件
                    this.triggerEvent('close')
                }
            }.bind(this), 300)
            if (status === "open") {
                this.setData({
                    model: true
                })
                // 触发打开事件
                this.triggerEvent('open')
            }
        },

        // 对外暴露的显示方法
        show: function () {
            this.initModel("open")
        },

        // 对外暴露的隐藏方法
        hide: function () {
            this.initModel("close")
        }
    }
})
