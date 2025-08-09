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
        longPressTimer: null,
        // 宽度相关数据
        containerWidth: 0,
        itemWidth: 0,
        itemHeight: 84
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
            // 初始化时获取宽度信息
            this.initWidth();
        }
    },

    methods: {
        /**
         * 初始化宽度信息
         */
        initWidth() {
            const query = this.createSelectorQuery();
            query.select('.user-drag-container').boundingClientRect();
            query.select('.user-item').boundingClientRect();
            query.exec((res) => {
                if (res[0] && res[1]) {
                    this.setData({
                        containerWidth: res[0].width,
                        itemWidth: res[1].width,
                        itemHeight: res[1].height || 84
                    });
                }
            });
        },

        /**
         * 获取容器宽度
         */
        getContainerWidth() {
            return this.data.containerWidth;
        },

        /**
         * 获取项目宽度
         */
        getItemWidth() {
            return this.data.itemWidth;
        },

        /**
         * 获取项目高度
         */
        getItemHeight() {
            return this.data.itemHeight;
        },

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
            const itemHeight = this.data.itemHeight;

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

            this.setData({
                currentUserList: list,
                draggingIndex: toIndex,
                startY: this.data.startY + (toIndex - fromIndex) * this.data.itemHeight
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