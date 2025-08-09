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
        },
        // 外部传入的球洞列表数据
        holeList: {
            type: Array,
            value: []
        }
    },

    data: {
        listData: [],
        extraNodes: [],
        isInitialized: false
    },

    methods: {
        // 拖拽排序结束事件
        sortEnd(e) {
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

            // 检查是否有数据
            if (!this.data.holeList || this.data.holeList.length === 0) {
                console.warn('HolesDrag: 没有传入holeList数据');
                return;
            }

            // 防止重复初始化
            if (this.data.isInitialized) {
                return;
            }

            // 模仿异步加载数据
            setTimeout(() => {
                this.setData({
                    listData: this.data.holeList,
                    isInitialized: true
                });
                if (this.drag) {
                    this.drag.init();

                    // 弹框内特殊处理：延迟重新初始化DOM信息
                    if (this.data.isModal) {
                        setTimeout(() => {
                            this.drag.initDom();
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
        },

        // 更新球洞列表数据（手动更新方法）
        updateHoleList(newHoleList) {
            if (!newHoleList || newHoleList.length === 0) {
                console.warn('HolesDrag: updateHoleList 传入的数据为空');
                return;
            }

            // 直接设置数据，observers会自动处理后续逻辑
            this.setData({
                holeList: newHoleList
            });
        }
    },

    lifetimes: {
        attached() {
            // 组件加载完成后自动初始化
            this.init();
        }
    },

    observers: {
        // 监听holeList属性变化
        'holeList': function (newHoleList, oldHoleList) {

            // 避免重复设置相同数据
            if (JSON.stringify(newHoleList) === JSON.stringify(oldHoleList)) {
                return;
            }

            if (newHoleList && newHoleList.length > 0) {
                // 直接更新listData，避免循环调用
                this.setData({
                    listData: newHoleList,
                    isInitialized: false // 重置初始化标志
                });

                // 重新初始化拖拽组件
                if (this.drag) {
                    this.drag.init();
                    if (this.data.isModal) {
                        setTimeout(() => {
                            this.drag.initDom();
                        }, 200);
                    }
                }
            }
        }
    }
}); 