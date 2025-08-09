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
        userList: {
            type: Array,
            value: []
        },
        // 分组配置
        redBlueConfig: {
            type: String,
            value: '4_固拉'
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
            console.log('🎯 UserDrag sortEnd 接收到数据:', e.detail.listData);
            console.log('🔍 排序后用户顺序:', e.detail.listData.map((user, index) => `${index + 1}. ${user.wx_nickname || user.nickname || '未知'} (${user.userid})`));

            this.setData({
                listData: e.detail.listData
            });

            // 向父组件传递排序结果
            this.triggerEvent('sortend', {
                listData: e.detail.listData
            });

            console.log('📤 UserDrag 向父组件传递排序结果');
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
            this.drag = this.selectComponent('#userDrag');

            // 检查是否有数据
            if (!this.data.userList || this.data.userList.length === 0) {
                console.warn('UserDrag: 没有传入userList数据');
                return;
            }

            // 防止重复初始化
            if (this.data.isInitialized) {
                return;
            }

            // 模仿异步加载数据
            setTimeout(() => {
                this.setData({
                    listData: this.data.userList,
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
                    console.error("UserDrag drag component not found!");
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

        // 更新用户列表数据（手动更新方法）
        updateUserList(newUserList) {
            if (!newUserList || newUserList.length === 0) {
                console.warn('UserDrag: updateUserList 传入的数据为空');
                return;
            }

            // 直接设置数据，observers会自动处理后续逻辑
            this.setData({
                userList: newUserList
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
        // 监听userList属性变化
        'userList': function (newUserList, oldUserList) {

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

                // 只在非拖拽状态下重新初始化拖拽组件
                if (this.drag) {
                    const dragData = this.drag.data || {};
                    // 如果当前没有在拖拽，才重新初始化
                    if (!dragData.dragging) {
                        this.drag.init();
                        if (this.data.isModal) {
                            setTimeout(() => {
                                this.drag.initDom();
                            }, 200);
                        }
                    } else {
                        // 如果正在拖拽，只更新数据，不重新初始化
                        console.log('UserDrag: 拖拽进行中，跳过重新初始化');
                    }
                }
            }
        }
    }
});