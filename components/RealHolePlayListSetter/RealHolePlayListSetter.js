Component({
    options: {
        styleIsolation: 'apply-shared',
    },
    properties: {
        holeList: {
            type: Array,
            value: Array.from({ length: 18 }, (_, i) => i + 1),
        },
        showModal: {
            type: Boolean,
            value: false,
        },
        modalType: {
            type: String,
            value: 'start',
        },
        selectedIndex: {
            type: Number,
            value: 0,
        },
    },
    data: {},
    lifetimes: {
        attached() {
            console.log('[RealHolePlayListSetter] attached', this.properties);
        }
    },
    observers: {
        showModal(newVal) {
            console.log('[RealHolePlayListSetter] showModal changed:', newVal);
        },
        modalType(newVal) {
            console.log('[RealHolePlayListSetter] modalType changed:', newVal);
        },
        selectedIndex(newVal) {
            console.log('[RealHolePlayListSetter] selectedIndex changed:', newVal);
            // 不要再 setData({ selectedIndex: newVal })，否则死循环
        },
        holeList(newVal) {
            console.log('[RealHolePlayListSetter] holeList changed:', newVal);
        }
    },
    methods: {
        onHideModal() {
            console.log('[RealHolePlayListSetter] onHideModal');
            this.triggerEvent('cancel');
        },
        onSelectHole(e) {
            const idx = e.currentTarget.dataset.index;
            console.log('[RealHolePlayListSetter] onSelectHole', idx);
            this.setData({ selectedIndex: idx });
        },
        onConfirm() {
            console.log('[RealHolePlayListSetter] onConfirm', this.properties.modalType, this.data.selectedIndex);
            this.triggerEvent('change', {
                modalType: this.properties.modalType,
                selectedIndex: this.data.selectedIndex !== undefined ? this.data.selectedIndex : this.properties.selectedIndex
            });
        },
        onCancel() {
            console.log('[RealHolePlayListSetter] onCancel');
            this.triggerEvent('cancel');
        },
    }
}); 