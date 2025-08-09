Component({
    properties: {
        userList: {
            type: Array,
            value: []
        }
    },

    data: {
        draggingIndex: -1,
        startY: 0,
        currentUserList: [],
        extraNodes: [],
        scrollTop: 0
    },

    observers: {
        'userList': function (newUserList) {
            this.setData({
                currentUserList: newUserList || []
            });
        }
    },

    lifetimes: {
        attached() {
            this.setData({
                currentUserList: this.properties.userList || []
            });
        }
    },

    methods: {
        // 拖拽排序结束事件 (来自DragComponent)
        sortEnd(e) {
            console.log('🎯 UserDrag sortEnd 事件触发');
            console.log('  - e.detail.userList:', e.detail.userList);

            this.setData({
                currentUserList: e.detail.userList
            });

            // 向父组件传递排序结果
            this.triggerEvent('sortend', {
                listData: e.detail.userList
            });
        },

        // 长按开始拖拽
        onLongPress(e) {
            const index = e.currentTarget.dataset.index;

            console.log('🔥 开始拖拽，索引:', index);

            this.setData({
                draggingIndex: index,
                startY: e.touches[0].clientY
            });

            wx.vibrateShort();
        },

        // 拖拽移动
        onTouchMove(e) {
            if (this.data.draggingIndex === -1) return;

            const offsetY = e.touches[0].clientY - this.data.startY;
            const itemHeight = 84; // 固定高度

            // 简单的位置交换逻辑
            if (Math.abs(offsetY) > itemHeight * 0.5) {
                const direction = offsetY > 0 ? 1 : -1;
                const targetIndex = this.data.draggingIndex + direction;

                if (targetIndex >= 0 && targetIndex < this.data.currentUserList.length) {
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
                startY: 0
            });

            // 触发排序完成事件
            this.triggerEvent('sortend', {
                listData: this.data.currentUserList
            });
        },

        // 交换两个项目
        swapItems(fromIndex, toIndex) {
            const list = [...this.data.currentUserList];
            const temp = list[fromIndex];
            list[fromIndex] = list[toIndex];
            list[toIndex] = temp;

            console.log(`🔄 交换位置: ${fromIndex} ↔ ${toIndex}`);

            this.setData({
                currentUserList: list,
                draggingIndex: toIndex,
                startY: this.data.startY + (toIndex - fromIndex) * 84
            });
        }
    }
});