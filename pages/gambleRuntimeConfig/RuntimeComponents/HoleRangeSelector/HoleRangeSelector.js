// HoleRangeSelector组件 - 起点洞与终点洞选择器
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 起始洞
        firstHoleindex: {
            type: Number,
            value: 0
        },
        // 结束洞
        lastHoleindex: {
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
        // 起始洞选择器数据
        startHoleRange: [],
        startHoleIndex: 0,

        // 结束洞选择器数据
        endHoleRange: [],
        endHoleIndex: 17
    },

    lifetimes: {
        attached() {
            this.initializeHoleRanges();
        }
    },

    observers: {
        'firstHoleindex, lastHoleindex, holeList': function (firstHoleindex, lastHoleindex, holeList) {
            this.initializeHoleRanges(firstHoleindex, lastHoleindex, holeList);
        }
    },

    methods: {
        // 初始化洞范围选择器
        initializeHoleRanges(firstHoleindex, lastHoleindex, holeList) {
            const actualFirstHole = firstHoleindex !== undefined ? firstHoleindex : this.properties.firstHoleindex;
            const actualLastHole = lastHoleindex !== undefined ? lastHoleindex : this.properties.lastHoleindex;
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

        // 起始洞选择改变
        onStartHoleChange(e) {
            const startHoleIndex = e.detail.value;
            this.setData({ startHoleIndex });
            this.triggerChangeEvent(startHoleIndex, this.data.endHoleIndex);
        },

        // 结束洞选择改变
        onEndHoleChange(e) {
            const endHoleIndex = e.detail.value;
            this.setData({ endHoleIndex });
            this.triggerChangeEvent(this.data.startHoleIndex, endHoleIndex);
        },

        // 触发变更事件
        triggerChangeEvent(firstHoleindex, lastHoleindex) {
            this.triggerEvent('change', {
                firstHoleindex,
                lastHoleindex
            });
        },

        // 获取当前选择的洞范围描述
        getHoleRangeDescription() {
            const firstHoleindex = this.data.startHoleIndex + 1;
            const lastHoleindex = this.data.endHoleIndex + 1;

            if (firstHoleindex === lastHoleindex) {
                return `第${firstHoleindex}洞`;
            }
            return `第${firstHoleindex}洞 - 第${lastHoleindex}洞`;
        }
    }
}); 