// HoleRangeSelector 组件 - 起点洞与终点洞选择器

import { gameStore } from '../../../../stores/gameStore';
import { autorun } from 'mobx-miniprogram';

Component({
    lifetimes: {
        attached() {
            const { holeList, holePlayList } = gameStore.getState();
            this.setData({ holeList, holePlayList });
            this.disposer = autorun(() => {
                const { holeList, holePlayList } = gameStore.getState();
                this.setData({ holeList, holePlayList });
            });
        },
        detached() {
            this.disposer?.();
        }
    },
    data: {
        holeList: [],
        holePlayList: [],
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