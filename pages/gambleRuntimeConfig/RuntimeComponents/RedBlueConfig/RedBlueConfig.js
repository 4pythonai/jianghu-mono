// RedBlueConfig组件 - 分组配置
const RuntimeComponentsUtils = require('../common-utils.js');
const { convertToUserIds } = require('../../../../utils/gameUtils.js');

Component({
    properties: {
        // 所有玩家
        players: {
            type: Array,
            value: []
        },
        // 初始分组配置
        red_blue_config: {
            type: String,
            value: null
        },
        // 初始玩家顺序
        initialBootstrapOrder: {
            type: Array,
            value: []
        },
        // 是否启用自动抽签
        autoRandomOrder: {
            type: Boolean,
            value: false
        },
        // 自动抽签间隔时间（毫秒）
        autoRandomInterval: {
            type: Number,
            value: 100
        }
    },

    data: {
        bootstrap_order: [], // 用于保存配置的用户ID数组
        players: [], // 完整的用户对象数组，用于 PlayerDrag 组件
        scrollTop: 0,
        hasInitialized: false,
        autoRandomTimer: null, // 自动抽签定时器
        isAutoRandoming: false // 是否正在自动抽签
    },

    lifetimes: {
        attached() {
            this.initializeConfig();
        },
        detached() {
            // 组件销毁时清除定时器
            this.clearAutoRandomTimer();
        }
    },

    observers: {
        // 监听自动抽签属性变化
        'autoRandomOrder': function (newVal) {
            if (newVal) {
                this.startAutoRandomOrder();
            } else {
                this.stopAutoRandomOrder();
            }
        }
    },

    methods: {
        // 初始化配置
        initializeConfig() {
            console.log("initializeConfig ❤️🧡💛💚💙 初始化配置", this.data);

            // 如果启用自动抽签，启动定时器
            if (this.data.autoRandomOrder) {
                this.startAutoRandomOrder();
            }
        },

        // 启动自动抽签
        startAutoRandomOrder() {
            if (this.data.isAutoRandoming) {
                console.log("自动抽签已在运行中");
                return;
            }

            console.log("🚀 启动自动抽签定时器，间隔:", this.data.autoRandomInterval, "ms");

            this.setData({
                isAutoRandoming: true
            });

            // 立即执行一次抽签
            this.executeRandomOrder();

            // 设置定时器
            const timer = setInterval(() => {
                this.executeRandomOrder();
            }, this.data.autoRandomInterval);

            this.setData({
                autoRandomTimer: timer
            });
        },

        // 停止自动抽签
        stopAutoRandomOrder() {
            console.log("🛑 停止自动抽签定时器");

            this.clearAutoRandomTimer();
            this.setData({
                isAutoRandoming: false
            });
        },

        // 清除定时器
        clearAutoRandomTimer() {
            if (this.data.autoRandomTimer) {
                clearInterval(this.data.autoRandomTimer);
                this.setData({
                    autoRandomTimer: null
                });
            }
        },

        // 执行抽签排序（内部方法，不显示提示）
        executeRandomOrder() {
            const { players } = this.data;

            if (!players || players.length === 0) {
                console.warn("没有玩家数据，跳过自动抽签");
                return;
            }

            console.log("🎲 自动抽签执行中...");

            // 随机打乱玩家顺序
            const shuffled = RuntimeComponentsUtils.array.shuffle([...players]);

            this.setData({
                players: shuffled,
                bootstrap_order: shuffled.map(player => player.userid)
            });

            // 触发变更事件, 传递用户ID数组
            this.triggerEvent('change', {
                red_blue_config: this.data.red_blue_config,
                bootstrap_order: convertToUserIds(shuffled)
            });

            // 触发自动抽签事件，供外部监听
            this.triggerEvent('autoRandomExecuted', {
                players: shuffled,
                bootstrap_order: convertToUserIds(shuffled)
            });
        },

        onSortEnd(e) {
            console.log("弹框收到排序结果:", e.detail.listData);

            // 更新显示顺序（用户对象数组）
            const newPlayers = e.detail.listData;

            // 更新配置保存顺序（用户ID数组）
            const newBootstrapOrder = convertToUserIds(newPlayers);

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
                bootstrap_order: convertToUserIds(shuffled)
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
                bootstrap_order: convertToUserIds(sorted)
            });

            // 显示提示
            wx.showToast({
                title: '差点排序完成',
                icon: 'success'
            });
        },

        // 获取当前配置（用于外部收集配置）
        getConfig() {
            const { red_blue_config, bootstrap_order, players } = this.data;

            let finalBootstrapOrder = bootstrap_order;
            if (Array.isArray(bootstrap_order) && bootstrap_order.length === 0) {
                finalBootstrapOrder = convertToUserIds(players || []);
                console.warn(
                    `RedBlueConfig.getConfig ⚠️⚠️⚠️ bootstrap_order 为空，已自动从 players 转换。playersCount=${players?.length ?? 0}，converted=`,
                    finalBootstrapOrder
                );
            } else {
                console.log(
                    `RedBlueConfig.getConfig ✅ 使用已有 bootstrap_order：`,
                    finalBootstrapOrder
                );
            }

            const config = {
                red_blue_config,
                bootstrap_order: finalBootstrapOrder
            };

            console.log(`RedBlueConfig.getConfig 📦 返回配置：`, config);
            return config;
        },

        // 手动控制自动抽签（供外部调用）
        toggleAutoRandom() {
            if (this.data.isAutoRandoming) {
                this.stopAutoRandomOrder();
            } else {
                this.startAutoRandomOrder();
            }
        },

        // 设置自动抽签间隔
        setAutoRandomInterval(interval) {
            this.setData({
                autoRandomInterval: interval
            });

            // 如果正在运行，重启定时器
            if (this.data.isAutoRandoming) {
                this.stopAutoRandomOrder();
                this.startAutoRandomOrder();
            }
        }
    }
}); 