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
        // 玩家列表（支持空位）
        playerSlots: [null, null, null, null], // null 表示空位，对象表示已选择的玩家
        // 有效玩家数量
        validPlayerCount: 0
    },

    methods: {
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

            // 跳转到玩家选择页面，传递组索引和位置索引
            wx.navigateTo({
                url: `/pages/player-select/player-select?groupIndex=${this.properties.groupIndex}&slotIndex=${slotIndex}`
            });
        },

        /**
         * 将玩家添加到指定位置（由玩家选择页面回调）
         */
        addPlayerToSlot(slotIndex, player) {
            const playerSlots = [...this.data.playerSlots];
            playerSlots[slotIndex] = player;

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

            wx.showToast({
                title: `已添加 ${player.wx_nickname}`,
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

            wx.showToast({
                title: `已移除 ${removedPlayer.wx_nickname}`,
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
                const playerSlots = [null, null, null, null];
                this.properties.players.forEach((player, index) => {
                    if (index < 4) {
                        playerSlots[index] = player;
                    }
                });
                this.setData({
                    playerSlots
                });
            }

            // 初始化有效玩家数量
            this.updateValidPlayerCount();
        }
    }
}); 