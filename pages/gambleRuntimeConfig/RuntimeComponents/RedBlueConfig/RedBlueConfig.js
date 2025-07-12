// RedBlueConfig组件 - 分组配置
Component({
    properties: {
        // 所有玩家
        players: {
            type: Array,
            value: []
        }
    },

    data: {
        // 分组方式：固拉、4_乱拉、4_高手不见面
        red_blue_config: '4_固拉',

        // 玩家出发顺序
        playersOrder: [],

        // 拖拽状态
        dragState: {
            dragIndex: -1,      // 当前拖拽的元素索引
            targetIndex: -1,    // 目标位置索引
            startY: 0,          // 开始触摸的Y坐标
            offsetY: 0,         // Y轴偏移量
            direction: 0        // 拖拽方向: 1向下, -1向上
        }
    },

    lifetimes: {
        attached() {
            this.initializePlayersOrder();
        }
    },

    observers: {
        'players': function (players) {
            this.initializePlayersOrder();
        }
    },

    methods: {
        // 初始化玩家顺序
        initializePlayersOrder() {
            const { players } = this.data;

            // 复制玩家数组作为初始顺序
            const playersOrder = [...players];

            this.setData({
                playersOrder
            });

            console.log('🎯 [RedBlueConfig] 初始化玩家顺序:', playersOrder);
        },

        // 分组方式选择变更
        onGroupingMethodChange(e) {
            const red_blue_config = e.detail.value;

            this.setData({
                red_blue_config
            });

            console.log('🎯 [RedBlueConfig] 分组方式变更:', red_blue_config);

            // 触发变更事件
            this.triggerEvent('change', {
                red_blue_config,
                playersOrder: this.data.playersOrder
            });
        },

        randomOrder() {
            const { playersOrder } = this.data;

            // 随机打乱玩家顺序
            const shuffled = [...playersOrder].sort(() => Math.random() - 0.5);

            this.setData({
                playersOrder: shuffled
            });


            // 触发变更事件
            this.triggerEvent('change', {
                red_blue_config: this.data.red_blue_config,
                playersOrder: shuffled
            });

            // 显示提示
            wx.showToast({
                title: '抽签排序完成',
                icon: 'success'
            });
        },

        // 差点排序（按差点从低到高排序）
        handicapOrder() {
            const { playersOrder } = this.data;

            // 按差点排序，差点低的在前
            const sorted = [...playersOrder].sort((a, b) => {
                const handicapA = Number(a.handicap) || 0;
                const handicapB = Number(b.handicap) || 0;
                return handicapA - handicapB;
            });

            this.setData({
                playersOrder: sorted
            });

            console.log('🎯 [RedBlueConfig] 差点排序:', sorted);

            // 触发变更事件
            this.triggerEvent('change', {
                red_blue_config: this.data.red_blue_config,
                playersOrder: sorted
            });

            // 显示提示
            wx.showToast({
                title: '差点排序完成',
                icon: 'success'
            });
        },

        // 拖拽开始
        onTouchStart(e) {
            const index = parseInt(e.currentTarget.dataset.index);
            const startY = e.touches[0].clientY;

            this.setData({
                'dragState.dragIndex': index,
                'dragState.startY': startY,
                'dragState.offsetY': 0,
                'dragState.targetIndex': -1
            });

            console.log('🎯 [RedBlueConfig] 开始拖拽:', index);
        },

        // 拖拽移动
        onTouchMove(e) {
            const { dragState } = this.data;
            if (dragState.dragIndex === -1) return;

            const currentY = e.touches[0].clientY;
            const offsetY = (currentY - dragState.startY) * 2; // 放大移动距离的转换比例

            // 计算目标索引
            const itemHeight = 100; // 每个列表项的大概高度(rpx)
            const moveDistance = Math.abs(offsetY);
            const steps = Math.floor(moveDistance / itemHeight);
            const direction = offsetY > 0 ? 1 : -1;

            let targetIndex = -1;
            if (steps > 0) {
                targetIndex = dragState.dragIndex + (direction * steps);
                targetIndex = Math.max(0, Math.min(this.data.playersOrder.length - 1, targetIndex));

                // 如果目标索引和当前索引相同，不显示目标位置
                if (targetIndex === dragState.dragIndex) {
                    targetIndex = -1;
                }
            }

            this.setData({
                'dragState.offsetY': offsetY,
                'dragState.targetIndex': targetIndex,
                'dragState.direction': direction
            });
        },

        // 拖拽结束
        onTouchEnd(e) {
            const { dragState, playersOrder } = this.data;
            if (dragState.dragIndex === -1) return;

            const dragIndex = dragState.dragIndex;
            const targetIndex = dragState.targetIndex;

            // 如果有有效的目标位置，执行位置交换
            if (targetIndex !== -1 && targetIndex !== dragIndex) {
                const newPlayersOrder = [...playersOrder];
                const dragItem = newPlayersOrder[dragIndex];

                // 移除拖拽项
                newPlayersOrder.splice(dragIndex, 1);
                // 插入到目标位置
                newPlayersOrder.splice(targetIndex, 0, dragItem);

                this.setData({
                    playersOrder: newPlayersOrder
                });

                console.log('🎯 [RedBlueConfig] 拖拽完成，新顺序:', newPlayersOrder);

                // 触发变更事件
                this.triggerEvent('change', {
                    red_blue_config: this.data.red_blue_config,
                    playersOrder: newPlayersOrder
                });

                // 显示提示
                wx.showToast({
                    title: '顺序调整完成',
                    icon: 'success',
                    duration: 1000
                });
            }

            // 重置拖拽状态
            this.setData({
                'dragState.dragIndex': -1,
                'dragState.targetIndex': -1,
                'dragState.offsetY': 0,
                'dragState.direction': 0
            });
        }
    }
}); 