Component({
    properties: {
        userList: {
            type: Array,
            value: []
        }
    },

    data: {
        draggingIndex: -1,      // 当前拖拽的项目索引
        dragOffsetY: 0,         // 拖拽偏移量
        startY: 0,              // 开始拖拽的Y坐标
        itemHeight: 120,        // 每个项目的高度（rpx转px大约除以2）
        innerUserList: []       // 内部用户列表（重命名避免冲突）
    },

    observers: {
        'userList': function (newUserList) {
            // 当外部传入的userList变化时，同步到内部
            if (newUserList && newUserList.length > 0) {
                console.log('👀 UserDrag 外部userList 更新:', newUserList);
                this.setData({
                    innerUserList: [...newUserList]
                });
            }
        }
    },

    lifetimes: {
        attached() {
            console.log('🚀 UserDrag 组件 attached');
            console.log('  - userList:', this.properties.userList);
            // 初始化内部userList
            this.setData({
                innerUserList: [...(this.properties.userList || [])]
            });
        }
    },

    methods: {
        // 长按开始拖拽
        onLongPress(e) {
            const index = e.currentTarget.dataset.index;
            const touch = e.touches[0];

            console.log('🔥 开始拖拽，索引:', index);

            this.setData({
                draggingIndex: index,
                startY: touch.clientY,
                dragOffsetY: 0
            });

            // 震动反馈
            wx.vibrateShort();
        },

        // 拖拽移动
        onTouchMove(e) {
            if (this.data.draggingIndex === -1) return;

            const touch = e.touches[0];
            const offsetY = touch.clientY - this.data.startY;

            this.setData({
                dragOffsetY: offsetY
            });

            // 计算目标位置
            const moveDistance = Math.abs(offsetY);
            const itemHeight = this.data.itemHeight;

            if (moveDistance > itemHeight / 2) {
                const direction = offsetY > 0 ? 1 : -1; // 向下为正，向上为负
                const targetIndex = this.data.draggingIndex + direction;

                // 检查目标位置是否有效
                if (targetIndex >= 0 && targetIndex < this.data.innerUserList.length) {
                    this.swapItems(this.data.draggingIndex, targetIndex);
                }
            }
        },

        // 拖拽结束
        onTouchEnd(e) {
            if (this.data.draggingIndex === -1) return;

            console.log('✋ 拖拽结束');

            this.setData({
                draggingIndex: -1,
                dragOffsetY: 0,
                startY: 0
            });

            // 触发排序完成事件
            this.triggerEvent('sortend', {
                listData: this.data.innerUserList
            });
        },

        // 交换两个项目的位置
        swapItems(fromIndex, toIndex) {
            const userList = [...this.data.innerUserList];
            const temp = userList[fromIndex];
            userList[fromIndex] = userList[toIndex];
            userList[toIndex] = temp;

            console.log(`🔄 交换位置: ${fromIndex} ↔ ${toIndex}`);

            this.setData({
                innerUserList: userList,
                draggingIndex: toIndex, // 更新拖拽索引
                startY: this.data.startY + (toIndex - fromIndex) * this.data.itemHeight,
                dragOffsetY: 0
            });
        },

        // 用户项点击事件
        onUserTap(e) {
            if (this.data.draggingIndex !== -1) return; // 拖拽时不响应点击

            const index = e.currentTarget.dataset.index;
            const user = this.data.innerUserList[index];
            console.log('👤 点击用户:', user);
        }
    }
});