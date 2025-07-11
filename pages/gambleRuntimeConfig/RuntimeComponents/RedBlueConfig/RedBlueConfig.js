// RedBlueConfig组件 - 红蓝分组配置
Component({
    properties: {
        // 所有玩家
        players: {
            type: Array,
            value: []
        },
        // 红队玩家
        redTeam: {
            type: Array,
            value: []
        },
        // 蓝队玩家
        blueTeam: {
            type: Array,
            value: []
        }
    },

    data: {
        // 拖拽相关
        draggedPlayer: null,
        draggedFromTeam: null,

        // 未分组玩家列表
        unassignedPlayers: []
    },

    lifetimes: {
        attached() {
            this.updateUnassignedPlayers();
        }
    },

    observers: {
        'players, redTeam, blueTeam': function (players, redTeam, blueTeam) {
            this.updateUnassignedPlayers();
        }
    },

    methods: {
        // 更新未分组玩家列表
        updateUnassignedPlayers() {
            const { players, redTeam, blueTeam } = this.data;

            // 获取已分组玩家的ID
            const assignedIds = [
                ...redTeam.map(player => player.userid),
                ...blueTeam.map(player => player.userid)
            ];

            // 过滤出未分组的玩家
            const unassignedPlayers = players.filter(player =>
                !assignedIds.includes(player.userid)
            );

            this.setData({
                unassignedPlayers
            });

            console.log('🔴🔵 [RedBlueConfig] 未分组玩家更新:', unassignedPlayers);
        },

        // 玩家分配到红队
        assignToRedTeam(e) {
            const { player } = e.currentTarget.dataset;
            const playerData = typeof player === 'string' ? JSON.parse(player) : player;

            this.movePlayerToTeam(playerData, 'red');
        },

        // 玩家分配到蓝队
        assignToBlueTeam(e) {
            const { player } = e.currentTarget.dataset;
            const playerData = typeof player === 'string' ? JSON.parse(player) : player;

            this.movePlayerToTeam(playerData, 'blue');
        },

        // 从红队移除玩家
        removeFromRedTeam(e) {
            const { player } = e.currentTarget.dataset;
            const playerData = typeof player === 'string' ? JSON.parse(player) : player;

            this.movePlayerToTeam(playerData, 'unassigned');
        },

        // 从蓝队移除玩家
        removeFromBlueTeam(e) {
            const { player } = e.currentTarget.dataset;
            const playerData = typeof player === 'string' ? JSON.parse(player) : player;

            this.movePlayerToTeam(playerData, 'unassigned');
        },

        // 移动玩家到指定队伍
        movePlayerToTeam(player, targetTeam) {
            let { redTeam, blueTeam } = this.data;

            // 从当前队伍中移除玩家
            redTeam = redTeam.filter(p => p.userid !== player.userid);
            blueTeam = blueTeam.filter(p => p.userid !== player.userid);

            // 添加到目标队伍
            if (targetTeam === 'red') {
                redTeam.push(player);
            } else if (targetTeam === 'blue') {
                blueTeam.push(player);
            }
            // 如果是 'unassigned'，则什么都不做，玩家会回到未分组列表

            this.setData({
                redTeam,
                blueTeam
            });

            console.log('🔴🔵 [RedBlueConfig] 玩家移动:', {
                player: player.nickname,
                targetTeam,
                redTeam,
                blueTeam
            });

            // 触发变更事件
            this.triggerEvent('change', {
                redTeam,
                blueTeam
            });
        },

        // 自动分组
        autoAssign() {
            const { unassignedPlayers } = this.data;

            if (unassignedPlayers.length === 0) {
                wx.showToast({
                    title: '没有未分组的玩家',
                    icon: 'none'
                });
                return;
            }

            // 随机分配
            const shuffled = [...unassignedPlayers].sort(() => Math.random() - 0.5);
            const redTeam = [];
            const blueTeam = [];

            shuffled.forEach((player, index) => {
                if (index % 2 === 0) {
                    redTeam.push(player);
                } else {
                    blueTeam.push(player);
                }
            });

            this.setData({
                redTeam,
                blueTeam
            });

            console.log('🔴🔵 [RedBlueConfig] 自动分组:', { redTeam, blueTeam });

            // 触发变更事件
            this.triggerEvent('change', {
                redTeam,
                blueTeam
            });
        },

        // 重置分组
        resetTeams() {
            this.setData({
                redTeam: [],
                blueTeam: []
            });

            console.log('🔴🔵 [RedBlueConfig] 重置分组');

            // 触发变更事件
            this.triggerEvent('change', {
                redTeam: [],
                blueTeam: []
            });
        },

        // 获取玩家头像
        getPlayerAvatar(avatar) {
            return avatar || '/images/default-avatar.png';
        }
    }
}); 