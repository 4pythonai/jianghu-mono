Component({
    properties: {
        // 用户列表数据
        userList: {
            type: Array,
            value: []
        },
        // 是否禁用拖拽
        disabled: {
            type: Boolean,
            value: false
        }
    },

    data: {
        // 当前用户列表（用于拖拽排序）
        currentUserList: [],
        // 拖拽状态
        dragging: false,
        // 拖拽的索引
        draggingIndex: -1,
        // 拖拽开始位置
        startY: 0,
        // 拖拽开始时间
        startTime: 0,
        // 长按定时器
        longPressTimer: null
    },

    observers: {
        'userList': function (newUserList) {
            console.log('🔄 UserDrag userList 变化:', newUserList);
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
        /**
         * 触摸开始
         */
        onTouchStart(e) {
            if (this.properties.disabled) return;

            const index = e.currentTarget.dataset.index;
            const item = this.data.currentUserList[index];

            // 检查是否允许拖拽
            if (item?.fixed) return;

            // 清除之前的长按定时器
            if (this.data.longPressTimer) {
                clearTimeout(this.data.longPressTimer);
            }

            // 设置长按定时器
            const timer = setTimeout(() => {
                this.startDrag(e, index);
            }, 500);

            this.setData({
                longPressTimer: timer,
                startY: e.touches[0].clientY,
                startTime: Date.now()
            });
        },

        /**
         * 触摸移动
         */
        onTouchMove(e) {
            if (!this.data.dragging || this.data.draggingIndex === -1) return;

            const currentY = e.touches[0].clientY;
            const offsetY = currentY - this.data.startY;
            const itemHeight = 84; // 固定高度

            // 计算目标位置
            if (Math.abs(offsetY) > itemHeight * 0.3) {
                const direction = offsetY > 0 ? 1 : -1;
                const targetIndex = this.data.draggingIndex + direction;

                if (targetIndex >= 0 && targetIndex < this.data.currentUserList.length) {
                    this.swapItems(this.data.draggingIndex, targetIndex);
                }
            }
        },

        /**
         * 触摸结束
         */
        onTouchEnd(e) {
            // 清除长按定时器
            if (this.data.longPressTimer) {
                clearTimeout(this.data.longPressTimer);
                this.setData({ longPressTimer: null });
            }

            if (!this.data.dragging) return;

            console.log('✋ 拖拽结束');

            this.setData({
                dragging: false,
                draggingIndex: -1,
                startY: 0,
                startTime: 0
            });

            // 触发排序完成事件
            this.triggerEvent('sortend', {
                listData: this.data.currentUserList
            });
        },

        /**
         * 开始拖拽
         */
        startDrag(e, index) {
            console.log('🔥 开始拖拽，索引:', index);

            this.setData({
                dragging: true,
                draggingIndex: index,
                longPressTimer: null
            });

            // 震动反馈
            wx.vibrateShort();
        },

        /**
         * 交换两个项目
         */
        swapItems(fromIndex, toIndex) {
            if (fromIndex === toIndex) return;

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
        },

        /**
         * 用户项点击事件
         */
        onItemClick(e) {
            // 如果正在拖拽，不触发点击事件
            if (this.data.dragging) return;

            const { itemData, index } = e.detail;
            this.triggerEvent('itemclick', {
                itemData,
                index
            });
        },

        /**
         * 空事件处理方法（用于条件性禁用事件）
         */
        noTap() {
            return;
        }
    }
});