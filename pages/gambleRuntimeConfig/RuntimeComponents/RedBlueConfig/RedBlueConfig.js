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

        // 玩家出发顺序
        bootstrap_order: [],

        // 拖拽状态
        dragState: {
            dragIndex: -1,      // 当前拖拽的元素索引
            targetIndex: -1,    // 目标位置索引
            startY: 0,          // 开始触摸的Y坐标
            offsetY: 0,         // Y轴偏移量
            direction: 0        // 拖拽方向: 1向下, -1向上
        },

        // 初始化标志位，避免重复触发事件
        hasInitialized: false
    },

    lifetimes: {
        attached() {
            this.initializeConfig();
        }
    },

    observers: {
        'players, initialRedBlueConfig, initialBootstrapOrder': function (players, initialRedBlueConfig, initialBootstrapOrder) {
            console.log('[RED_BLUE_CONFIG] observers 触发:', {
                initialRedBlueConfig,
                initialRedBlueConfigType: typeof initialRedBlueConfig,
                initialBootstrapOrder,
                playersCount: players?.length
            });

            // 在编辑模式下，如果已经有初始数据，不应该重新初始化
            // 只有在新增模式下（没有初始数据）才需要重新初始化
            if ((initialRedBlueConfig === undefined || initialRedBlueConfig === null || initialRedBlueConfig === '') &&
                (!initialBootstrapOrder || initialBootstrapOrder.length === 0)) {
                console.log('[RED_BLUE_CONFIG] 新增模式，执行完整初始化');
                this.initializeConfig();
            } else if (players && players.length > 0) {
                // 编辑模式下，只在玩家数据变化时更新玩家顺序，但保持分组配置不变
                console.log('[RED_BLUE_CONFIG] 编辑模式，只更新玩家数据');
                this.updatePlayersOnly(players, initialBootstrapOrder);
            }
        }
    },

    methods: {
        // 初始化配置
        initializeConfig() {
            const { players, initialRedBlueConfig, initialBootstrapOrder, hasInitialized } = this.data;

            console.log('[RED_BLUE_CONFIG] 初始化配置详情:', {
                initialRedBlueConfig,
                initialRedBlueConfigType: typeof initialRedBlueConfig,
                initialRedBlueConfigLength: initialRedBlueConfig?.length,
                initialBootstrapOrder,
                hasInitialized,
                playersCount: players?.length
            });

            // 设置分组配置 - 修复空字符串的处理
            const red_blue_config = (initialRedBlueConfig !== undefined && initialRedBlueConfig !== null && initialRedBlueConfig !== '')
                ? initialRedBlueConfig
                : '4_固拉';

            console.log('[RED_BLUE_CONFIG] 最终设置的分组配置:', {
                initialRedBlueConfig,
                finalRedBlueConfig: red_blue_config,
                usedDefault: red_blue_config === '4_固拉'
            });

            // 设置玩家顺序
            let bootstrap_order = [];
            if (initialBootstrapOrder && initialBootstrapOrder.length > 0) {
                // 如果有初始顺序，将用户ID数组转换为玩家对象数组
                bootstrap_order = initialBootstrapOrder.map(userId => {
                    // 从players中找到对应的玩家对象
                    const player = players.find(p => {
                        // 使用与 GameTypeManager 一致的字段名处理
                        const playerUserId = String(p.userid || p.user_id);
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
                // 否则使用玩家数组作为初始顺序
                bootstrap_order = [...players];
            }

            this.setData({
                red_blue_config,
                bootstrap_order
            });

            RuntimeComponentsUtils.logger.log('RED_BLUE_CONFIG', '初始化配置', {
                red_blue_config,
                bootstrap_order: bootstrap_order.length,
                playerNames: bootstrap_order.map(p => p.nickname || p.wx_nickname || '未知玩家'),
                players: players?.length || 0,
                initialRedBlueConfig,
                initialBootstrapOrder: initialBootstrapOrder?.length || 0,
                hasInitialized,
                playerDetails: bootstrap_order.map(p => ({
                    userid: p.userid,
                    user_id: p.user_id,
                    nickname: p.nickname,
                    wx_nickname: p.wx_nickname
                }))
            });

            // 只在首次初始化且没有初始 bootstrap_order 时触发事件
            if (bootstrap_order.length > 0 && !hasInitialized && (!initialBootstrapOrder || initialBootstrapOrder.length === 0)) {
                // 设置初始化标志位
                this.setData({
                    hasInitialized: true
                });

                // 使用 nextTick 延迟触发变更事件，避免循环渲染
                wx.nextTick(() => {
                    this.triggerEvent('change', {
                        red_blue_config,
                        bootstrap_order: this.convertToUserIds(bootstrap_order)
                    });

                    RuntimeComponentsUtils.logger.log('RED_BLUE_CONFIG', '初始化时延迟触发变更事件', {
                        red_blue_config,
                        bootstrap_order: this.convertToUserIds(bootstrap_order)
                    });
                });
            }
        },

        // 编辑模式下只更新玩家数据，不改变分组配置
        updatePlayersOnly(players, initialBootstrapOrder) {
            const { initialRedBlueConfig } = this.data;

            console.log('[RED_BLUE_CONFIG] 编辑模式更新玩家数据:', {
                playersCount: players?.length,
                hasInitialBootstrapOrder: !!initialBootstrapOrder,
                initialRedBlueConfig
            });

            // 设置分组配置 - 使用传入的初始值
            const red_blue_config = (initialRedBlueConfig !== undefined && initialRedBlueConfig !== null && initialRedBlueConfig !== '')
                ? initialRedBlueConfig
                : '4_固拉';

            console.log('[RED_BLUE_CONFIG] 编辑模式设置分组配置:', {
                initialRedBlueConfig,
                finalRedBlueConfig: red_blue_config
            });

            // 设置玩家顺序
            let bootstrap_order = [];
            if (initialBootstrapOrder && initialBootstrapOrder.length > 0) {
                // 如果有初始顺序，将用户ID数组转换为玩家对象数组
                bootstrap_order = initialBootstrapOrder.map(userId => {
                    // 从players中找到对应的玩家对象
                    const player = players.find(p => {
                        // 使用与 GameTypeManager 一致的字段名处理
                        const playerUserId = String(p.userid || p.user_id);
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
                // 否则使用玩家数组作为初始顺序
                bootstrap_order = [...players];
            }

            // 更新分组配置和玩家顺序
            this.setData({
                red_blue_config,
                bootstrap_order
            });

            console.log('[RED_BLUE_CONFIG] 编辑模式数据更新完成:', {
                redBlueConfig: red_blue_config,
                bootstrapOrderLength: bootstrap_order.length
            });
        },

        // 转换玩家对象数组为用户ID数组
        convertToUserIds(playersArray) {
            if (!Array.isArray(playersArray)) return [];

            return playersArray.map(player => {
                // 使用与 GameTypeManager 一致的字段名处理
                const userid = player.userid || player.user_id;
                return Number.parseInt(userid) || 0;
            });
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

        // 拖拽开始
        onTouchStart(e) {
            const index = Number.parseInt(e.currentTarget.dataset.index);
            const startY = e.touches[0].clientY;

            this.setData({
                'dragState.dragIndex': index,
                'dragState.startY': startY,
                'dragState.offsetY': 0,
                'dragState.targetIndex': -1
            });

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
                targetIndex = Math.max(0, Math.min(this.data.bootstrap_order.length - 1, targetIndex));

                // 如果目标索引和当前索引相同, 不显示目标位置
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
            const { dragState, bootstrap_order } = this.data;
            if (dragState.dragIndex === -1) return;

            const dragIndex = dragState.dragIndex;
            const targetIndex = dragState.targetIndex;

            // 如果有有效的目标位置, 执行位置交换
            if (targetIndex !== -1 && targetIndex !== dragIndex) {
                const newPlayersOrder = RuntimeComponentsUtils.array.moveElement(bootstrap_order, dragIndex, targetIndex);

                this.setData({
                    bootstrap_order: newPlayersOrder
                });

                RuntimeComponentsUtils.logger.log('RED_BLUE_CONFIG', '拖拽完成, 新顺序', newPlayersOrder);

                // 触发变更事件, 传递用户ID数组
                this.triggerEvent('change', {
                    red_blue_config: this.data.red_blue_config,
                    bootstrap_order: this.convertToUserIds(newPlayersOrder)
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