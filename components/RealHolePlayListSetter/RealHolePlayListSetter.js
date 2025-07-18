// RealHolePlayListSetter
import { gameStore } from '../../stores/gameStore';

Component({
    options: {
        styleIsolation: 'apply-shared',
    },
    data: { holeList: [], holePlayList: [], startHoleindex: null, endHoleindex: null },
    lifetimes: {
        attached() {
            const { holeList, holePlayList, startHoleindex, endHoleindex } = gameStore.getState();
            this.setData({ holeList, holePlayList, startHoleindex, endHoleindex });
        },
    },
    methods: {
        onHideModal() {
            this.triggerEvent('cancel');
        },
        onSelectHole(e) {
            const hindex = Number(e.currentTarget.dataset.hindex);
            const sortedList = [...this.data.holeList].sort((a, b) => (a.hindex || 0) - (b.hindex || 0));
            const startIdx = sortedList.findIndex(hole => Number(hole.hindex) === hindex);
            const newHolePlayList = sortedList.slice(startIdx).concat(sortedList.slice(0, startIdx));
            this.setData({
                holePlayList: newHolePlayList
            });
        },
        onConfirmHoleOrder() {
            gameStore.holePlayList = this.data.holePlayList;
            this.triggerEvent('cancel');
        },
        onCancel() {
            this.triggerEvent('cancel');
        },
    }
}); 