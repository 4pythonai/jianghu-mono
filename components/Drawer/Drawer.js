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
        },
        // 新增：赌博汇总数据
        summaryResult: {
            type: Object,
            value: {}
        },
        // 新增：赌博结果列表
        gambleResults: {
            type: Array,
            value: []
        }
    },

    data: {
        model: false,
        animationData: {},
        // 新增：显示控制状态
        currentDisplayType: 'summary', // 'summary' 或 'detail'
        currentDetailIndex: -1 // 当前显示的明细索引，-1表示显示汇总
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
            if (status === "open") {
                // 打开动画：先设置显示，然后从右侧滑入
                this.setData({
                    model: true
                })

                // 延迟一点时间让DOM渲染完成
                setTimeout(() => {
                    const animation = wx.createAnimation({
                        duration: 400,
                        timingFunction: "ease-out",
                        delay: 0
                    })

                    // 先设置到右侧外
                    animation.translateX(100).step()
                    this.setData({
                        animationData: animation.export()
                    })

                    // 然后滑入到正确位置
                    setTimeout(() => {
                        animation.translateX(0).step()
                        this.setData({
                            animationData: animation.export()
                        })
                        // 触发打开事件
                        this.triggerEvent('open')
                    }, 50)
                }, 50)

            } else if (status === "close") {
                // 关闭动画：先滑出，然后隐藏
                const animation = wx.createAnimation({
                    duration: 400,
                    timingFunction: "ease-out",
                    delay: 0
                })

                // 滑出到右侧
                animation.translateX(100).step()
                this.setData({
                    animationData: animation.export()
                })

                // 等待动画完成后隐藏
                setTimeout(() => {
                    this.setData({
                        model: false
                    })
                    // 触发关闭事件
                    this.triggerEvent('close')
                }, 400)
            }
        },

        // 对外暴露的显示方法
        show: function () {
            this.initModel("open")
        },

        // 对外暴露的隐藏方法
        hide: function () {
            this.initModel("close")
        },

        // 新增：切换显示汇总或明细
        switchDisplay: function (e) {
            const { type, index } = e.currentTarget.dataset;
            console.log('[Drawer] 切换显示:', { type, index });

            this.setData({
                currentDisplayType: type,
                currentDetailIndex: index
            });

            // 通知父组件切换显示
            this.triggerEvent('switchDisplay', { type, index });

            // 切换完成后自动关闭Drawer
            setTimeout(() => {
                this.initModel("close");
            }, 200);
        }
    }
})
