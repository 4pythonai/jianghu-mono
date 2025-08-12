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
                // 打开Drawer
                this.setData({
                    model: true
                })
                // 触发打开事件
                this.triggerEvent('open')

            } else if (status === "close") {
                // 关闭Drawer
                this.setData({
                    model: false
                })
                // 触发关闭事件
                this.triggerEvent('close')
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

            // 切换显示后保持Drawer打开
            setTimeout(() => {
                this.initModel("close");
            }, 200);
        }
    }
})
