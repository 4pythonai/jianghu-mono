import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';
// import { toJS } from 'mobx-miniprogram';

const app = getApp();

Component({
    properties: {
        // 传入的 runtimeConfigs 列表
    },

    data: {
        isDragging: false,
        dragStartIndex: -1,
        dragStartPosition: { x: 0, y: 0 },
        dragOffset: { x: 0, y: 0 },
        originalHoleList: [],
        lastUpdateTime: 0,
        pickedItem: null,
        pickedItemPosition: { x: 0, y: 0 },
        dragStartTime: 0
    },

    lifetimes: {
        attached() {
            // 绑定 mobx store
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameData'],
                actions: []
            });

            // 初始化洞序列表
            const holeList = gameStore.gameData.holeList || [];
            console.log('=== 原始洞序数据 ===');
            console.log('gameStore.gameData.holeList:', holeList);
            holeList.forEach((item, index) => {
                console.log(`原始第${index + 1}洞:`, item);
            });
            console.log('==================');

            const processedList = holeList.map((item, index) => ({
                ...item,
                isDragging: false,
                isInsertPreview: false,
                originalIndex: index
            }));

            this.setData({
                holePlayList: processedList,
                originalHoleList: JSON.parse(JSON.stringify(processedList))
            });
        },

        detached() {
            this.storeBindings?.destroyStoreBindings();
        }
    },

    methods: {
        // 触摸开始
        onTouchStart(e) {
            // 如果已经在拖拽中，先重置状态
            if (this.data.isDragging) {
                this.resetDragState();
            }

            const touch = e.touches[0];
            const index = e.currentTarget.dataset.index;

            console.log('Touch start - index:', index, 'position:', touch.clientX, touch.clientY);

            this.setData({
                isDragging: true,
                dragStartIndex: index,
                dragStartPosition: { x: touch.clientX, y: touch.clientY },
                dragOffset: { x: 0, y: 0 },
                pickedItemPosition: { x: touch.clientX, y: touch.clientY }, // 直接使用触摸位置
                dragStartTime: Date.now()
            });

            // 开始拖拽时，重新排列其他球，填补空缺
            this.rearrangeOnPickup(index);
        },

        // 触摸移动
        onTouchMove(e) {
            if (!this.data.isDragging) return;

            const touch = e.touches[0];
            const offsetX = touch.clientX - this.data.dragStartPosition.x;
            const offsetY = touch.clientY - this.data.dragStartPosition.y;

            // 限制拖拽范围在球区内
            const limitedOffset = this.limitDragRange(offsetX, offsetY);

            this.setData({
                dragOffset: limitedOffset
            });

            // 节流更新插入预览，避免过多调用
            const now = Date.now();
            if (now - this.data.lastUpdateTime > 100) { // 100ms节流
                this.updateInsertPreview(touch.clientX, touch.clientY);
                this.setData({ lastUpdateTime: now });
            }

            // 超时保护：如果拖拽时间过长，自动重置
            const dragDuration = now - this.data.dragStartTime;
            if (dragDuration > 10000) { // 10秒超时
                console.warn('Drag timeout, resetting state');
                this.resetDragState();
            }
        },

        // 触摸结束
        onTouchEnd(e) {
            if (!this.data.isDragging) return;

            const touch = e.changedTouches[0];
            console.log('Touch end at:', touch.clientX, touch.clientY);

            this.getTargetIndex(touch.clientX, touch.clientY).then(targetIndex => {
                console.log('Target index:', targetIndex);

                if (targetIndex !== -1) {
                    console.log('Inserting picked item at index:', targetIndex);
                    this.insertOnDrop(targetIndex);
                } else {
                    // 如果没有找到目标位置，恢复到原始状态
                    this.restoreOriginalOrder();
                }

                // 重置拖拽状态
                this.resetDragState();
            }).catch(error => {
                console.error('Error in touch end:', error);
                // 发生错误时也要重置状态
                this.resetDragState();
            });
        },

        // 获取目标位置索引 - 检测插入位置
        getTargetIndex(clientX, clientY) {
            return new Promise((resolve) => {
                const query = this.createSelectorQuery();
                query.selectAll('.hole-item').boundingClientRect((rects) => {
                    if (!rects || rects.length === 0) {
                        resolve(-1);
                        return;
                    }

                    // 过滤掉预览球，只保留真实的球
                    const realRects = [];
                    const currentList = this.data.holePlayList;

                    // 确保 rects 和 currentList 的索引对应
                    for (let i = 0; i < rects.length && i < currentList.length; i++) {
                        if (!currentList[i].isInsertPreview) {
                            realRects.push(rects[i]);
                        }
                    }

                    console.log('Real rects count:', realRects.length, 'Current list count:', currentList.length);
                    console.log('Current list items:', currentList.map(item => ({ holename: item.holename, isPreview: item.isInsertPreview })));

                    if (realRects.length === 0) {
                        resolve(-1);
                        return;
                    }

                    // 检测插入位置：球之间的间隙
                    for (let i = 0; i <= realRects.length; i++) {
                        let insertX;
                        let insertY;

                        if (i === 0) {
                            // 第一个球之前 - 使用球的左边缘作为插入位置
                            const firstRect = realRects[0];
                            insertX = firstRect.left;
                            insertY = firstRect.top + firstRect.height / 2;
                        } else if (i === realRects.length) {
                            // 最后一个球之后 - 使用球的右边缘作为插入位置
                            const lastRect = realRects[realRects.length - 1];
                            insertX = lastRect.right;
                            insertY = lastRect.top + lastRect.height / 2;
                        } else {
                            // 两个球之间
                            const prevRect = realRects[i - 1];
                            const nextRect = realRects[i];
                            insertX = (prevRect.right + nextRect.left) / 2;
                            insertY = (prevRect.top + nextRect.bottom) / 2;
                        }

                        const distance = Math.sqrt(
                            (clientX - insertX) ** 2 + (clientY - insertY) ** 2
                        );

                        if (distance < 80) { // 进一步增大检测范围，确保边界位置也能被检测到
                            console.log(`Insert position ${i} detected at (${insertX}, ${insertY}), distance: ${distance}`);
                            console.log(`Touch position: (${clientX}, ${clientY})`);
                            resolve(i);
                            return;
                        }
                    }

                    resolve(-1);
                }).exec();
            });
        },

        // 更新插入位置预览
        updateInsertPreview(clientX, clientY) {
            this.getTargetIndex(clientX, clientY).then(targetIndex => {
                // 先清除所有预览球
                const cleanList = this.data.holePlayList.filter(item => !item.isInsertPreview);

                if (targetIndex !== -1) {
                    // 在目标位置插入预览球
                    const previewItem = {
                        holename: '',
                        isInsertPreview: true,
                        isDragging: false,
                        isPicked: false,
                        originalIndex: targetIndex
                    };

                    cleanList.splice(targetIndex, 0, previewItem);

                    // 更新所有球的索引
                    for (let i = 0; i < cleanList.length; i++) {
                        cleanList[i].originalIndex = i;
                    }

                    this.setData({ holePlayList: cleanList });

                    console.log('Preview inserted at index:', targetIndex, 'Total items:', cleanList.length);
                } else {
                    // 没有目标位置，只清除预览
                    for (let i = 0; i < cleanList.length; i++) {
                        cleanList[i].originalIndex = i;
                    }
                    this.setData({ holePlayList: cleanList });
                }
            });
        },

        // 限制拖拽范围在球区内
        limitDragRange(offsetX, offsetY) {
            // 获取球区的边界 - 增大范围以支持拖拽到边界位置
            const maxOffsetX = 400; // 增大范围，支持拖拽到最左/最右
            const maxOffsetY = 300; // 增大范围，支持拖拽到最上/最下

            return {
                x: Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX)),
                y: Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY))
            };
        },

        // 重置拖拽状态
        resetDragState() {
            console.log('Resetting drag state');

            // 清除所有预览效果
            this.clearAllPreviews();

            // 重置拖拽状态
            this.setData({
                isDragging: false,
                dragStartIndex: -1,
                dragStartPosition: { x: 0, y: 0 },
                dragOffset: { x: 0, y: 0 },
                pickedItem: null,
                pickedItemPosition: { x: 0, y: 0 }
            });
        },

        // 清除所有预览效果
        clearAllPreviews() {
            const holePlayList = this.data.holePlayList.filter(item => !item.isInsertPreview);
            for (let i = 0; i < holePlayList.length; i++) {
                holePlayList[i].originalIndex = i;
            }
            this.setData({ holePlayList });
        },

        // 拿起球时重新排列其他球
        rearrangeOnPickup(pickupIndex) {
            const holePlayList = [...this.data.holePlayList];
            const pickedItem = holePlayList[pickupIndex];

            console.log('Picking up item at index:', pickupIndex, 'Total items before:', holePlayList.length);
            console.log('Original list:', holePlayList.map(item => item.holename));

            // 标记被拖拽的球
            pickedItem.isDragging = true;
            pickedItem.isPicked = true;

            // 重新排列其他球，填补空缺
            const rearrangedList = [];
            for (let i = 0; i < holePlayList.length; i++) {
                if (i !== pickupIndex) {
                    const item = { ...holePlayList[i] };
                    item.isDragging = false;
                    item.isPicked = false;
                    item.isInsertPreview = false;
                    rearrangedList.push(item);
                }
            }

            // 更新索引
            rearrangedList.forEach((item, index) => {
                item.originalIndex = index;
            });

            console.log('Rearranged list length:', rearrangedList.length);
            console.log('Rearranged list:', rearrangedList.map(item => item.holename));

            this.setData({
                holePlayList: rearrangedList,
                pickedItem: pickedItem
            });
        },

        // 放下球时插入到目标位置
        insertOnDrop(targetIndex) {
            const currentList = [...this.data.holePlayList];
            const pickedItem = this.data.pickedItem;

            if (!pickedItem) {
                console.warn('No picked item found, restoring original order');
                this.restoreOriginalOrder();
                return;
            }

            console.log('InsertOnDrop - targetIndex:', targetIndex, 'currentList length:', currentList.length);
            console.log('Current list before cleanup:', currentList.map(item => item.holename || 'PREVIEW'));

            // 移除预览球
            const cleanList = currentList.filter(item => !item.isInsertPreview);

            console.log('Clean list after filter:', cleanList.map(item => item.holename));

            // 验证数据完整性
            const originalCount = this.data.originalHoleList.length;
            const expectedCount = originalCount; // 应该保持原始数量

            if (cleanList.length !== expectedCount) {
                console.warn(`Data integrity check failed: expected ${expectedCount}, got ${cleanList.length}`);
                console.warn('Restoring original order to prevent data loss');
                this.restoreOriginalOrder();
                return;
            }

            // 确保目标索引在有效范围内
            const validIndex = Math.max(0, Math.min(targetIndex, cleanList.length));

            // 在目标位置插入被拖拽的球
            cleanList.splice(validIndex, 0, {
                ...pickedItem,
                isDragging: false,
                isPicked: false,
                isInsertPreview: false
            });

            // 更新所有球的索引
            for (let i = 0; i < cleanList.length; i++) {
                cleanList[i].originalIndex = i;
            }

            // 最终验证
            if (cleanList.length !== originalCount + 1) {
                console.error(`Final count mismatch: expected ${originalCount + 1}, got ${cleanList.length}`);
                this.restoreOriginalOrder();
                return;
            }

            console.log('Final list after insert:', cleanList.map(item => item.holename));
            console.log('Inserted item at index:', validIndex, 'Total items:', cleanList.length);

            this.setData({
                holePlayList: cleanList,
                pickedItem: null
            });
        },

        // 移动洞的位置（保留原方法用于兼容）
        moveHole(fromIndex, toIndex) {
            const holePlayList = [...this.data.holePlayList];
            const movedItem = holePlayList[fromIndex];

            // 移除原位置的球
            holePlayList.splice(fromIndex, 1);

            // 在目标位置插入球
            holePlayList.splice(toIndex, 0, movedItem);

            // 更新索引
            holePlayList.forEach((item, index) => {
                item.originalIndex = index;
            });

            this.setData({ holePlayList });
        },

        // 恢复原始顺序（当拖拽失败时）
        restoreOriginalOrder() {
            // 直接恢复到原始状态，不进行任何插入操作
            const resetList = this.data.originalHoleList.map((item, index) => ({
                ...item,
                isDragging: false,
                isPicked: false,
                isInsertPreview: false,
                originalIndex: index
            }));

            this.setData({
                holePlayList: resetList,
                pickedItem: null
            });
        },

        // 重置到原始顺序
        onReset() {
            // 按照 hindex 排序
            const sortedList = [...this.data.originalHoleList].sort((a, b) => {
                return (a.hindex || 0) - (b.hindex || 0);
            });

            const resetList = sortedList.map((item, index) => ({
                ...item,
                isDragging: false,
                isInsertPreview: false,
                originalIndex: index
            }));

            this.setData({
                holePlayList: resetList,
                pickedItem: null
            });
        },

        // 确定按钮点击
        async onJumpComplete() {


            console.log("gameid", gameStore.gameid);
            const res = await app.api.gamble.changeStartHole({
                gameid: gameStore.gameid,
                holeList: this.data.holePlayList
            })

            console.log("res", res);
            if (res.code === 200) {
                wx.showToast({
                    title: '跳洞设置成功',
                    icon: 'success'
                })
                await gameStore.fetchGameDetail(gameStore.gameid, gameStore.groupid);
                this.triggerEvent('close');
            }
        },

        // 关闭弹窗
        close() {
            this.triggerEvent('close');
        },

        // 空方法，阻止冒泡
        noop() { }
    }
});
