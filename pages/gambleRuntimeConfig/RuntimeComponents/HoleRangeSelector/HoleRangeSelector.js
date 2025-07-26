// HoleRangeSelector 组件 - 起点洞与终点洞选择器

import { holeRangeStore } from '../../../../stores/holeRangeStore';
import { autorun } from 'mobx-miniprogram';

Component({
    lifetimes: {
        attached() {
            const { holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex } = holeRangeStore.getState();
            this.setData({ holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex });
            this.disposer = autorun(() => {
                const { holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex } = holeRangeStore.getState();
                this.setData({ holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex });
            });
        },
        detached() {
            this.disposer?.();
        }
    },
    data: {
        holeList: [],
        holePlayList: [],
        rangeHolePlayList: [],
        ifShowModal: false,
        startHoleindex: null,
        endHoleindex: null,
        selectType: null // 新增：记录当前选择类型（start/end）
    },
    methods: {

        onSlectStartModal(e) {
            // 获取点击的data-type
            const dataType = e.currentTarget.dataset.type;
            console.log(' ⭕️ HoleRangeSelector onSlectStartModal - data-type:', dataType);

            // 从holeRangeStore获取当前的起始洞和结束洞索引
            const { startHoleindex, endHoleindex } = holeRangeStore.getState();

            console.log(' ⭕️ HoleRangeSelector onSlectStartModal - 从holeRangeStore获取洞范围:', {
                startHoleindex,
                endHoleindex
            });

            this.setData({
                ifShowModal: true,
                startHoleindex,
                endHoleindex,
                selectType: dataType // 传递选择类型
            });
        },

        onSelectEndModal(e) {
            // 获取点击的data-type
            const dataType = e.currentTarget.dataset.type;
            console.log(' ⭕️ HoleRangeSelector onSelectEndModal - data-type:', dataType);

            // 从holeRangeStore获取当前的起始洞和结束洞索引
            const { startHoleindex, endHoleindex } = holeRangeStore.getState();

            console.log(' ⭕️ HoleRangeSelector onSelectEndModal - 从holeRangeStore获取洞范围:', {
                startHoleindex,
                endHoleindex
            });

            this.setData({
                ifShowModal: true,
                startHoleindex,
                endHoleindex,
                selectType: dataType // 传递选择类型
            });
        },


        onModalCancel(e) {
            this.setData({ ifShowModal: false });
        },
        onModalConfirm(e) {
            this.setData({ ifShowModal: false });
        }
    }
}); 