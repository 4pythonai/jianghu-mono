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
        // 分组方式：固拉、乱拉、高手不见面
        groupingMethod: '固拉',

        // 玩家出发顺序
        playersOrder: []
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
            const groupingMethod = e.detail.value;

            this.setData({
                groupingMethod
            });

            console.log('🎯 [RedBlueConfig] 分组方式变更:', groupingMethod);

            // 触发变更事件
            this.triggerEvent('change', {
                groupingMethod,
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
                groupingMethod: this.data.groupingMethod,
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
                groupingMethod: this.data.groupingMethod,
                playersOrder: sorted
            });

            // 显示提示
            wx.showToast({
                title: '差点排序完成',
                icon: 'success'
            });
        }
    }
}); 