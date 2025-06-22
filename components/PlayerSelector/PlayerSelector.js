Component({
    properties: {
        // 组的索引
        groupIndex: {
            type: Number,
            value: 0
        },
        // 已选择的玩家列表 - 现在是对象数组
        players: {
            type: Array,
            value: []
        },
        // 最大玩家数量
        maxPlayers: {
            type: Number,
            value: 4
        }
    },

    data: {
        // 玩家列表（支持空位）- 每个玩家对象现在包含 join_type 字段
        playerSlots: [null, null, null, null], // null 表示空位，对象表示已选择的玩家
        // 有效玩家数量
        validPlayerCount: 0,
        // 玩家来源映射
        joinTypeMap: {
            'combineSelect': '老牌组合',
            'friendSelect': '好友选择',
            'manualAdd': '手工添加',
            'wxshare': '微信分享',
            'qrcode': '二维码'
        }
    },

    observers: {
        'players': function (newPlayers) {
            console.log('PlayerSelector 监听到 players 变化:', newPlayers);
            this.updatePlayerSlots(newPlayers);
        }
    },

    methods: {
        /**
         * 更新玩家位置数据
         */
        updatePlayerSlots(players) {
            if (!Array.isArray(players)) {
                console.log('PlayerSelector: players 不是数组，忽略更新');
                return;
            }

            const playerSlots = [null, null, null, null];

            // 将传入的玩家数据填充到对应位置
            players.forEach((player, index) => {
                if (index < 4 && player) {
                    // 确保每个玩家对象都有必要字段
                    playerSlots[index] = {
                        ...player,
                        join_type: player.join_type || 'unknown',  // 如果没有 join_type 字段，设置为 unknown
                        tee: player.tee || 'blue'  // 如果没有 tee 字段，设置为默认蓝T
                    };
                }
            });

            console.log('PlayerSelector 更新 playerSlots:', playerSlots);

            this.setData({
                playerSlots
            });

            // 更新有效玩家数量
            this.updateValidPlayerCount();
        },

        /**
         * 计算有效玩家数量
         */
        updateValidPlayerCount() {
            const validCount = this.data.playerSlots.filter(player => player !== null).length;
            this.setData({
                validPlayerCount: validCount
            });
        },

        /**
         * 选择玩家（点击空位时调用）
         */
        onSelectPlayer(e) {
            const slotIndex = e.currentTarget.dataset.index;

            // 获取当前页面栈
            const pages = getCurrentPages();
            // 查找 commonCreate 页面
            let commonCreatePage = null;
            for (let i = pages.length - 1; i >= 0; i--) {
                const page = pages[i];
                if (page.route && page.route.includes('commonCreate')) {
                    commonCreatePage = page;
                    break;
                }
            }

            // 获取 UUID
            const uuid = commonCreatePage?.data?.uuid || '';

            // 跳转到玩家选择页面，传递组索引、位置索引和 UUID
            wx.navigateTo({
                url: `/pages/player-select/player-select?groupIndex=${this.properties.groupIndex}&slotIndex=${slotIndex}&uuid=${uuid}`
            });
        },

        /**
         * 将玩家添加到指定位置（由玩家选择页面回调）
         */
        addPlayerToSlot(slotIndex, player, join_type = 'unknown') {
            console.log('PlayerSelector addPlayerToSlot 被调用:', { slotIndex, player, join_type });

            const playerSlots = [...this.data.playerSlots];
            // 添加 join_type 和 tee 字段
            playerSlots[slotIndex] = {
                ...player,
                join_type: join_type,
                tee: player.tee || 'blue'  // 默认设置为蓝T
            };

            this.setData({
                playerSlots
            });

            // 更新有效玩家数量
            this.updateValidPlayerCount();

            // 过滤掉空位，获取有效玩家列表
            const validPlayers = playerSlots.filter(player => player !== null);

            // 触发父组件事件
            this.triggerEvent('playersChange', {
                groupIndex: this.properties.groupIndex,
                players: validPlayers
            });

            // 显示添加成功提示，包含来源信息
            const joinTypeText = this.data.joinTypeMap[join_type] || '未知来源';
            wx.showToast({
                title: `已添加 ${player.wx_nickname}（${joinTypeText}）`,
                icon: 'success'
            });
        },

        /**
         * 移除玩家
         */
        removePlayer(e) {
            const index = e.currentTarget.dataset.index;
            const playerSlots = [...this.data.playerSlots];
            const removedPlayer = playerSlots[index];

            playerSlots[index] = null;

            this.setData({
                playerSlots
            });

            // 更新有效玩家数量
            this.updateValidPlayerCount();

            // 过滤掉空位，获取有效玩家列表
            const validPlayers = playerSlots.filter(player => player !== null);

            // 触发父组件事件
            this.triggerEvent('playersChange', {
                groupIndex: this.properties.groupIndex,
                players: validPlayers
            });

            // 显示移除成功提示，包含来源信息
            const joinTypeText = this.data.joinTypeMap[removedPlayer.join_type] || '未知来源';
            wx.showToast({
                title: `已移除 ${removedPlayer.wx_nickname}（${joinTypeText}）`,
                icon: 'success'
            });
        }
    },

    lifetimes: {
        attached() {
            // 组件实例进入页面节点树时执行
            console.log('PlayerSelector 组件已挂载, groupIndex:', this.properties.groupIndex);

            // 初始化玩家位置（如果有传入的玩家数据）
            if (this.properties.players && this.properties.players.length > 0) {
                this.updatePlayerSlots(this.properties.players);
            } else {
                // 初始化有效玩家数量
                this.updateValidPlayerCount();
            }
        }
    }
}); 