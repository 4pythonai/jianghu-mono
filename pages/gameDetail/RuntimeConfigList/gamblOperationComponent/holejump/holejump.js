import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';

const app = getApp();

Component({
    properties: {
        // 传入的 runtimeConfigs 列表
    },

    data: {
        // ===== 基础数据 =====
        holePlayList: [], // 洞序列表，用于显示在网格中
        originalHoleList: [], // 原始洞序列表，用于重置功能

        // ===== 拖拽状态数据 =====
        isDragging: false, // 是否正在拖拽
        dragStartTime: 0, // 拖拽开始时间，用于判断是否为有效拖拽

        // ===== 被拖拽的球数据 =====
        pickedItem: null, // 当前被拖拽的球对象 {hindex, holename, originalIndex}
        pickedItemPosition: { x: 0, y: 0 }, // 被拖拽球的初始位置
        dragOffset: { x: 0, y: 0 }, // 拖拽过程中的偏移量

        // ===== 拖拽目标位置数据 =====
        targetIndex: -1, // 目标插入位置索引
        leftItem: null, // 左边的球对象
        rightItem: null, // 右边的球对象

        // ===== 预览数据 =====
        previewList: [], // 预览列表，用于显示拖拽后的效果
        showPreview: false, // 是否显示预览效果

        // ===== 网格布局数据 =====
        gridConfig: {
            columns: 9, // 网格列数
            itemSize: 60, // 每个球的大小(rpx)
            gap: 8, // 球之间的间距(rpx)
            containerWidth: 0, // 容器宽度
            containerHeight: 0 // 容器高度
        },

        // ===== 触摸事件数据 =====
        touchData: {
            startX: 0, // 触摸开始X坐标
            startY: 0, // 触摸开始Y坐标
            currentX: 0, // 当前触摸X坐标
            currentY: 0, // 当前触摸Y坐标
            startIndex: -1 // 开始触摸的球索引
        }
    },

    lifetimes: {
        attached() {
            // 初始化洞序列表
            const holeList = gameStore.gameData.holeList || [];
            this.initHoleList(holeList);
        },

        detached() {
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
            const holePlayList = holeList.map((hole, index) => ({
                hindex: hole.hindex,
                holename: hole.holename,
                originalIndex: index, // 记录原始位置
                isInsertPreview: false // 是否为插入预览
            }));

            this.setData({
                holePlayList,
                originalHoleList: [...holePlayList], // 深拷贝保存原始数据
                previewList: [...holePlayList] // 初始化预览列表
            });
        },

        // ===== 拖拽核心方法 =====

        /**
         * 触摸开始事件
         * @param {Object} e - 触摸事件对象
         */
        onTouchStart(e) {
            const { index } = e.currentTarget.dataset;
            const touch = e.touches[0];

            // 记录触摸开始数据
            this.setData({
                'touchData.startX': touch.clientX,
                'touchData.startY': touch.clientY,
                'touchData.currentX': touch.clientX,
                'touchData.currentY': touch.clientY,
                'touchData.startIndex': Number.parseInt(index),
                dragStartTime: Date.now()
            });
        },

        /**
         * 触摸移动事件
         * @param {Object} e - 触摸事件对象
         */
        onTouchMove(e) {
            const touch = e.touches[0];
            const { startX, startY, startIndex } = this.data.touchData;

            // 计算移动距离
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // 如果移动距离小于阈值，不启动拖拽
            if (distance < 10) return;

            // 启动拖拽
            if (!this.data.isDragging) {
                this.startDrag(startIndex, touch);
            }

            // 更新拖拽位置
            this.updateDragPosition(touch);

            // 更新触摸数据
            this.setData({
                'touchData.currentX': touch.clientX,
                'touchData.currentY': touch.clientY
            });
        },

        /**
         * 触摸结束事件
         * @param {Object} e - 触摸事件对象
         */
        onTouchEnd(e) {
            if (this.data.isDragging) {
                this.endDrag();
            }

            // 重置触摸数据
            this.setData({
                'touchData.startX': 0,
                'touchData.startY': 0,
                'touchData.currentX': 0,
                'touchData.currentY': 0,
                'touchData.startIndex': -1
            });
        },

        // ===== 拖拽辅助方法 =====

        /**
         * 开始拖拽
         * @param {Number} index - 被拖拽球的索引
         * @param {Object} touch - 触摸对象
         */
        startDrag(index, touch) {
            const item = this.data.holePlayList[index];
            const position = this.getItemPosition(index);

            this.setData({
                isDragging: true,
                pickedItem: { ...item },
                pickedItemPosition: position,
                dragOffset: { x: 0, y: 0 },
                showPreview: false
            });
        },

        /**
         * 更新拖拽位置
         * @param {Object} touch - 触摸对象
         */
        updateDragPosition(touch) {
            const { startX, startY } = this.data.touchData;
            const offsetX = touch.clientX - startX;
            const offsetY = touch.clientY - startY;

            this.setData({
                'dragOffset.x': offsetX,
                'dragOffset.y': offsetY
            });

            // 计算目标位置
            this.calculateTargetPosition(touch);
        },

        /**
         * 结束拖拽
         */
        endDrag() {
            if (this.data.targetIndex !== -1) {
                this.performMove();
            }

            this.setData({
                isDragging: false,
                pickedItem: null,
                pickedItemPosition: { x: 0, y: 0 },
                dragOffset: { x: 0, y: 0 },
                targetIndex: -1,
                leftItem: null,
                rightItem: null,
                showPreview: false
            });
        },

        // ===== 位置计算方法 =====

        /**
         * 获取指定索引球的位置
         * @param {Number} index - 球索引
         * @returns {Object} 位置对象 {x, y}
         */
        getItemPosition(index) {
            const { columns, itemSize, gap } = this.data.gridConfig;
            const row = Math.floor(index / columns);
            const col = index % columns;

            const x = col * (itemSize + gap) + itemSize / 2;
            const y = row * (itemSize + gap) + itemSize / 2;

            return { x, y };
        },

        /**
         * 根据触摸位置计算目标插入位置
         * @param {Object} touch - 触摸对象
         */
        calculateTargetPosition(touch) {
            // 这里需要根据触摸位置计算目标索引
            // 暂时留空，后续实现
        },

        // ===== 移动操作方法 =====

        /**
         * 执行移动操作
         */
        performMove() {
            const { pickedItem, targetIndex, holePlayList } = this.data;
            const originalIndex = pickedItem.originalIndex;

            // 创建新的列表
            const newList = [...holePlayList];

            // 移除原位置的球
            newList.splice(originalIndex, 1);

            // 插入到目标位置
            newList.splice(targetIndex, 0, pickedItem);

            // 更新原始索引
            newList.forEach((item, index) => {
                item.originalIndex = index;
            });

            this.setData({
                holePlayList: newList,
                previewList: [...newList]
            });
        },

        // ===== 业务方法 =====

        /**
         * 重置到原始状态
         */
        onReset() {
            this.setData({
                holePlayList: [...this.data.originalHoleList],
                previewList: [...this.data.originalHoleList]
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
