const listData = [
    { hindex: 0, holename: "A1" },
    { hindex: 1, holename: "A2" },
    { hindex: 2, holename: "A3" },
    { hindex: 3, holename: "A4" },
    { hindex: 4, holename: "A5" },
    { hindex: 5, holename: "A6" },
    { hindex: 6, holename: "A7" },
    { hindex: 7, holename: "A8" },
    { hindex: 8, holename: "A9" },
    { hindex: 9, holename: "B1" },
    { hindex: 10, holename: "B2" },
    { hindex: 11, holename: "B3" },
    { hindex: 12, holename: "B4" },
    { hindex: 13, holename: "B5" },
    { hindex: 14, holename: "B6" },
    { hindex: 15, holename: "B7" },
    { hindex: 16, holename: "B8" },
    { hindex: 17, holename: "B9" }
];

Component({
    properties: {
        // 外部传入的滚动位置
        scrollTop: {
            type: Number,
            value: 0
        },
        // 是否在弹框中使用
        isModal: {
            type: Boolean,
            value: false
        }
    },

    data: {
        listData: [],
        extraNodes: []
    },

    methods: {
        // 拖拽排序结束事件
        sortEnd(e) {
            console.log("HolesDrag sortEnd", e.detail.listData);
            this.setData({
                listData: e.detail.listData
            });
            // 向父组件传递排序结果
            this.triggerEvent('sortend', {
                listData: e.detail.listData
            });
        },

        // 滚动事件
        scroll(e) {
            // 向父组件传递滚动位置
            this.triggerEvent('scroll', {
                scrollTop: e.detail.scrollTop
            });
        },

        // 初始化组件
        init() {
            this.drag = this.selectComponent('#holoJump');
            console.log("HolesDrag init, drag component:", this.drag);
            // 模仿异步加载数据
            setTimeout(() => {
                this.setData({
                    listData: listData
                });
                console.log("HolesDrag setData listData:", listData);
                if (this.drag) {
                    this.drag.init();
                    console.log("HolesDrag drag.init() called");

                    // 弹框内特殊处理：延迟重新初始化DOM信息
                    if (this.data.isModal) {
                        setTimeout(() => {
                            this.drag.initDom();
                            console.log("HolesDrag modal initDom() called");
                        }, 200);
                    }
                } else {
                    console.error("HolesDrag drag component not found!");
                }
            }, 100);
        },

        // 获取当前列表数据
        getListData() {
            return this.data.listData;
        },

        // 设置列表数据
        setListData(data) {
            this.setData({
                listData: data
            });
        }
    },

    lifetimes: {
        attached() {
            // 组件加载完成后自动初始化
            this.init();
        }
    }
}); 