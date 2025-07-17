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

        selectedIndex: {
            type: Number,
            value: 0,
        },
    },

    data: { selectedIndex: null, holePlayList: [] },
    lifetimes: {
        attached() {
            console.log('[RealHolePlayListSetter] attached', this.properties);
            this.setData({ holePlayList: this.properties.holeList });

        }
    },
    observers: {
        showModal(newVal) {
            // console.log('[RealHolePlayListSetter] showModal changed:', newVal);
        },


        selectedIndex(newVal) {
            // console.log('[RealHolePlayListSetter] selectedIndex changed:', newVal);
        },

        holeList(newVal) {
            // console.log('[RealHolePlayListSetter] holeList changed:', newVal);
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

            // debug: 打印所有 holeList
            console.log('[onSelectHole] 当前holeList:', holeList);
            // debug: 打印当前点击的 hindex
            console.log('[onSelectHole] 当前点击hindex:', hindex);

            // 1. 先按 hindex 升序排列
            const sortedList = [...holeList].sort((a, b) => (a.hindex || 0) - (b.hindex || 0));
            // 2. 找到点击的 hindex 在排序后数组中的下标
            const startIdx = sortedList.findIndex(hole => Number(hole.hindex) === hindex);
            // 3. 用这个下标做环形切片
            const newHolePlayList = sortedList.slice(startIdx).concat(sortedList.slice(0, startIdx));

            this.setData({
                selectedIndex: hindex,
                holePlayList: newHolePlayList
            });

            console.log('[onSelectHole] 新holePlayList:', newHolePlayList);
            console.log('[onSelectHole] 当前selectedIndex(hindex):', hindex);
        },

        onConfirm() {
            console.log('确定:::', this.data.selectedIndex);
            this.triggerEvent('change', {
                selectedIndex: this.data.selectedIndex !== undefined ? this.data.selectedIndex : this.properties.selectedIndex
            });
        },

        onCancel() {
            console.log('[RealHolePlayListSetter] onCancel');
            this.triggerEvent('cancel');
        },
    }
}); 