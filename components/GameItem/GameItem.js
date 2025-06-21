Component({
    properties: {
        gameName: String,
        course: String,
        players: Array,
        watchersNumber: Number,
        gameStart: String,
        completedHoles: Number,
        holes: Number,
        starType: {
            type: String,
            value: 'gray' // gray或yellow
        },
        have_gamble: {
            type: Boolean,
            value: false
        },
        gameId: {
            type: String,
            value: ''
        },
        groups: {
            type: Array,
            value: []
        },
        groupid: {
            type: String,
            value: ''
        },
        group_name: {
            type: String,
            value: ''
        }
    },
    data: {
        avatarUrls: []
    },
    observers: {
        'players': function (players) {
            this.setData({
                avatarUrls: players?.map(p => p?.avatar) || []
            });
        }
    },
    methods: {
        _groupPlayersByGroupId(players, gameData) {
            console.log('🔄 开始分组玩家数据:', { players, gameData });

            if (!players || !Array.isArray(players)) {
                console.warn('⚠️ 玩家数据为空或不是数组');
                return [];
            }

            const groupMap = new Map();

            for (const player of players) {
                const groupId = player?.groupid || player?.group_id;
                if (!groupId) {
                    console.warn('⚠️ 玩家缺少 groupid:', player);
                    continue;
                }

                if (!groupMap.has(groupId)) {
                    let groupName = '';

                    if (gameData.groups && Array.isArray(gameData.groups)) {
                        const groupInfo = gameData.groups.find(g =>
                            String(g.groupid || g.group_id || g.id) === String(groupId)
                        );
                        if (groupInfo) {
                            groupName = groupInfo.group_name || groupInfo.groupName || groupInfo.name;
                        }
                    }

                    if (!groupName && gameData.group_name && String(gameData.groupid) === String(groupId)) {
                        groupName = gameData.group_name;
                    }

                    if (!groupName) {
                        groupName = `第${groupMap.size + 1}组`;
                    }

                    console.log(`📝 分组 ${groupId} 名称: "${groupName}"`);

                    groupMap.set(groupId, {
                        groupId: String(groupId),
                        groupName: groupName,
                        players: []
                    });
                }

                groupMap.get(groupId).players.push(player);
            }

            const groupsArray = Array.from(groupMap.values());
            console.log('✅ 分组完成:', groupsArray);

            return groupsArray;
        },

        onMatchItemTap() {
            const { gameId, gameName, course, players } = this.properties;

            const processedGroups = this._groupPlayersByGroupId(players, this.properties);

            console.log('📊 处理后的分组数据:', processedGroups);

            if (!processedGroups || processedGroups.length === 0) {
                console.warn('⚠️ 游戏没有分组数据，直接进入游戏详情');
                wx.navigateTo({
                    url: `/pages/gameDetail/gameDetail?gameId=${gameId}`
                });
                return;
            }

            if (processedGroups.length === 1) {
                const groupId = processedGroups[0]?.groupId;
                console.log('📍 单组游戏，直接进入详情页面', { gameId, groupId });
                wx.navigateTo({
                    url: `/pages/gameDetail/gameDetail?gameId=${gameId}&groupId=${groupId}`
                });
            } else {
                console.log('📋 多组游戏，进入分组列表页面', { gameId, groupsCount: processedGroups.length });

                const app = getApp();
                app.globalData = app.globalData || {};
                app.globalData.currentGameGroups = {
                    gameId,
                    gameName,
                    course,
                    groups: processedGroups
                };

                wx.navigateTo({
                    url: `/pages/groupsList/groupsList?gameId=${gameId}`
                });
            }
        }
    }
})