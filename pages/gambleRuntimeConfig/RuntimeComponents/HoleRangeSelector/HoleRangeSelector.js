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
        endHoleRange: [],
        startHoleHindex: 1, // 默认第1洞
        endHoleHindex: 18, // 默认第18洞
        startHoleObj: {},
        endHoleObj: {},
        showModal: false,
        modalType: 'start', // 'start' or 'end'
        holePlayList: [], // 新增，实际打球顺序
    },

    lifetimes: {
        attached() {
            this.initializeHoleRanges();
        }
    },

    observers: {
        'startHoleindex, endHoleindex, holeList': function (startHoleindex, endHoleindex, holeList) {
            this.initializeHoleRanges(startHoleindex, endHoleindex, holeList);
        },
        'holeList, startHoleHindex, endHoleHindex': function (holeList, startHoleHindex, endHoleHindex) {
            if (!holeList || holeList.length === 0) return;
            const startObj = holeList.find(hole => Number(hole.hindex) === Number(startHoleHindex)) || holeList[0];
            const endObj = holeList.find(hole => Number(hole.hindex) === Number(endHoleHindex)) || holeList[holeList.length - 1];
            this.setData({
                startHoleObj: startObj,
                endHoleObj: endObj
            });
        }
    },

    methods: {
        // 初始化洞范围选择器
        initializeHoleRanges(startHoleindex, endHoleindex, holeList) {
            const actualFirstHole = startHoleindex !== undefined ? startHoleindex : this.properties.startHoleindex;
            const actualLastHole = endHoleindex !== undefined ? endHoleindex : this.properties.endHoleindex;
            const actualHoleList = holeList !== undefined ? holeList : this.properties.holeList;

            // 保留原有逻辑
            const validHoleList = (actualHoleList || []).map(hole => ({
                ...hole,
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
                    startHoleHindex: 1,
                    endHoleHindex: 1,
                    startHoleObj: {},
                    endHoleObj: {},
                    holePlayList: [],
                });
                return;
            }

            const startHoleRange = validHoleList.map(hole => `${hole.holename}`);
            const endHoleRange = validHoleList.map(hole => `${hole.holename}`);

            // 新增：用下标取出 hindex
            let startHoleHindex = validHoleList[actualFirstHole]?.hindex || validHoleList[0].hindex;
            let endHoleHindex = validHoleList[actualLastHole]?.hindex || validHoleList[validHoleList.length - 1].hindex;
            const startHoleObj = validHoleList.find(hole => hole.hindex === startHoleHindex) || validHoleList[0];
            const endHoleObj = validHoleList.find(hole => hole.hindex === endHoleHindex) || validHoleList[validHoleList.length - 1];

            // 默认holePlayList为原始顺序
            const holePlayList = [...validHoleList];

            this.setData({
                startHoleRange,
                endHoleRange,
                startHoleHindex,
                endHoleHindex,
                startHoleObj,
                endHoleObj,
                holePlayList,
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
            const startHoleindex = this.data.startHoleHindex + 1;
            const endHoleindex = this.data.endHoleHindex + 1;

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
                // holePlayList 已经在data中，无需额外处理
            });
        },
        onModalChange(e) {
            const { modalType, selectedIndex, holePlayList } = e.detail;
            // 更新起始/终止hindex
            if (modalType === 'start') {
                this.setData({ startHoleHindex: selectedIndex });
            } else {
                this.setData({ endHoleHindex: selectedIndex });
            }
            // 更新holePlayList为最新顺序（由弹窗返回）
            if (holePlayList && holePlayList.length > 0) {
                this.setData({ holePlayList });
            }
            // 更新 startHoleObj/endHoleObj
            const startHoleObj = (this.data.holePlayList || []).length > 0 ? this.data.holePlayList[0] : {};
            const endHoleObj = (this.data.holePlayList || []).length > 0 ? this.data.holePlayList[this.data.holePlayList.length - 1] : {};
            this.setData({
                showModal: false,
                startHoleObj,
                endHoleObj
            });
            this.triggerChangeEvent(this.data.startHoleHindex, this.data.endHoleHindex);
        },
        onModalCancel() {
            this.setData({ showModal: false });
        }
    }
}); 