// HoleRangeSelector组件 - 起点洞与终点洞选择器
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 起始洞
        firstHoleindex: {
            type: Number,
            value: 1
        },
        // 结束洞
        lastHoleindex: {
            type: Number,
            value: 18
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
            // 如果没有传入参数，则从properties获取
            const actualFirstHole = firstHoleindex !== undefined ? firstHoleindex : this.properties.firstHoleindex;
            const actualLastHole = lastHoleindex !== undefined ? lastHoleindex : this.properties.lastHoleindex;
            const actualHoleList = holeList !== undefined ? holeList : this.properties.holeList;

            // 确保数据类型正确
            const validFirstHole = Number.parseInt(actualFirstHole) || 1;
            const validLastHole = Number.parseInt(actualLastHole) || 18;
            const validHoleList = actualHoleList || [];

            // 如果holeList为空，使用默认值
            if (validHoleList.length === 0) {
                RuntimeComponentsUtils.logger.log('HOLE_RANGE', 'holeList为空，使用默认值');
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

            // 使用holeList生成选择器选项
            const startHoleRange = validHoleList.map(hole => `第${hole.holeno}洞 (${hole.holename})`);
            const endHoleRange = validHoleList.map(hole => `第${hole.holeno}洞 (${hole.holename})`);

            // 找到对应的索引
            const startHoleIndex = Math.max(0,
                validHoleList.findIndex(hole => hole.holeno === validFirstHole)
            );
            const endHoleIndex = Math.max(0,
                validHoleList.findIndex(hole => hole.holeno === validLastHole)
            );

            this.setData({
                startHoleRange,
                endHoleRange,
                startHoleIndex,
                endHoleIndex
            });

            RuntimeComponentsUtils.logger.log('HOLE_RANGE', '初始化洞范围', {
                firstHoleindex: validFirstHole,
                lastHoleindex: validLastHole,
                holeListLength: validHoleList.length,
                startHoleIndex: this.data.startHoleIndex,
                endHoleIndex: this.data.endHoleIndex
            });
        },

        // 起始洞选择改变
        onStartHoleChange(e) {
            const startHoleIndex = e.detail.value;
            const holeList = this.properties.holeList;

            if (!holeList || holeList.length === 0) {
                RuntimeComponentsUtils.logger.log('HOLE_RANGE', 'holeList为空，无法处理选择');
                return;
            }

            // 从holeList中获取对应的洞号
            const selectedHole = holeList[startHoleIndex];
            const firstHoleindex = selectedHole ? selectedHole.holeno : 1;

            this.setData({
                startHoleIndex: startHoleIndex
            });

            RuntimeComponentsUtils.logger.log('HOLE_RANGE', '起始洞变更', firstHoleindex);

            // 触发变更事件，保持当前的结束洞不变
            this.triggerChangeEvent(firstHoleindex, this.properties.lastHoleindex);
        },

        // 结束洞选择改变
        onEndHoleChange(e) {
            const endHoleIndex = e.detail.value;
            const holeList = this.properties.holeList;

            if (!holeList || holeList.length === 0) {
                RuntimeComponentsUtils.logger.log('HOLE_RANGE', 'holeList为空，无法处理选择');
                return;
            }

            // 从holeList中获取对应的洞号
            const selectedHole = holeList[endHoleIndex];
            const lastHoleindex = selectedHole ? selectedHole.holeno : 18;

            this.setData({
                endHoleIndex: endHoleIndex
            });

            RuntimeComponentsUtils.logger.log('HOLE_RANGE', '结束洞变更', lastHoleindex);

            // 触发变更事件，保持当前的起始洞不变
            this.triggerChangeEvent(this.properties.firstHoleindex, lastHoleindex);
        },

        // 触发变更事件
        triggerChangeEvent(firstHoleindex, lastHoleindex) {
            // 确保传递的是数字类型
            const firstHole = Number.parseInt(firstHoleindex) || 1;
            const lastHole = Number.parseInt(lastHoleindex) || 18;

            this.triggerEvent('change', {
                firstHoleindex: firstHole,
                lastHoleindex: lastHole
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