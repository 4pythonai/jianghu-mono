// RealHolePlayListSetter
import { gameStore } from '../../stores/gameStore';


Component({
    options: {
        styleIsolation: 'apply-shared',
    },

    properties: {
        ifShowModal: {
            type: Boolean,
            value: false,
        },

    },

    data: { holeList: [], holePlayList: [], startHoleindex: null, endHoleindex: null },


    lifetimes: {
        attached() {
            const { holeList, holePlayList, startHoleindex, endHoleindex } = gameStore.getState();
            this.setData({ holeList, holePlayList, startHoleindex, endHoleindex });
        }
    },



    methods: {
        onHideModal() {
            console.log('[RealHolePlayListSetter] onHideModal');
            this.triggerEvent('cancel');
        },

        onSelectHole(e) {
            const hindex = Number(e.currentTarget.dataset.hindex);
            // 1. 先按 hindex 升序排列
            const sortedList = [...this.data.holeList].sort((a, b) => (a.hindex || 0) - (b.hindex || 0));
            // 2. 找到点击的 hindex 在排序后数组中的下标
            const startIdx = sortedList.findIndex(hole => Number(hole.hindex) === hindex);
            // 3. 用这个下标做环形切片
            const newHolePlayList = sortedList.slice(startIdx).concat(sortedList.slice(0, startIdx));

            this.setData({
                holePlayList: newHolePlayList
            });
        },

        onConfirmHoleOrder() {
            console.log('确定:::');
            gameStore.updateHolePlayList(this.data.holePlayList);
            this.setData({ ifShowModal: false });

        },

        onCancel() {
            console.log('[RealHolePlayListSetter] onCancel');
            this.triggerEvent('cancel');
        },
    }
}); 