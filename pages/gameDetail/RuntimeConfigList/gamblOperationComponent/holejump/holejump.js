// pages/gameDetail/RuntimeConfigList/gamblOperationComponent/holejump/holejump.js
import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';

const app = getApp();

Component({
    properties: {
        // 传入的 runtimeConfigs 列表
    },

    data: {
        // ===== 基础数据 =====
        holePlayList: [], // 完整的洞序列表
        originalHoleList: [], // 原始洞序列表，用于重置功能
        columnsPerRow: 9, // 每行的列数

        // ===== 拖拽状态 =====
        isDragging: false
    },

    lifetimes: {
        attached() {
            // 初始化洞序列表
            const holeList = gameStore.gameData.holeList || [];
            console.log('🏌️ [holejump] attached, holeList.length:', holeList.length);
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
            // 动态确定每行列数
            const totalHoles = holeList.length;
            const columnsPerRow = totalHoles <= 9 ? totalHoles : 9;

            const holePlayList = holeList.map((hole, index) => {
                return {
                    hindex: hole.hindex,
                    holename: hole.holename,
                    originalIndex: index,
                    fixed: false // 可以设置某些洞不允许拖拽
                };
            });

            this.setData({
                holePlayList,
                originalHoleList: JSON.parse(JSON.stringify(holePlayList)),
                columnsPerRow
            });

            console.log('🏌️ [holejump] 初始化完成，总洞数:', totalHoles, '每行列数:', columnsPerRow);
        },

        // ===== 拖拽事件处理 =====

        /**
         * 拖拽开始事件
         * @param {Object} e - 事件对象
         */
        onDragStart(e) {
            console.log('🎯 开始拖拽，索引:', e.detail.index);
            this.setData({ isDragging: true });

            // 可以在这里触发震动反馈
            wx.vibrateShort({
                type: 'light'
            });
        },

        /**
         * 拖拽结束事件
         * @param {Object} e - 事件对象
         */
        onDragEnd(e) {
            console.log('🏁 拖拽结束，新顺序:', e.detail.newOrder.map(item => item.holename));

            // 更新列表顺序
            this.setData({
                holePlayList: e.detail.newOrder,
                isDragging: false
            });

            console.log('✅ 排序完成！');
        },

        // ===== 业务方法 =====

        /**
         * 重置到原始状态
         */
        onReset() {
            console.log('🔄 重置到原始状态');
            const originalList = JSON.parse(JSON.stringify(this.data.originalHoleList));
            this.setData({
                holePlayList: originalList,
                isDragging: false
            });

            // 通知hole-drag组件重置
            this.selectComponent('hole-drag').reset();
        },

        /**
         * 完成跳洞设置
         */
        onJumpComplete() {
            console.log('📋 最终排序结果:', this.data.holePlayList.map(item => item.holename));

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