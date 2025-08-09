// pages/gameDetail/RuntimeConfigList/gamblOperationComponent/holejump/holejump.js
import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';

const app = getApp();

Component({
    properties: {
        // 传入的 runtimeConfigs 列表
    },

    data: {

        listData: [],

        originalHoleList: [], // 原始洞序列表，用于重置功能
        columnsPerRow: 9, // 每行的列数

        // ===== 拖拽状态 =====
        isDragging: false,

        extraNodes: [],
        pageMetaScrollTop: 0,
        scrollTop: 0


    },

    lifetimes: {
        attached() {

            const listData = [
                { hindex: 0, holename: "A1" },
                { hindex: 1, holename: "A2" },
                { hindex: 2, holename: "A3" },
                { hindex: 3, holename: "A4" },
                { hindex: 4, holename: "A5" },
                { hindex: 5, holename: "A6" },
                { hindex: 6, holename: "A7" },
                { hindex: 7, holename: "A8" },
                { hindex: 8, holename: "A9" },
                { hindex: 9, holename: "B1" },
                { hindex: 10, holename: "B2" },
                { hindex: 11, holename: "B3" },
                { hindex: 12, holename: "B4" },
                { hindex: 13, holename: "B5" },
                { hindex: 14, holename: "B6" },
                { hindex: 15, holename: "B7" },
                { hindex: 16, holename: "B8" },
                { hindex: 17, holename: "B9" }
            ];


            this.drag = this.selectComponent('#holoJump');
            // 模仿异步加载数据
            setTimeout(() => {

                this.setData({
                    listData: listData
                });

                this.drag.init();
            }, 100)

        },

        detached() {
            this.storeBindings?.destroyStoreBindings();
        }
    },

    methods: {


        sortEnd(e) {
            console.log("sortEnd", e.detail.listData)
            this.setData({
                listData: e.detail.listData
            });
        },



        scroll(e) {
            this.setData({
                pageMetaScrollTop: e.detail.scrollTop
            })
        },
        // 页面滚动
        onPageScroll(e) {
            this.setData({
                scrollTop: e.scrollTop
            });
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