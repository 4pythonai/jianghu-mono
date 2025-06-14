Component({
    properties: {
        // 组的索引
        groupIndex: {
            type: Number,
            value: 0
        },
        // 已选择的玩家列表
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
        // 玩家姓名输入框的值
        playerNames: ['', '', '', ''],
        // 有效玩家数量
        validPlayerCount: 0
    },

    methods: {
        /**
         * 计算有效玩家数量
         */
        updateValidPlayerCount() {
            const validCount = this.data.playerNames.filter(name => name.trim() !== '').length;
            this.setData({
                validPlayerCount: validCount
            });
        },

        /**
         * 处理玩家姓名输入
         */
        onPlayerNameInput(e) {
            const index = e.currentTarget.dataset.index;
            const value = e.detail.value;
            const playerNames = [...this.data.playerNames];
            playerNames[index] = value;

            this.setData({
                playerNames
            });

            // 更新有效玩家数量
            this.updateValidPlayerCount();

            // 过滤掉空的玩家姓名
            const validPlayers = playerNames.filter(name => name.trim() !== '');

            // 触发父组件事件
            this.triggerEvent('playersChange', {
                groupIndex: this.properties.groupIndex,
                players: validPlayers
            });
        },

        /**
         * 添加玩家
         */
        addPlayer() {
            const currentPlayers = this.data.playerNames.filter(name => name.trim() !== '');
            if (currentPlayers.length >= this.properties.maxPlayers) {
                wx.showToast({
                    title: `最多只能添加${this.properties.maxPlayers}名玩家`,
                    icon: 'none'
                });
                return;
            }

            // 找到第一个空的输入框并聚焦
            const playerNames = [...this.data.playerNames];
            const emptyIndex = playerNames.findIndex(name => name.trim() === '');
            if (emptyIndex !== -1) {
                // 这里可以触发对应输入框的聚焦
                wx.showToast({
                    title: '请填写玩家姓名',
                    icon: 'none'
                });
            }
        }
    },

    lifetimes: {
        attached() {
            // 组件实例进入页面节点树时执行
            console.log('PlayerSelector 组件已挂载, groupIndex:', this.properties.groupIndex);
            // 初始化有效玩家数量
            this.updateValidPlayerCount();
        }
    }
}); 