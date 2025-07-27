// HoleRangeSelector 组件 - 起点洞与终点洞选择器

import { holeRangeStore } from '../../../../stores/holeRangeStore';
import { autorun } from 'mobx-miniprogram';

Component({
    lifetimes: {
        attached() {
            const { holeList, startHoleindex, endHoleindex } = holeRangeStore.getState();
            this.updateHoleDisplay(holeList, startHoleindex, endHoleindex);
            this.disposer = autorun(() => {
                const { holeList, startHoleindex, endHoleindex } = holeRangeStore.getState();
                this.updateHoleDisplay(holeList, startHoleindex, endHoleindex);
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
        selectType: null, // 新增：记录当前选择类型（start/end）
        startHole: null,  // 起始洞信息
        endHole: null     // 终止洞信息
    },
    methods: {
        /**
         * 更新洞显示信息
         * @param {Array} holeList 洞列表
         * @param {number} startHoleindex 起始洞索引
         * @param {number} endHoleindex 终止洞索引
         */
        updateHoleDisplay(holeList, startHoleindex, endHoleindex) {
            const startHole = startHoleindex && holeList.length ?
                holeList.find(hole => hole.hindex === startHoleindex) : null;
            const endHole = endHoleindex && holeList.length ?
                holeList.find(hole => hole.hindex === endHoleindex) : null;

            console.log('🕳️ HoleRangeSelector updateHoleDisplay:', {
                holeListLength: holeList.length,
                startHoleindex,
                endHoleindex,
                startHole: startHole ? { hindex: startHole.hindex, holename: startHole.holename } : null,
                endHole: endHole ? { hindex: endHole.hindex, holename: endHole.holename } : null
            });

            this.setData({
                holeList,
                startHoleindex,
                endHoleindex,
                startHole,
                endHole
            });
        },

        onSlectStartModal(e) {
            // 获取点击的data-type
            const dataType = e.currentTarget.dataset.type;

            // 从holeRangeStore获取当前的起始洞和结束洞索引
            const { startHoleindex, endHoleindex } = holeRangeStore.getState();


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

            // 从holeRangeStore获取当前的起始洞和结束洞索引
            const { startHoleindex, endHoleindex } = holeRangeStore.getState();

            this.setData({
                ifShowModal: true,
                startHoleindex,
                endHoleindex,
                selectType: dataType // 传递选择类型
            });
        },

        onModalCancel(e) {
            this.setData({ ifShowModal: false });
        }
    }
}); 