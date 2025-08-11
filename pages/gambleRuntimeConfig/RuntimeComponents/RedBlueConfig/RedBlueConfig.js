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
        onSortEnd(e) {
            console.log("弹框收到排序结果:", e.detail.listData);

            // 更新显示顺序（用户对象数组）
            const newPlayers = e.detail.listData;

            // 更新配置保存顺序（用户ID数组）
            const newBootstrapOrder = newPlayers.map(item => item.userid);

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

        // 初始化配置
        initializeConfig() {
            const { players, initialRedBlueConfig, initialBootstrapOrder } = this.data;

            // 分组配置
            const red_blue_config = initialRedBlueConfig || '4_固拉';

            // 规范化初始顺序为字符串ID数组，支持传对象或ID
            const normalizedOrderIds = Array.isArray(initialBootstrapOrder)
                ? initialBootstrapOrder.map(item => {
                    const id = (typeof item === 'object' && item !== null && item.userid !== undefined)
                        ? item.userid
                        : item;
                    return `${id}`;
                })
                : [];

            // 基于初始顺序重排 players：顺序内的在前，剩余的按原顺序在后
            let reorderedPlayers = Array.isArray(players) ? [...players] : [];
            if (normalizedOrderIds.length > 0 && reorderedPlayers.length > 0) {
                const usedIndexSet = new Set();
                const idToIndex = new Map(reorderedPlayers.map((p, i) => [`${p?.userid}`, i]));
                const ordered = [];

                for (const idStr of normalizedOrderIds) {
                    const matchedIndex = idToIndex.get(idStr);
                    if (matchedIndex !== undefined) {
                        ordered.push(reorderedPlayers[matchedIndex]);
                        usedIndexSet.add(matchedIndex);
                    }
                }

                for (const [index, player] of reorderedPlayers.entries()) {
                    if (!usedIndexSet.has(index)) {
                        ordered.push(player);
                    }
                }

                reorderedPlayers = ordered;
            }

            const bootstrap_order = reorderedPlayers.map(p => p?.userid);

            this.setData({
                red_blue_config,
                players: reorderedPlayers,
                bootstrap_order
            });

            // 只在新增模式下触发初始事件
            if (bootstrap_order.length > 0 && !this.data.hasInitialized) {
                this.setData({ hasInitialized: true });
                wx.nextTick(() => {
                    this.triggerEvent('change', {
                        red_blue_config,
                        bootstrap_order: this.convertToUserIds(reorderedPlayers)
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
                playerNames: this.data.players?.map(p => p.nickname || p.wx_nickname || '未知玩家') || []
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
                bootstrap_order: this.data.bootstrap_order
            };

            return config;
        }
    }
}); 