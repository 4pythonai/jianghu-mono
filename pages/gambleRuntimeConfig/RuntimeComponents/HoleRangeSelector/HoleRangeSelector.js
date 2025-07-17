// HoleRangeSelector组件 - 起点洞与终点洞选择器
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 起始洞
        startHoleindex: {
            type: Number,
            value: 0
        },
        // 结束洞
        endHoleindex: {
            type: Number,
            value: 17
        },
        // 洞列表数据
        holeList: {
            type: Array,
            value: []
        }
    },

    data: {
        startHoleRange: [],
        startHoleIndex: 0,
        endHoleRange: [],
        endHoleIndex: 17,
        showModal: false,
        modalType: 'start', // 'start' or 'end'
    },

    lifetimes: {
        attached() {
            this.initializeHoleRanges();
        }
    },

    observers: {
        'startHoleindex, endHoleindex, holeList': function (startHoleindex, endHoleindex, holeList) {
            this.initializeHoleRanges(startHoleindex, endHoleindex, holeList);
        }
    },

    methods: {
        // 初始化洞范围选择器
        initializeHoleRanges(startHoleindex, endHoleindex, holeList) {
            const actualFirstHole = startHoleindex !== undefined ? startHoleindex : this.properties.startHoleindex;
            const actualLastHole = endHoleindex !== undefined ? endHoleindex : this.properties.endHoleindex;
            const actualHoleList = holeList !== undefined ? holeList : this.properties.holeList;

            const validHoleList = (actualHoleList || []).map(hole => ({
                holeno: Number(hole.holeno) || 1,
                holename: hole.holename || `${hole.court_key}${hole.holeno}`,
                holeId: hole.unique_key || `${hole.court_key}_${hole.holeno}`
            }));

            if (validHoleList.length === 0) {
                const startHoleRange = ['第1洞'];
                const endHoleRange = ['第1洞'];
                this.setData({
                    startHoleRange,
                    endHoleRange,
                    startHoleIndex: 0,
                    endHoleIndex: 0
                });
                return;
            }

            const startHoleRange = validHoleList.map(hole => `${hole.holename}`);
            const endHoleRange = validHoleList.map(hole => `${hole.holename}`);

            const startHoleIndex = actualFirstHole !== undefined ? actualFirstHole : 0;
            const endHoleIndex = actualLastHole !== undefined ? actualLastHole : validHoleList.length - 1;

            this.setData({
                startHoleRange,
                endHoleRange,
                startHoleIndex,
                endHoleIndex
            });
        },

        // 触发变更事件
        triggerChangeEvent(startHoleindex, endHoleindex) {
            this.triggerEvent('change', {
                startHoleindex,
                endHoleindex
            });
        },

        // 获取当前选择的洞范围描述
        getHoleRangeDescription() {
            const startHoleindex = this.data.startHoleIndex + 1;
            const endHoleindex = this.data.endHoleIndex + 1;

            if (startHoleindex === endHoleindex) {
                return `第${startHoleindex}洞`;
            }
            return `第${startHoleindex}洞 - 第${endHoleindex}洞`;
        },

        onShowModal(e) {
            const type = e.currentTarget.dataset.type;
            this.setData({
                showModal: true,
                modalType: type
            });
        },
        onModalChange(e) {
            const { modalType, selectedIndex } = e.detail;
            if (modalType === 'start') {
                this.setData({ startHoleIndex: selectedIndex });
            } else {
                this.setData({ endHoleIndex: selectedIndex });
            }
            this.setData({ showModal: false });
            this.triggerChangeEvent(this.data.startHoleIndex, this.data.endHoleIndex);
        },
        onModalCancel() {
            this.setData({ showModal: false });
        }
    }
}); 