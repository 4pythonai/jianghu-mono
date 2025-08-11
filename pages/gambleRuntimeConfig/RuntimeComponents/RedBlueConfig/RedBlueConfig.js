// RedBlueConfig组件 - 分组配置
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 所有玩家
        players: {
            type: Array,
            value: []
        },
        // 初始分组配置
        initialRedBlueConfig: {
            type: String,
            value: '4_固拉'
        },
        // 初始玩家顺序
        initialBootstrapOrder: {
            type: Array,
            value: []
        }
    },

    data: {
        red_blue_config: '4_固拉',
        bootstrap_order: [], // 用于保存配置的用户ID数组
        players: [], // 完整的用户对象数组，用于 PlayerDrag 组件
        scrollTop: 0,
        hasInitialized: false
    },

    lifetimes: {
        attached() {
            this.initializeConfig();
        }
    },


    methods: {
        // 初始化配置
        initializeConfig() {
            console.log("initializeConfig ❤️🧡💛💚💙 初始化配置", this.data);
        },


        onSortEnd(e) {
            console.log("弹框收到排序结果:", e.detail.listData);

            // 更新显示顺序（用户对象数组）
            const newPlayers = e.detail.listData;

            // 更新配置保存顺序（用户ID数组）
            const newBootstrapOrder = this.convertToUserIds(newPlayers);

            console.log("弹框收到排序结果:", newBootstrapOrder);

            this.setData({
                players: newPlayers,
                bootstrap_order: newBootstrapOrder
            });

            // 触发变更事件，通知父组件数据已更新
            this.triggerEvent('change', {
                red_blue_config: this.data.red_blue_config,
                bootstrap_order: newBootstrapOrder
            });
        },

        // 滚动事件处理
        onScroll(e) {
            this.setData({
                scrollTop: e.detail.scrollTop
            });
        },



        // 转换玩家对象数组为用户ID数组（简化版：playersArray 一定是对象数组，仅提取 userid）
        convertToUserIds(playersArray) {
            if (!Array.isArray(playersArray)) return [];
            return playersArray.map(player => {
                const rawId = player?.userid;
                const id = Number.parseInt(`${rawId}`) || 0;
                return id;
            });
        },

        // 分组方式选择变更
        onGroupingMethodChange(e) {
            const red_blue_config = e.detail.value;

            this.setData({
                red_blue_config
            });


            // 触发变更事件, 传递用户ID数组
            this.triggerEvent('change', {
                red_blue_config,
                bootstrap_order: this.data.bootstrap_order
            });
        },

        randomOrder() {
            const { players } = this.data;

            if (!players || players.length === 0) {
                wx.showToast({
                    title: '没有玩家数据',
                    icon: 'error'
                });
                return;
            }

            // 随机打乱玩家顺序
            const shuffled = RuntimeComponentsUtils.array.shuffle([...players]);

            this.setData({
                players: shuffled,
                bootstrap_order: shuffled.map(player => player.userid)
            });

            // 触发变更事件, 传递用户ID数组
            this.triggerEvent('change', {
                red_blue_config: this.data.red_blue_config,
                bootstrap_order: this.convertToUserIds(shuffled)
            });

            // 显示提示
            wx.showToast({
                title: '抽签排序完成',
                icon: 'success'
            });
        },

        // 差点排序(按差点从低到高排序)
        handicapOrder() {
            const { players } = this.data;

            if (!players || players.length === 0) {
                wx.showToast({
                    title: '没有玩家数据',
                    icon: 'error'
                });
                return;
            }

            // 按差点排序, 差点低的在前
            const sorted = [...players].sort((a, b) => {
                const handicapA = Number(a.handicap) || 0;
                const handicapB = Number(b.handicap) || 0;
                return handicapA - handicapB;
            });

            this.setData({
                players: sorted,
                bootstrap_order: sorted.map(player => player.userid)
            });


            // 触发变更事件, 传递用户ID数组
            this.triggerEvent('change', {
                red_blue_config: this.data.red_blue_config,
                bootstrap_order: this.convertToUserIds(sorted)
            });

            // 显示提示
            wx.showToast({
                title: '差点排序完成',
                icon: 'success'
            });
        },

        // 获取当前配置（用于外部收集配置）
        getConfig() {
            const config = {
                red_blue_config: this.data.red_blue_config,
                bootstrap_order: this.data.bootstrap_order
            };

            return config;
        }
    }
}); 