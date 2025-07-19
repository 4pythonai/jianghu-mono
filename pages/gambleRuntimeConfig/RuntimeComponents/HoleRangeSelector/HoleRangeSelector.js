// HoleRangeSelector 组件 - 起点洞与终点洞选择器

import { gameStore } from '../../../../stores/gameStore';
import { autorun } from 'mobx-miniprogram';

Component({
    lifetimes: {
        attached() {
            const { holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex } = gameStore.getState();
            this.setData({ holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex });
            this.disposer = autorun(() => {
                const { holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex } = gameStore.getState();
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
        endHoleindex: null
    },
    methods: {
        onShowModal(e) {
            // 从gameStore获取当前的起始洞和结束洞索引
            const { startHoleindex, endHoleindex } = gameStore.getState();

            console.log(' ⭕️ HoleRangeSelector onShowModal - 从gameStore获取洞范围:', {
                startHoleindex,
                endHoleindex
            });

            this.setData({
                ifShowModal: true,
                startHoleindex,
                endHoleindex
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