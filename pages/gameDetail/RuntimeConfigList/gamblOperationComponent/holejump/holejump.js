import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';
import { toJS } from 'mobx-miniprogram';
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
        pickedItemPosition: { x: 0, y: 0 }
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
            const touch = e.touches[0];
            const index = e.currentTarget.dataset.index;

            console.log('Touch start - index:', index, 'position:', touch.clientX, touch.clientY);

            this.setData({
                isDragging: true,
                dragStartIndex: index,
                dragStartPosition: { x: touch.clientX, y: touch.clientY },
                dragOffset: { x: 0, y: 0 },
                pickedItemPosition: { x: touch.clientX, y: touch.clientY } // 直接使用触摸位置
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

            this.setData({
                dragOffset: { x: offsetX, y: offsetY }
            });

            // 节流更新插入预览，避免过多调用
            const now = Date.now();
            if (now - this.data.lastUpdateTime > 100) { // 100ms节流
                this.updateInsertPreview(touch.clientX, touch.clientY);
                this.setData({ lastUpdateTime: now });
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
            });
        },

        // 获取目标位置索引 - 简化版本
        getTargetIndex(clientX, clientY) {
            return new Promise((resolve) => {
                const query = this.createSelectorQuery();
                query.selectAll('.hole-item').boundingClientRect((rects) => {
                    if (!rects || rects.length === 0) {
                        resolve(-1);
                        return;
                    }

                    // 找到最近的球
                    let minDistance = Number.POSITIVE_INFINITY;
                    let targetIndex = -1;

                    for (let i = 0; i < rects.length; i++) {
                        const rect = rects[i];
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        const distance = Math.sqrt(
                            (clientX - centerX) ** 2 + (clientY - centerY) ** 2
                        );

                        if (distance < minDistance) {
                            minDistance = distance;
                            targetIndex = i;
                        }
                    }

                    // 如果距离太远，认为没有目标
                    if (minDistance > 100) {
                        resolve(-1);
                    } else {
                        resolve(targetIndex);
                    }
                }).exec();
            });
        },

        // 更新插入位置预览
        updateInsertPreview(clientX, clientY) {
            this.getTargetIndex(clientX, clientY).then(targetIndex => {
                if (targetIndex !== -1) {
                    // 创建插入预览效果：在目标位置显示一个透明的球
                    const holePlayList = this.data.holePlayList.map((item, index) => ({
                        ...item,
                        isInsertPreview: index === targetIndex
                    }));
                    this.setData({ holePlayList });
                } else {
                    // 清除预览效果
                    const holePlayList = this.data.holePlayList.map(item => ({
                        ...item,
                        isInsertPreview: false
                    }));
                    this.setData({ holePlayList });
                }
            });
        },

        // 清除所有预览效果
        clearAllPreviews() {
            const holePlayList = this.data.holePlayList.map(item => ({
                ...item,
                isInsertPreview: false
            }));
            this.setData({ holePlayList });
        },

        // 拿起球时重新排列其他球
        rearrangeOnPickup(pickupIndex) {
            const holePlayList = [...this.data.holePlayList];
            const pickedItem = holePlayList[pickupIndex];

            console.log('Picking up item at index:', pickupIndex, 'Total items before:', holePlayList.length);

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

            this.setData({
                holePlayList: rearrangedList,
                pickedItem: pickedItem
            });
        },

        // 放下球时插入到目标位置
        insertOnDrop(targetIndex) {
            const currentList = [...this.data.holePlayList];
            const pickedItem = this.data.pickedItem;

            if (!pickedItem) return;

            // 确保目标索引在有效范围内
            const validIndex = Math.max(0, Math.min(targetIndex, currentList.length));

            // 在目标位置插入被拖拽的球
            currentList.splice(validIndex, 0, {
                ...pickedItem,
                isDragging: false,
                isPicked: false,
                isInsertPreview: false
            });

            // 清除所有预览效果
            for (const item of currentList) {
                item.isInsertPreview = false;
            }

            // 更新所有球的索引
            for (let i = 0; i < currentList.length; i++) {
                currentList[i].originalIndex = i;
            }

            console.log('Inserted item at index:', validIndex, 'Total items:', currentList.length);

            this.setData({
                holePlayList: currentList,
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
            const resetList = this.data.originalHoleList.map((item, index) => ({
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
        onConfirm() {
            const selectedIdList = this.data.holePlayList.map(item => item.hindex);
            console.log('Confirming with', selectedIdList.length, 'items:', selectedIdList);

            // 验证数据一致性
            if (selectedIdList.length !== this.data.originalHoleList.length) {
                console.error('Data inconsistency detected! Expected:', this.data.originalHoleList.length, 'Got:', selectedIdList.length);
                // 如果数据不一致，恢复到原始状态
                this.restoreOriginalOrder();
                return;
            }

            this.triggerEvent('onConfirmJump', { selectedIdList });
        },

        // 关闭弹窗
        close() {
            this.triggerEvent('close');
        },

        // 空方法，阻止冒泡
        noop() { }
    }
});
