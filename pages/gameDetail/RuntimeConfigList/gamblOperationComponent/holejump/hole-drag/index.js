Component({
    externalClasses: ['hole-drag-class'],

    properties: {
        holeList: {
            type: Array,
            value: []
        },
        columns: {
            type: Number,
            value: 9
        },
        itemWidth: {
            type: Number,
            value: 75 // 65rpx + 10rpx margin
        },
        itemHeight: {
            type: Number,
            value: 75
        }
    },

    data: {
        list: [],
        baseData: {},
        dragging: false,
        wrapStyle: ''
    },

    lifetimes: {
        attached() {
            this.initializeComponent();
        }
    },

    observers: {
        'holeList': function (newHoleList) {
            if (newHoleList && newHoleList.length > 0) {
                this.updateList(newHoleList);
            }
        },
        'columns': function (newColumns) {
            this.updateBaseData();
        }
    },

    methods: {
        /**
         * 初始化组件
         */
        initializeComponent() {
            this.updateBaseData();
            this.updateList(this.data.holeList);
        },

        /**
         * 更新基础数据
         */
        updateBaseData() {
            const systemInfo = wx.getSystemInfoSync();
            const windowWidth = systemInfo.windowWidth;

            // 计算容器和项目尺寸
            const containerPadding = 20; // 10rpx * 2
            const itemMargin = 10; // 5rpx * 2
            const actualItemWidth = (750 - containerPadding) / this.data.columns - itemMargin;

            const baseData = {
                columns: this.data.columns,
                rows: Math.ceil(this.data.holeList.length / this.data.columns),
                itemWidth: actualItemWidth * windowWidth / 750,
                itemHeight: this.data.itemHeight * windowWidth / 750,
                windowWidth: windowWidth,
                windowHeight: systemInfo.windowHeight,
                wrapLeft: 0,
                wrapTop: 0
            };

            this.setData({
                baseData,
                wrapStyle: `height: ${baseData.rows * 100}rpx;`
            });

            // 获取容器位置信息
            setTimeout(() => {
                this.updateWrapPosition();
            }, 100);
        },

        /**
         * 更新容器位置信息
         */
        updateWrapPosition() {
            wx.createSelectorQuery().in(this)
                .select('.hole-drag-wrap')
                .boundingClientRect((rect) => {
                    if (rect) {
                        this.setData({
                            'baseData.wrapLeft': rect.left,
                            'baseData.wrapTop': rect.top
                        });
                    }
                }).exec();
        },

        /**
         * 更新列表数据
         */
        updateList(holeList) {
            if (!holeList || holeList.length === 0) {
                this.setData({ list: [] });
                return;
            }

            const list = holeList.map((hole, index) => ({
                id: hole.hindex || index,
                data: hole,
                sortKey: index,
                realKey: index,
                tranX: ((index % this.data.columns) * (100 / this.data.columns)) + "%",
                tranY: (Math.floor(index / this.data.columns) * 100) + "%",
                fixed: hole.fixed || false,
                dragging: false
            }));

            this.setData({ list });
            console.log('🏌️ hole-drag 列表初始化完成，共', list.length, '个洞');
        },

        /**
         * 拖拽开始事件
         */
        onDragStart(e) {
            this.setData({ dragging: true });
            this.triggerEvent('dragstart', e.detail);
        },

        /**
         * 拖拽结束事件
         */
        onDragEnd(e) {
            this.setData({ dragging: false });

            // 提取新的顺序
            const newOrder = e.detail.newOrder.map(item => item.data);

            this.triggerEvent('dragend', {
                newOrder: newOrder
            });

            console.log('✅ 拖拽排序完成');
        },

        /**
         * 震动反馈
         */
        vibrate() {
            wx.vibrateShort({
                type: 'light'
            });
        },

        /**
         * 重置列表到初始状态
         */
        reset() {
            this.updateList(this.data.holeList);
        }
    }
});