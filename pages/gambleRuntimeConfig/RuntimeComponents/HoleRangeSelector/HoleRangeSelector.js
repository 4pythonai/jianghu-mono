// HoleRangeSelector 组件 - 起点洞与终点洞选择器
import { gameStore } from '../../../../stores/gameStore';
import { autorun } from 'mobx-miniprogram';

Component({
    lifetimes: {
        attached() {
            const { holeList, holePlayList } = gameStore.getState();
            this.setData({ holeList, holePlayList });

            // 监听 gameStore.holePlayList 的变化
            this.disposer = autorun(() => {
                const { holePlayList } = gameStore.getState();
                this.setData({ holePlayList });
            });
        },

        detached() {
            this.disposer?.(); // 清理监听
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
    }
}); 