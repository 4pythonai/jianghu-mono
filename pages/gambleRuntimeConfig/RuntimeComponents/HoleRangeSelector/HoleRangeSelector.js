// HoleRangeSelector 组件 - 起点洞与终点洞选择器

import { gameStore } from '../../../../stores/gameStore';
import { autorun } from 'mobx-miniprogram';

Component({
    lifetimes: {
        attached() {
            const { holeList, holePlayList, rangeHolePlayList } = gameStore.getState();
            this.setData({ holeList, holePlayList, rangeHolePlayList });
            this.disposer = autorun(() => {
                const { holeList, holePlayList, rangeHolePlayList } = gameStore.getState();
                this.setData({ holeList, holePlayList, rangeHolePlayList });
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
    },
    methods: {
        onShowModal(e) {
            this.setData({ ifShowModal: true });
        },
        onModalCancel(e) {
            this.setData({ ifShowModal: false });
        },
        onModalConfirm(e) {
            this.setData({ ifShowModal: false });
        }
    }
}); 