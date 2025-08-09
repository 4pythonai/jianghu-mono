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
        innerUserList: [],      // 内部用户列表（重命名避免冲突）
        systemInfo: null        // 系统信息
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

            // 获取系统信息
            try {
                const systemInfo = wx.getSystemInfoSync();
                console.log('📱 系统信息:', systemInfo);

                // 计算精确的item高度 (rpx转px)
                const itemHeightRpx = 84; // 压缩后的item高度估算
                const itemHeightPx = (itemHeightRpx * systemInfo.windowWidth) / 750;

                this.setData({
                    systemInfo: systemInfo,
                    itemHeight: itemHeightPx,
                    innerUserList: [...(this.properties.userList || [])]
                });

                console.log('📏 计算后的itemHeight:', itemHeightPx);
            } catch (e) {
                console.error('获取系统信息失败:', e);
                // fallback
                this.setData({
                    innerUserList: [...(this.properties.userList || [])]
                });
            }
        }
    },

    methods: {
        // 长按开始拖拽
        onLongPress(e) {
            const index = e.currentTarget.dataset.index;
            const touch = e.touches[0];

            console.log('🔥 开始拖拽，索引:', index);

            // 重置节流和防抖状态
            this.moveThrottle = false;
            this.lastSwapTarget = null;

            // 获取实际的item高度
            this.measureItemHeight(index, () => {
                this.setData({
                    draggingIndex: index,
                    startY: touch.clientY,
                    dragOffsetY: 0
                });
            });

            // 震动反馈
            wx.vibrateShort();
        },

        // 测量item实际高度
        measureItemHeight(index, callback) {
            const query = this.createSelectorQuery();
            query.select(`.user-item:nth-child(${index + 1})`).boundingClientRect();
            query.exec((res) => {
                if (res && res[0] && res[0].height) {
                    const actualHeight = res[0].height;
                    console.log(`📐 实际测量的item高度: ${actualHeight}px`);
                    this.setData({
                        itemHeight: actualHeight
                    });
                }
                callback && callback();
            });
        },

        // 拖拽移动
        onTouchMove(e) {
            if (this.data.draggingIndex === -1) return;

            // 阻止默认滚动行为
            e.preventDefault && e.preventDefault();

            const touch = e.touches[0];
            let offsetY = touch.clientY - this.data.startY;

            // 使用系统信息进行坐标标准化
            if (this.data.systemInfo) {
                const pixelRatio = this.data.systemInfo.pixelRatio || 1;
                offsetY = offsetY / pixelRatio * pixelRatio; // 标准化坐标
            }

            // 限制拖拽范围，避免过度拖拽
            const maxOffset = this.data.itemHeight * (this.data.innerUserList.length - this.data.draggingIndex);
            const minOffset = -this.data.itemHeight * this.data.draggingIndex;
            offsetY = Math.max(minOffset, Math.min(maxOffset, offsetY));

            // 使用更高频率但轻量的更新
            this.setData({
                dragOffsetY: offsetY
            });

            // 计算目标位置 - 使用更精确的计算
            const moveDistance = Math.abs(offsetY);
            const itemHeight = this.data.itemHeight;
            const threshold = itemHeight * 0.5; // 降低阈值，提高响应性

            if (moveDistance > threshold) {
                const direction = offsetY > 0 ? 1 : -1;
                const targetIndex = this.data.draggingIndex + direction;

                // 检查目标位置是否有效，并防止重复交换
                if (targetIndex >= 0 &&
                    targetIndex < this.data.innerUserList.length &&
                    targetIndex !== this.lastSwapTarget) {

                    this.lastSwapTarget = targetIndex;
                    console.log(`🔄 准备交换: ${this.data.draggingIndex} → ${targetIndex}`);
                    this.swapItems(this.data.draggingIndex, targetIndex);
                }
            }
        },

        // 拖拽结束
        onTouchEnd(e) {
            if (this.data.draggingIndex === -1) return;

            console.log('✋ 拖拽结束');

            // 清理状态
            this.moveThrottle = false;
            this.lastSwapTarget = null;

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