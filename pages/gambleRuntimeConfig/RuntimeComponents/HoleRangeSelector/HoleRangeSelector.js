// HoleRangeSelector组件 - 起点洞与终点洞选择器
Component({
    properties: {
        // 起始洞
        startHole: {
            type: Number,
            value: 1
        },
        // 结束洞
        endHole: {
            type: Number,
            value: 18
        },
        // 总洞数
        totalHoles: {
            type: Number,
            value: 18
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
        'startHole, endHole, totalHoles': function (startHole, endHole, totalHoles) {
            this.initializeHoleRanges();
        }
    },

    methods: {
        // 初始化洞范围选择器
        initializeHoleRanges() {
            const { startHole, endHole, totalHoles } = this.data;

            // 生成起始洞范围 (1到totalHoles)
            const startHoleRange = [];
            for (let i = 1; i <= totalHoles; i++) {
                startHoleRange.push(`第${i}洞`);
            }

            // 生成结束洞范围 (1到totalHoles)
            const endHoleRange = [];
            for (let i = 1; i <= totalHoles; i++) {
                endHoleRange.push(`第${i}洞`);
            }

            this.setData({
                startHoleRange,
                endHoleRange,
                startHoleIndex: Math.max(0, startHole - 1),
                endHoleIndex: Math.max(0, endHole - 1)
            });

            console.log('🕳️ [HoleRangeSelector] 初始化洞范围:', {
                startHole,
                endHole,
                totalHoles,
                startHoleIndex: this.data.startHoleIndex,
                endHoleIndex: this.data.endHoleIndex
            });
        },

        // 起始洞选择改变
        onStartHoleChange(e) {
            const startHoleIndex = e.detail.value;
            const startHole = startHoleIndex + 1;

            this.setData({
                startHoleIndex: startHoleIndex
            });

            console.log('🕳️ [HoleRangeSelector] 起始洞变更:', startHole);

            // 触发变更事件
            this.triggerChangeEvent(startHole, this.data.endHoleIndex + 1);
        },

        // 结束洞选择改变
        onEndHoleChange(e) {
            const endHoleIndex = e.detail.value;
            const endHole = endHoleIndex + 1;

            this.setData({
                endHoleIndex: endHoleIndex
            });

            console.log('🕳️ [HoleRangeSelector] 结束洞变更:', endHole);

            // 触发变更事件
            this.triggerChangeEvent(this.data.startHoleIndex + 1, endHole);
        },

        // 触发变更事件
        triggerChangeEvent(startHole, endHole) {
            this.triggerEvent('change', {
                startHole,
                endHole
            });
        },

        // 获取当前选择的洞范围描述
        getHoleRangeDescription() {
            const startHole = this.data.startHoleIndex + 1;
            const endHole = this.data.endHoleIndex + 1;

            if (startHole === endHole) {
                return `第${startHole}洞`;
            } else {
                return `第${startHole}洞 - 第${endHole}洞`;
            }
        }
    }
}); 