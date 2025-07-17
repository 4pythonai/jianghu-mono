const { gameStore } = require('../../stores/gameStore');


Component({
    options: {
        styleIsolation: 'apply-shared',
    },

    properties: {
        holeList: {
            type: Array,
            value: []
        },

        ifShowModal: {
            type: Boolean,
            value: false,
        },

    },

    data: { holePlayList: [] },
    lifetimes: {
        attached() {
            this.setData({ holePlayList: gameStore.holePlayList });

        }
    },

    methods: {
        onHideModal() {
            console.log('[RealHolePlayListSetter] onHideModal');
            this.triggerEvent('cancel');
        },

        onSelectHole(e) {
            const hindex = Number(e.currentTarget.dataset.hindex);
            const { holeList } = this.properties;

            // 1. 先按 hindex 升序排列
            const sortedList = [...holeList].sort((a, b) => (a.hindex || 0) - (b.hindex || 0));
            // 2. 找到点击的 hindex 在排序后数组中的下标
            const startIdx = sortedList.findIndex(hole => Number(hole.hindex) === hindex);
            // 3. 用这个下标做环形切片
            const newHolePlayList = sortedList.slice(startIdx).concat(sortedList.slice(0, startIdx));

            this.setData({
                holePlayList: newHolePlayList
            });

            gameStore.changeHolePlayList(newHolePlayList);

            console.log('[onSelectHole] 新holePlayList:', newHolePlayList);
        },

        onConfirmHoleOrder() {
            console.log('确定:::');

            gameStore.changeHolePlayList(this.data.holePlayList);

            this.setData({ ifShowModal: false });

        },

        onCancel() {
            console.log('[RealHolePlayListSetter] onCancel');
            this.triggerEvent('cancel');
        },
    }
}); 