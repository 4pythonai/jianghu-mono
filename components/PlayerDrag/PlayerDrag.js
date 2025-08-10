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
        USERS: {
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

            // 延迟清理拖拽状态，确保动画完成
            setTimeout(() => {
                if (this.drag) {
                    this.drag.setData({
                        dragging: false
                    });
                    // 调用拖拽组件的状态同步方法
                    if (this.drag.syncDragEndState) {
                        this.drag.syncDragEndState();
                    }
                }
            }, 300);

            // 向父组件传递排序结果，延迟30ms执行
            setTimeout(() => {
                this.triggerEvent('sortend', {
                    listData: e.detail.listData
                });
            }, 30);
        },

        // 滚动事件
        scroll(e) {
            // 向父组件传递滚动位置
            this.triggerEvent('scroll', {
                scrollTop: e.detail.scrollTop
            });
        },

        // 拖拽状态变化事件
        onDragChange(e) {
            // 监听拖拽状态变化，确保状态同步
            if (this.drag) {
                this.drag.setData({
                    dragging: e.detail.dragging
                });
            }

            // 检测拖拽状态异常
            if (e.detail.dragging && this.dragErrorTimer) {
                clearTimeout(this.dragErrorTimer);
            }

            // 如果拖拽状态持续异常，自动恢复
            if (e.detail.dragging) {
                this.dragErrorTimer = setTimeout(() => {
                    console.warn('PlayerDrag: 拖拽状态异常，自动恢复');
                    this.handleDragError();
                }, 5000); // 5秒后自动恢复
            }
        },

        // 初始化组件
        init() {
            this.drag = this.selectComponent('#PlayersDragDrop');

            // 检查是否有数据
            if (!this.data.USERS || this.data.USERS.length === 0) {
                console.warn('PlayerDrag: 没有传入USERS数据');
                return;
            }

            // 预处理用户数据
            const processedUsers = this.preprocessUserData(this.data.USERS);
            if (processedUsers.length === 0) {
                console.error('PlayerDrag: 预处理后没有有效的用户数据');
                return;
            }

            // 防止重复初始化
            if (this.data.isInitialized) {
                return;
            }

            // 模仿异步加载数据
            setTimeout(() => {
                this.setData({
                    listData: processedUsers,
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

        // 更新球洞列表数据（手动更新方法）
        updateUserList(newUserList) {
            if (!newUserList || newUserList.length === 0) {
                console.warn('PlayerDrag: updateUserList 传入的数据为空');
                return;
            }

            // 直接设置数据，observers会自动处理后续逻辑
            this.setData({
                USERS: newUserList
            });
        },

        // 强制重置拖拽状态
        resetDragState() {
            if (this.drag) {
                // 重置拖拽组件的状态
                this.drag.setData({
                    dragging: false
                });

                // 重新初始化拖拽组件
                setTimeout(() => {
                    this.drag.init();
                    if (this.data.isModal) {
                        setTimeout(() => {
                            this.drag.initDom();
                        }, 200);
                    }
                }, 50);
            }
        },

        // 处理拖拽异常恢复
        handleDragError() {
            console.warn('PlayerDrag: 检测到拖拽异常，正在恢复...');
            this.resetDragState();
        },

        // 验证数据完整性
        validateData(data) {
            if (!Array.isArray(data)) {
                console.error('PlayerDrag: 数据不是数组格式');
                return false;
            }

            const invalidItems = data.filter(item => {
                return !item || typeof item !== 'object' || !item.nickname;
            });

            if (invalidItems.length > 0) {
                console.warn('PlayerDrag: 发现无效数据项:', invalidItems);
                return false;
            }

            return true;
        },

        // 预处理用户数据，确保格式正确
        preprocessUserData(users) {
            if (!Array.isArray(users)) {
                console.error('PlayerDrag: 用户数据不是数组格式');
                return [];
            }

            return users.map((user, index) => {
                if (!user || typeof user !== 'object') {
                    console.warn('PlayerDrag: 跳过无效用户数据:', user);
                    return null;
                }

                // 确保必要的字段存在
                const processedUser = {
                    ...user,
                    // 用户ID字段，优先使用userid
                    userid: user.userid || user.id || user.hindex || `user_${index}`,
                    // 用户昵称
                    nickname: user.nickname || user.wx_nickname || user.name || '未知玩家',
                    // 用户头像
                    avatar: user.avatar || user.headimgurl || '/images/default-avatar.png',
                    // 原始索引
                    originalIndex: index
                };

                return processedUser;
            }).filter(user => user !== null);
        }
    },

    lifetimes: {
        attached() {
            // 组件加载完成后自动初始化
            this.init();
        },

        detached() {
            // 组件销毁时清理定时器
            if (this.dragErrorTimer) {
                clearTimeout(this.dragErrorTimer);
                this.dragErrorTimer = null;
            }
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
                // 预处理用户数据
                const processedUsers = this.preprocessUserData(newUserList);
                if (processedUsers.length === 0) {
                    console.error('PlayerDrag: 预处理后没有有效的用户数据');
                    return;
                }

                // 重置初始化标志
                this.setData({
                    isInitialized: false
                });

                // 延迟更新数据，确保组件状态正确重置
                setTimeout(() => {
                    this.setData({
                        listData: processedUsers
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
                }, 100);
            }
        }
    }
}); 