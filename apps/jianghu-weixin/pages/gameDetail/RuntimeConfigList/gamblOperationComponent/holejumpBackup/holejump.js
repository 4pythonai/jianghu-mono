import { gameStore } from '@/stores/game/gameStore';

const app = getApp();

Component({
    properties: {
        // 传入的 runtimeConfigs 列表
    },

    data: {
        // ===== 基础数据 =====
        holePlayList: [], // 完整的洞序列表
        originalHoleList: [], // 原始洞序列表，用于重置功能

        // ===== 拖拽状态数据 =====
        isDragging: false, // 是否正在拖拽
        currentDragIndex: -1, // 当前拖拽的索引
        currentInsertIndex: -1, // 当前的插入预览位置

        // ===== 网格配置 =====
        gridConfig: {
            itemSize: 45, // 每个球的大小(rpx)
            gap: 6, // 球之间的间距(rpx) - 再次减少以确保足够空间
            rowHeight: 65, // 行高度(rpx)
            columnsPerRow: 9 // 每行的列数，可以动态调整
        }
    },

    lifetimes: {
        attached() {
            // 初始化洞序列表
            const holeList = gameStore.gameData.holeList || [];
            console.log('🏌️ [holejump] attached, holeList.length:', holeList.length);
            this.initHoleList(holeList);
        },

        detached() {
            // 清理定时器
            if (this._throttleTimer) {
                clearTimeout(this._throttleTimer);
                this._throttleTimer = null;
            }
            this._lastSwap = null;

            this.storeBindings?.destroyStoreBindings();
        }
    },

    methods: {
        // ===== 初始化方法 =====

        /**
         * 初始化洞序列表
         * @param {Array} holeList - 原始洞序列表
         */
        initHoleList(holeList) {
            const holePlayList = holeList.map((hole, index) => {
                return {
                    hindex: hole.hindex,
                    holename: hole.holename,
                    originalIndex: index,
                    isDragging: false,
                    isInsertPreview: false,
                    x: 0, // 临时位置，等待动态计算
                    y: 0
                };
            });

            this.setData({
                holePlayList,
                originalHoleList: JSON.parse(JSON.stringify(holePlayList))
            });

            // 动态获取movable-area的实际宽度
            setTimeout(() => {
                this.calculatePositionsWithRealWidth(holeList);
            }, 100);

            console.log('🏌️ [holejump] 初始化完成，总洞数:', holeList.length);
        },

        /**
         * 动态获取容器宽度并计算位置
         */
        calculatePositionsWithRealWidth(holeList) {
            wx.createSelectorQuery().in(this)
                .select('.move-area')
                .boundingClientRect((rect) => {
                    if (!rect) {
                        console.error('🚨 无法获取move-area的尺寸');
                        return;
                    }

                    const areaWidth = rect.width;
                    const areaHeight = rect.height;

                    console.log('📏 move-area实际尺寸:', { width: areaWidth, height: areaHeight });

                    // 恢复到能正常工作的计算方式
                    const ballSize = 65; // 球本身大小（不含margin）
                    const ballsPerRow = 9;
                    const fixedRowHeight = 70;

                    // 使用之前能正常工作的计算方式
                    const availableWidth = areaWidth - 0; // 留20rpx边距
                    const spacingX = (availableWidth - ballSize * ballsPerRow) / (ballsPerRow - 1); // 球之间的间距

                    console.log('🎯 布局参数:', {
                        areaWidth,
                        availableWidth,
                        ballSize,
                        spacingX: spacingX.toFixed(1),
                        ballsPerRow
                    });

                    // 重新计算每个球的位置
                    const updatedHoleList = this.data.holePlayList.map((hole, index) => {
                        const row = Math.floor(index / ballsPerRow);
                        const col = index % ballsPerRow;
                        const x = 10 + col * (ballSize + spacingX); // 恢复之前的计算方式
                        const y = 10 + row * fixedRowHeight;



                        return {
                            ...hole,
                            x: Math.round(x),
                            y: Math.round(y)
                        };
                    });

                    this.setData({
                        holePlayList: updatedHoleList
                    });

                    console.log('🏌️ 位置计算完成:', updatedHoleList.slice(0, 9).map((item, index) =>
                        `${item.holename}(${item.x},${item.y})`));

                }).exec();
        },

        /**
         * 计算指定索引球的位置
         * @param {Number} index - 球索引
         * @returns {Object} 位置对象 {x, y}
         */
        calculateItemPosition(index) {
            const { itemSize, gap, rowHeight, columnsPerRow } = this.data.gridConfig;
            const row = Math.floor(index / columnsPerRow); // 动态每行列数
            const col = index % columnsPerRow;

            const x = col * (itemSize + gap);
            const y = row * rowHeight;

            return { x, y };
        },

        /**
         * 用指定配置计算位置
         * @param {Number} index - 球索引
         * @param {Object} gridConfig - 网格配置
         * @returns {Object} 位置对象 {x, y}
         */
        calculateItemPositionWithConfig(index, gridConfig) {
            const { itemSize, gap, rowHeight, columnsPerRow } = gridConfig;
            const row = Math.floor(index / columnsPerRow); // 动态每行列数
            const col = index % columnsPerRow;

            const x = col * (itemSize + gap);
            const y = row * rowHeight;

            return { x, y };
        },

        // ===== movable-view 事件处理 =====



        /**
         * 重排剩余球，填补被拖拽球的空位
         * @param {Number} dragIndex - 被拖拽的球索引
         */
        rearrangeRemainingBalls(dragIndex) {
            wx.createSelectorQuery().in(this)
                .select('.move-area')
                .boundingClientRect((rect) => {
                    if (!rect) return;

                    const { holePlayList } = this.data;

                    // 获取剩余球（排除被拖拽的球）
                    const remainingBalls = holePlayList.filter((_, index) => index !== dragIndex);

                    console.log(`🔄 重排剩余${remainingBalls.length}个球，排除球${dragIndex}`);

                    // 使用与初始化相同的布局参数
                    const ballSize = 65;
                    const ballsPerRow = 9;
                    const fixedRowHeight = 70;
                    const availableWidth = rect.width - 20;
                    const spacingX = (availableWidth - ballSize * ballsPerRow) / (ballsPerRow - 1);

                    // 为剩余球重新计算位置（保持原始顺序，跨行连续填充，y轴对齐）
                    const updatedHoleList = [...holePlayList];
                    let compactIndex = 0; // 紧凑排列的索引

                    // 遍历所有球，跳过被拖拽的球，为其他球重新分配连续位置
                    holePlayList.forEach((ball, originalIndex) => {
                        if (originalIndex === dragIndex) {
                            // 跳过被拖拽的球，稍后处理
                            return;
                        }

                        // 为剩余球计算新的连续位置（跨行填充）
                        const row = Math.floor(compactIndex / ballsPerRow);
                        const col = compactIndex % ballsPerRow;
                        const x = 10 + col * (ballSize + spacingX);
                        const y = 10 + row * fixedRowHeight; // 确保y轴严格按行对齐



                        // 更新位置
                        updatedHoleList[originalIndex] = {
                            ...updatedHoleList[originalIndex],
                            x: Math.round(x),
                            y: Math.round(y)
                        };

                        compactIndex++; // 下一个连续位置（跨行递增）
                    });

                    // 隐藏被拖拽的球（移到屏幕外）
                    updatedHoleList[dragIndex] = {
                        ...updatedHoleList[dragIndex],
                        x: -100, // 移到屏幕外
                        y: -100
                    };

                    this.setData({
                        holePlayList: updatedHoleList
                    });

                    // 调试：显示重排后的实际y坐标
                    console.log('✅ 重排完成，检查y轴对齐情况:');

                    const firstRowBalls = [];
                    const secondRowBalls = [];

                    updatedHoleList.forEach((ball, index) => {
                        if (index !== dragIndex && ball.y === 10) {
                            firstRowBalls.push(`${ball.holename}(y:${ball.y})`);
                        } else if (index !== dragIndex && ball.y === 80) {
                            secondRowBalls.push(`${ball.holename}(y:${ball.y})`);
                        } else if (index !== dragIndex) {
                            console.log(`❌ 异常y值: ${ball.holename} y=${ball.y}`);
                        }
                    });

                    console.log('🏠 第一行(y=10):', firstRowBalls.join(', '));
                    console.log('🏠 第二行(y=80):', secondRowBalls.join(', '));

                    // 验证是否所有球的y值都正确
                    const wrongYBalls = updatedHoleList.filter((ball, index) =>
                        index !== dragIndex && ball.y !== 10 && ball.y !== 80
                    );
                    if (wrongYBalls.length > 0) {
                        console.log('❌ y轴异常的球:', wrongYBalls.map(b => `${b.holename}(y:${b.y})`));
                    } else {
                        console.log('✅ 所有球的y轴都正确对齐！');
                    }
                }).exec();
        },

        /**
 * movable-view 位置变化事件
 * @param {Object} e - 事件对象
 */
        onMovableChange(e) {
            const { index } = e.currentTarget.dataset;
            const { x, y, source } = e.detail;

            // 如果是程序设置位置导致的change，完全忽略（不打印日志）
            if (source === 'out-of-bounds' || source === '' || source === undefined) {
                return;
            }

            const dragIndex = Number.parseInt(index);

            // 检测是否是新的拖拽开始

            if (!this.data.isDragging || this.data.currentDragIndex !== dragIndex) {
                console.log(`🎯 开始拖拽球${dragIndex} (${this.data.holePlayList[dragIndex].holename})`);

                // 标记拖拽状态
                this.setData({
                    [`holePlayList[${dragIndex}].isDragging`]: true,
                    isDragging: true,
                    currentDragIndex: dragIndex
                });

                // 重排剩余球（隐藏被拖拽的球，其他球补位）
                this.rearrangeRemainingBalls(dragIndex);
                return; // 第一次拖拽不进行位置计算
            }

            // 节流：减少插入预览计算频率
            if (this._throttleTimer) {
                clearTimeout(this._throttleTimer);
            }
            this._throttleTimer = setTimeout(() => {
                this.calculateInsertionPreview(x, y, dragIndex);
            }, 150);
        },

        /**
         * movable-view 触摸结束事件
         * @param {Object} e - 事件对象
         */
        onMovableTouchEnd(e) {
            const { index } = e.currentTarget.dataset;
            const dragIndex = Number.parseInt(index);
            const insertIndex = this.data.currentInsertIndex;

            console.log(`🏁 拖拽结束: 球${dragIndex} 插入到位置${insertIndex}`);

            // 清除节流定时器
            if (this._throttleTimer) {
                clearTimeout(this._throttleTimer);
                this._throttleTimer = null;
            }

            // 执行最终的插入操作
            this.performFinalInsertion(dragIndex, insertIndex);

            // 重置拖拽状态
            this.setData({
                [`holePlayList[${dragIndex}].isDragging`]: false,
                isDragging: false,
                currentDragIndex: -1,
                currentInsertIndex: -1
            });
        },

        // ===== 插入预览和位置计算逻辑 =====

        /**
         * 计算插入预览位置
         * @param {Number} x - 当前x坐标
         * @param {Number} y - 当前y坐标
         * @param {Number} dragIndex - 拖拽的索引
         */
        calculateInsertionPreview(x, y, dragIndex) {
            wx.createSelectorQuery().in(this)
                .select('.move-area')
                .boundingClientRect((rect) => {
                    if (!rect) return;

                    const ballSize = 65;
                    const ballsPerRow = 9;
                    const fixedRowHeight = 70;
                    const availableWidth = rect.width - 20;
                    const spacingX = (availableWidth - ballSize * ballsPerRow) / (ballsPerRow - 1);

                    // 计算目标插入位置（在17个重排后的球中）
                    const targetCol = Math.round((x - 10) / (ballSize + spacingX));
                    const targetRow = Math.round((y - 10) / fixedRowHeight);
                    const targetIndex = targetRow * ballsPerRow + targetCol;

                    // 限制在有效范围内（0-16，因为只有17个球）
                    const clampedIndex = Math.max(0, Math.min(16, targetIndex));

                    console.log(`📍 插入预览: 拖拽球${dragIndex} 到位置${clampedIndex}, 坐标(${x.toFixed(1)}, ${y.toFixed(1)})`);

                    // 保存当前插入位置
                    this.setData({ currentInsertIndex: clampedIndex });

                    // 为插入位置腾出空间
                    this.showInsertionGap(clampedIndex, dragIndex);
                }).exec();
        },

        /**
         * 为插入位置显示空隙
         * @param {Number} insertIndex - 插入位置（在17个球中的索引）
         * @param {Number} dragIndex - 被拖拽球的原始索引
         */
        showInsertionGap(insertIndex, dragIndex) {
            wx.createSelectorQuery().in(this)
                .select('.move-area')
                .boundingClientRect((rect) => {
                    if (!rect) return;

                    const { holePlayList } = this.data;
                    const ballSize = 65;
                    const ballsPerRow = 9;
                    const fixedRowHeight = 70;
                    const availableWidth = rect.width - 20;
                    const spacingX = (availableWidth - ballSize * ballsPerRow) / (ballsPerRow - 1);

                    const updatedHoleList = [...holePlayList];
                    let compactIndex = 0;

                    // 重新排列：在插入位置前的球保持原位，插入位置后的球后移一位
                    holePlayList.forEach((ball, originalIndex) => {
                        if (originalIndex === dragIndex) {
                            // 被拖拽的球保持隐藏
                            return;
                        }

                        // 如果到达插入位置，跳过一个位置（为插入留空）
                        if (compactIndex === insertIndex) {
                            compactIndex++;
                        }

                        const row = Math.floor(compactIndex / ballsPerRow);
                        const col = compactIndex % ballsPerRow;
                        const x = 10 + col * (ballSize + spacingX);
                        const y = 10 + row * fixedRowHeight;

                        updatedHoleList[originalIndex] = {
                            ...updatedHoleList[originalIndex],
                            x: Math.round(x),
                            y: Math.round(y)
                        };

                        compactIndex++;
                    });

                    // 保持被拖拽球隐藏
                    updatedHoleList[dragIndex] = {
                        ...updatedHoleList[dragIndex],
                        x: -100,
                        y: -100
                    };

                    this.setData({
                        holePlayList: updatedHoleList
                    });

                    console.log(`💫 已为位置${insertIndex}腾出空间`);
                }).exec();
        },

        /**
         * 执行最终的插入操作
         * @param {Number} dragIndex - 被拖拽球的原始索引
         * @param {Number} insertIndex - 插入位置（在17个球中的索引）
         */
        performFinalInsertion(dragIndex, insertIndex) {
            const { holePlayList } = this.data;

            // 获取被拖拽的球
            const draggedBall = holePlayList[dragIndex];

            // 创建新的顺序数组
            const newOrder = [];
            let compactIndex = 0;

            // 先添加非拖拽球到新顺序中，为插入位置预留空间
            holePlayList.forEach((ball, originalIndex) => {
                if (originalIndex !== dragIndex) {
                    // 如果到了插入位置，先插入被拖拽的球
                    if (compactIndex === insertIndex) {
                        newOrder.push(draggedBall);
                        compactIndex++;
                    }

                    // 然后添加当前球
                    newOrder.push(ball);
                    compactIndex++;
                }
            });

            // 如果插入位置在最后，添加被拖拽的球
            if (insertIndex >= newOrder.length - 1) {
                newOrder.push(draggedBall);
            }

            console.log('🔄 最终插入顺序:', newOrder.map(ball => ball.holename).join(', '));

            // 重新计算所有球的位置
            this.recalculateAllPositionsWithNewOrder(newOrder);
        },

        /**
         * 用新顺序重新计算所有位置
         * @param {Array} newOrder - 新的球顺序
         */
        recalculateAllPositionsWithNewOrder(newOrder) {
            wx.createSelectorQuery().in(this)
                .select('.move-area')
                .boundingClientRect((rect) => {
                    if (!rect) return;

                    const ballSize = 65;
                    const ballsPerRow = 9;
                    const fixedRowHeight = 70;
                    const availableWidth = rect.width - 20;
                    const spacingX = (availableWidth - ballSize * ballsPerRow) / (ballsPerRow - 1);

                    // 按新顺序重新计算位置
                    const updatedHoleList = newOrder.map((ball, index) => {
                        const row = Math.floor(index / ballsPerRow);
                        const col = index % ballsPerRow;
                        const x = 10 + col * (ballSize + spacingX);
                        const y = 10 + row * fixedRowHeight;

                        return {
                            ...ball,
                            x: Math.round(x),
                            y: Math.round(y),
                            isDragging: false,
                            isInsertPreview: false
                        };
                    });

                    this.setData({
                        holePlayList: updatedHoleList
                    });

                    console.log('✅ 最终排列完成！');
                }).exec();
        },

        /**
         * 根据当前位置计算目标位置
         * @param {Number} x - 当前x坐标
         * @param {Number} y - 当前y坐标
         * @param {Number} dragIndex - 拖拽的索引
         */
        calculateTargetPosition(x, y, dragIndex) {
            const { itemSize, gap, rowHeight, columnsPerRow } = this.data.gridConfig;

            // 计算网格位置
            const col = Math.round(x / (itemSize + gap));
            const row = Math.round(y / rowHeight);

            // 计算目标索引
            const targetIndex = row * columnsPerRow + col;

            console.log('目标位置计算:', { x, y, col, row, targetIndex, dragIndex, columnsPerRow });

            // 如果目标位置有效且不是当前位置
            if (targetIndex >= 0 && targetIndex < this.data.holePlayList.length && targetIndex !== dragIndex) {
                this.preparePositionSwap(dragIndex, targetIndex);
            }
        },

        /**
         * 准备位置交换
         * @param {Number} fromIndex - 起始索引
         * @param {Number} toIndex - 目标索引
         */
        preparePositionSwap(fromIndex, toIndex) {
            // 防止无意义的交换（自己和自己）
            if (fromIndex === toIndex) {
                return;
            }

            // 防止重复交换
            if (this._lastSwap && this._lastSwap.from === fromIndex && this._lastSwap.to === toIndex) {
                return;
            }
            this._lastSwap = { from: fromIndex, to: toIndex };

            const { holePlayList } = this.data;

            // 创建新的列表
            const newList = [...holePlayList];

            // 获取要交换的两个球
            const fromItem = newList[fromIndex];
            const toItem = newList[toIndex];

            // 交换位置
            const tempX = fromItem.x;
            const tempY = fromItem.y;

            fromItem.x = toItem.x;
            fromItem.y = toItem.y;
            toItem.x = tempX;
            toItem.y = tempY;

            // 更新列表
            this.setData({
                holePlayList: newList
            });

            console.log(`交换位置: ${fromIndex}(${fromItem.holename}) <-> ${toIndex}(${toItem.holename})`);
        },

        /**
         * 执行位置交换
         * @param {Number} dragIndex - 拖拽的索引
         */
        performPositionSwap(dragIndex) {
            // 重新计算所有球的位置，确保它们在正确的网格位置
            this.recalculateAllPositions();
        },

        /**
         * 重新计算所有球的位置
         */
        recalculateAllPositions() {
            // 重新获取容器宽度并重新计算
            wx.createSelectorQuery().in(this)
                .select('.move-area')
                .boundingClientRect((rect) => {
                    if (!rect) return;

                    const { holePlayList } = this.data;
                    const ballSize = 65;
                    const ballsPerRow = 9;
                    const fixedRowHeight = 70;
                    const availableWidth = rect.width - 20;
                    const spacingX = (availableWidth - ballSize * ballsPerRow) / (ballsPerRow - 1);

                    const newList = holePlayList.map((item, index) => {
                        const row = Math.floor(index / ballsPerRow);
                        const col = index % ballsPerRow;
                        const x = 10 + col * (ballSize + spacingX);
                        const y = 10 + row * fixedRowHeight;

                        return {
                            ...item,
                            x: Math.round(x),
                            y: Math.round(y),
                            isDragging: false,
                            isInsertPreview: false
                        };
                    });

                    this.setData({
                        holePlayList: newList
                    });
                }).exec();
        },

        // ===== 业务方法 =====

        /**
         * 重置到原始状态
         */
        onReset() {
            const originalList = this.data.originalHoleList.map((item, index) => {
                const position = this.calculateItemPosition(index);
                return {
                    ...item,
                    x: position.x,
                    y: position.y,
                    isDragging: false,
                    isInsertPreview: false
                };
            });

            this.setData({
                holePlayList: originalList
            });
        },

        /**
         * 完成跳洞设置
         */
        onJumpComplete() {
            // 这里可以触发事件，将结果传递给父组件
            this.triggerEvent('complete', {
                holePlayList: this.data.holePlayList
            });
            this.close();
        },

        // ===== 工具方法 =====

        /**
         * 关闭弹窗
         */
        close() {
            this.triggerEvent('close');
        },

        /**
         * 空方法，阻止冒泡
         */
        noop() { }
    }
});
