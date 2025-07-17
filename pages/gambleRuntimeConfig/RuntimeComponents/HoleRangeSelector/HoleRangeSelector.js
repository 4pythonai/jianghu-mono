// HoleRangeSelector组件 - 起点洞与终点洞选择器
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {

        // 洞列表数据
        holeList: {
            type: Array,
            value: []
        },
        holePlayList: {
            type: Array,
            value: []
        }
    },

    data: {
        // 球洞列表数据
        holeList: [],
        holePlayList: [],
        // 弹框显示状态
        showStartHoleModal: false,
        showEndHoleModal: false
    },

    lifetimes: {
        attached() {
            this.initializeHoleRanges();
        }
    },

    observers: {
        'holeList': function (holeList) {
            this.initializeHoleRanges(holeList);
        }
    },

    methods: {
        // 初始化洞范围选择器
        initializeHoleRanges(holeList) {

        },

        // 显示起始洞选择弹框
        showStartHoleModal() {
            this.setData({ showStartHoleModal: true });
        },

        // 隐藏起始洞选择弹框
        hideStartHoleModal() {
            this.setData({ showStartHoleModal: false });
        },



        // 显示终止洞选择弹框
        showEndHoleModal() {
            this.setData({ showEndHoleModal: true });
        },

        // 隐藏终止洞选择弹框
        hideEndHoleModal() {
            this.setData({ showEndHoleModal: false });
        },


        // 触发变更事件
        triggerChangeEvent() {
            // 直接触发 holePlayList 的变更事件
            this.triggerEvent('change', {
                holePlayList: this.data.holePlayList
            });
        },


    }
}); 