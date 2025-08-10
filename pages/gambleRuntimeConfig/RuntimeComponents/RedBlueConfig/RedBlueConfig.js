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
        // 分组方式:固拉、4_乱拉、4_高手不见面
        red_blue_config: '4_固拉',
        bootstrap_order: [],
        hasInitialized: false
    },

    lifetimes: {
        attached() {
            this.initializeConfig();
        }
    },

    observers: {
        'players, initialRedBlueConfig, initialBootstrapOrder': function (players, initialRedBlueConfig, initialBootstrapOrder) {
            // 简化：只在数据变化时重新初始化
            this.initializeConfig();
        }
    },

    methods: {

        onSortEnd(e) {
            console.log("弹框收到排序结果:", e.detail.listData);
            const _bootstrap_order = e.detail.listData.map(item => item.userid);
            console.log("弹框收到排序结果:", _bootstrap_order);

            this.setData({
                bootstrap_order: _bootstrap_order
            });

            // 触发变更事件，通知父组件数据已更新
            this.triggerEvent('change', {
                red_blue_config: this.data.red_blue_config,
                bootstrap_order: this.convertToUserIds(_bootstrap_order)
            });
        },

        // 滚动事件处理
        onScroll(e) {
            this.setData({
                scrollTop: e.detail.scrollTop
            });
        },


        // 初始化配置
        initializeConfig() {
            const { players, initialRedBlueConfig, initialBootstrapOrder, hasInitialized } = this.data;

            console.log('[RedBlueConfig] initializeConfig 输入参数:', {
                players: players?.map(p => ({ userid: p.userid, type: typeof p.userid })),
                initialRedBlueConfig,
                initialBootstrapOrder,
                initialBootstrapOrderType: typeof initialBootstrapOrder,
                isArray: Array.isArray(initialBootstrapOrder),
                hasInitialized
            });

            // 设置分组配置
            const red_blue_config = initialRedBlueConfig || '4_固拉';

            // 设置玩家顺序
            let bootstrap_order = [];
            if (initialBootstrapOrder && initialBootstrapOrder.length > 0) {
                // 如果有初始玩家顺序，转换为玩家对象数组
                bootstrap_order = initialBootstrapOrder.map(userId => {
                    const player = players.find(p => {
                        const playerUserId = String(p.userid);
                        return playerUserId === String(userId);
                    });

                    if (player) {
                        return player;
                    }
                    // 如果找不到对应玩家，创建一个默认玩家对象
                    return {
                        userid: userId,
                        nickname: `玩家${userId}`,
                        avatar: '/images/default-avatar.png'
                    };
                });
            } else {
                // 否则使用玩家数组作为初始顺序，但存储为玩家对象数组
                bootstrap_order = [...players];
            }


            this.setData({
                red_blue_config,
                bootstrap_order
            });

            // 只在新增模式下触发初始事件
            if (bootstrap_order.length > 0 && !hasInitialized && (!initialBootstrapOrder || initialBootstrapOrder.length === 0)) {
                this.setData({
                    hasInitialized: true
                });

                wx.nextTick(() => {
                    this.triggerEvent('change', {
                        red_blue_config,
                        bootstrap_order: this.convertToUserIds(bootstrap_order)
                    });
                });
            }
        },

        // 转换玩家对象数组为用户ID数组
        convertToUserIds(playersArray) {
            if (!Array.isArray(playersArray)) return [];

            const result = playersArray.map(player => {
                let userid;

                // 处理两种情况：
                // 1. player 是玩家对象，有 userid 属性
                // 2. player 是用户ID字符串或数字
                if (typeof player === 'object' && player !== null && player.userid !== undefined) {
                    userid = player.userid;
                } else if (typeof player === 'string' || typeof player === 'number') {
                    userid = player;
                } else {
                    console.warn('[RedBlueConfig] convertToUserIds 未知的player类型:', player);
                    return 0;
                }

                const convertedId = Number.parseInt(userid) || 0;
                console.log('[RedBlueConfig] convertToUserIds 转换:', {
                    player,
                    userid,
                    convertedId,
                    useridType: typeof userid
                });
                return convertedId;
            });

            console.log('[RedBlueConfig] convertToUserIds 最终结果:', result);
            return result;
        },

        // 分组方式选择变更
        onGroupingMethodChange(e) {
            const red_blue_config = e.detail.value;

            this.setData({
                red_blue_config
            });

            RuntimeComponentsUtils.logger.log('RED_BLUE_CONFIG', '分组方式变更', {
                red_blue_config,
                currentBootstrapOrder: this.data.bootstrap_order,
                playerNames: this.data.bootstrap_order.map(p => p.nickname || p.wx_nickname || '未知玩家')
            });

            // 触发变更事件, 传递用户ID数组
            this.triggerEvent('change', {
                red_blue_config,
                bootstrap_order: this.convertToUserIds(this.data.bootstrap_order)
            });
        },

        randomOrder() {
            const { bootstrap_order } = this.data;

            // 随机打乱玩家顺序
            const shuffled = RuntimeComponentsUtils.array.shuffle(bootstrap_order);

            this.setData({
                bootstrap_order: shuffled
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
            const { bootstrap_order } = this.data;

            // 按差点排序, 差点低的在前
            const sorted = [...bootstrap_order].sort((a, b) => {
                const handicapA = Number(a.handicap) || 0;
                const handicapB = Number(b.handicap) || 0;
                return handicapA - handicapB;
            });

            this.setData({
                bootstrap_order: sorted
            });

            RuntimeComponentsUtils.logger.log('RED_BLUE_CONFIG', '差点排序', sorted);

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
                bootstrap_order: this.convertToUserIds(this.data.bootstrap_order)
            };

            return config;
        }
    }
}); 