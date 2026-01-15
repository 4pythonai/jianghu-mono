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
        // 外部传入的用户列表数据
        USERS: {
            type: Array,
            value: []
        },
        // 红蓝配置参数
        redBlueConfig: {
            type: String,
            value: ''
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
            this.drag = this.selectComponent('#PlayersDragDrop');

            // 检查是否有数据
            if (!this.data.USERS || this.data.USERS.length === 0) {
                console.warn('PlayerDrag: 没有传入USERS数据');
                return;
            }

            // 防止重复初始化
            if (this.data.isInitialized) {
                return;
            }

            // 模仿异步加载数据
            setTimeout(() => {
                this.setData({
                    listData: this.data.USERS,
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
                    console.error("PlayerDrag drag component not found!");
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

    },

    lifetimes: {
        attached() {
            // 组件加载完成后自动初始化
            this.init();
        }
    },

    observers: {
        // 监听USERS属性变化
        'USERS': function (newUserList, oldUserList) {
            // 避免重复设置相同数据
            if (JSON.stringify(newUserList) === JSON.stringify(oldUserList)) {
                return;
            }

            if (newUserList && newUserList.length > 0) {
                // 直接更新listData，避免循环调用
                this.setData({
                    listData: newUserList,
                    isInitialized: false // 重置初始化标志
                });

                // 重新初始化拖拽组件
                if (this.drag) {
                    this.drag.init();

                }
            }
        }
    }
}); 