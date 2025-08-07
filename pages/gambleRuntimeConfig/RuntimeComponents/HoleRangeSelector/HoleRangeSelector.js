// HoleRangeSelector 组件 - 起点洞与终点洞选择器

import { holeRangeStore } from '../../../../stores/holeRangeStore';
import { autorun } from 'mobx-miniprogram';

Component({
    lifetimes: {
        attached() {
            const { holeList, startHoleindex, endHoleindex, roadLength } = holeRangeStore.getState();
            this.updateHoleDisplay(holeList, startHoleindex, endHoleindex, roadLength);
            this.disposer = autorun(() => {
                const { holeList, startHoleindex, endHoleindex, roadLength } = holeRangeStore.getState();
                this.updateHoleDisplay(holeList, startHoleindex, endHoleindex, roadLength);
            });
        },
        detached() {
            this.disposer?.();
        }
    },
    data: {
        holeList: [],
        ifShowModal: false,
        startHoleindex: null,
        endHoleindex: null,
        selectType: null, // 新增：记录当前选择类型（start/end）
        startHole: null,  // 起始洞信息
        endHole: null,     // 终止洞信息
        roadLength: 0
    },
    methods: {
        /**
         * 更新洞显示信息
         * @param {Array} holeList 洞列表
         * @param {number} startHoleindex 起始洞索引
         * @param {number} endHoleindex 终止洞索引
         */
        updateHoleDisplay(holeList, startHoleindex, endHoleindex, roadLength) {
            const startHole = startHoleindex && holeList.length ?
                holeList.find(hole => hole.hindex === startHoleindex) : null;
            const endHole = endHoleindex && holeList.length ?
                holeList.find(hole => hole.hindex === endHoleindex) : null;

            console.log(' 🛑🛑  HoleRangeSelector updateHoleDisplay:', {
                holeListLength: holeList.length,
                startHoleindex,
                endHoleindex,
                startHole: startHole ? { hindex: startHole.hindex, holename: startHole.holename } : null,
                endHole: endHole ? { hindex: endHole.hindex, holename: endHole.holename } : null,
                roadLength: roadLength
            });

            this.setData({
                holeList,
                startHoleindex,
                endHoleindex,
                startHole,
                endHole,
                roadLength
            });
        },

        onSlectStartModal(e) {
            // 获取点击的data-type
            const dataType = e.currentTarget.dataset.type;

            // 从holeRangeStore获取当前的起始洞和结束洞索引
            const { startHoleindex, endHoleindex, roadLength } = holeRangeStore.getState();


            this.setData({
                ifShowModal: true,
                startHoleindex,
                endHoleindex,
                selectType: dataType,
                roadLength
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
                selectType: dataType,
            });
        },

        onModalCancel(e) {
            this.setData({ ifShowModal: false });
        },

        // 获取当前配置（用于外部收集配置）
        getConfig() {
            const { startHoleindex, endHoleindex } = this.data;

            // 从 holeRangeStore 获取 holePlayListStr
            const { holePlayList } = holeRangeStore.getState();
            const holePlayListStr = holePlayList.map(hole => hole.hindex).join(',');

            return {
                startHoleindex: startHoleindex,
                endHoleindex: endHoleindex,
                holePlayListStr: holePlayListStr
            };
        }
    }
}); 