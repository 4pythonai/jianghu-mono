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
            console.log('👀 observers 触发，参数变化:');
            console.log('  - players:', players);
            console.log('  - initialRedBlueConfig:', initialRedBlueConfig);
            console.log('  - initialBootstrapOrder:', initialBootstrapOrder);
            this.initializeConfig();
        }
    },

    methods: {
        // 初始化配置
        initializeConfig() {
            // 优先用 properties 里的 players
            const players = this.properties.players && this.properties.players.length > 0
                ? this.properties.players
                : (this.data.players || []);
            const initialRedBlueConfig = this.properties.initialRedBlueConfig || this.data.initialRedBlueConfig || '4_固拉';
            const initialBootstrapOrder = this.properties.initialBootstrapOrder || this.data.initialBootstrapOrder || [];
            const hasInitialized = this.data.hasInitialized;

            // ===== 调试打印 - 数据获取情况 =====
            console.log('🔍 RedBlueConfig initializeConfig 开始');
            console.log('📊 传入数据检查:');
            console.log('  - this.properties.players:', this.properties.players);
            console.log('  - this.data.players:', this.data.players);
            console.log('  - 最终使用的 players:', players);
            console.log('  - initialRedBlueConfig:', initialRedBlueConfig);
            console.log('  - initialBootstrapOrder:', initialBootstrapOrder);
            console.log('  - hasInitialized:', hasInitialized);

            // 设置分组配置
            const red_blue_config = initialRedBlueConfig;

            // 设置玩家顺序
            let bootstrap_order = [];
            if (initialBootstrapOrder && initialBootstrapOrder.length > 0) {
                console.log('🎯 使用传入的 initialBootstrapOrder，开始映射玩家数据');
                bootstrap_order = initialBootstrapOrder.map(userId => {
                    const player = players.find(p => String(p.userid) === String(userId));
                    console.log(`  - 查找用户ID ${userId}:`, player ? '找到' : '未找到', player);
                    return player || {
                        userid: userId,
                        nickname: `玩家${userId}`,
                        avatar: '/images/default-avatar.png'
                    };
                });
            } else {
                console.log('🎯 使用传入的 players 作为 bootstrap_order');
                bootstrap_order = [...players];
            }

            console.log('✅ 最终的 bootstrap_order:', bootstrap_order);
            console.log('📏 bootstrap_order 长度:', bootstrap_order.length);

            this.setData({
                red_blue_config,
                bootstrap_order
            });

            console.log('🔄 setData 完成，当前组件数据:');
            console.log('  - red_blue_config:', this.data.red_blue_config);
            console.log('  - bootstrap_order:', this.data.bootstrap_order);

            // 只在新增模式下触发初始事件
            if (bootstrap_order.length > 0 && !hasInitialized && (!initialBootstrapOrder || initialBootstrapOrder.length === 0)) {
                console.log('🚀 触发初始化事件条件满足');
                this.setData({
                    hasInitialized: true
                });

                wx.nextTick(() => {
                    const eventData = {
                        red_blue_config,
                        bootstrap_order: this.convertToUserIds(bootstrap_order)
                    };
                    console.log('📤 触发 change 事件，数据:', eventData);
                    this.triggerEvent('change', eventData);
                });
            } else {
                console.log('❌ 未触发初始化事件，条件检查:');
                console.log('  - bootstrap_order.length > 0:', bootstrap_order.length > 0);
                console.log('  - !hasInitialized:', !hasInitialized);
                console.log('  - (!initialBootstrapOrder || initialBootstrapOrder.length === 0):', (!initialBootstrapOrder || initialBootstrapOrder.length === 0));
            }
            console.log('🔚 RedBlueConfig initializeConfig 结束\n');
        },

        // 转换玩家对象数组为用户ID数组
        convertToUserIds(playersArray) {
            if (!Array.isArray(playersArray)) return [];

            return playersArray.map(player => {
                const userid = player.userid;
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

        // UserDrag 拖拽排序完成事件
        onUserSortEnd(e) {
            const newUserList = e.detail.listData;

            console.log('🎯 UserDrag 拖拽排序完成');
            console.log('  - 原 bootstrap_order:', this.data.bootstrap_order);
            console.log('  - 新 newUserList:', newUserList);

            this.setData({
                bootstrap_order: newUserList
            });

            RuntimeComponentsUtils.logger.log('RED_BLUE_CONFIG', 'UserDrag拖拽完成, 新顺序', newUserList);

            const eventData = {
                red_blue_config: this.data.red_blue_config,
                bootstrap_order: this.convertToUserIds(newUserList)
            };
            console.log('📤 拖拽完成，触发 change 事件，数据:', eventData);

            // 触发变更事件, 传递用户ID数组
            this.triggerEvent('change', eventData);

            // 显示提示
            wx.showToast({
                title: '顺序调整完成',
                icon: 'success',
                duration: 1000
            });
        },

        // 获取当前配置（用于外部收集配置）
        getConfig() {
            return {
                red_blue_config: this.data.red_blue_config,
                bootstrap_order: this.convertToUserIds(this.data.bootstrap_order)
            };
        }
    }
}); 