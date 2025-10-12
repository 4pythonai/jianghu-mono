Component({
    properties: {
        gameName: String,
        course: String,
        players: Array,
        watchersNumber: Number,
        gameStart: String,
        completedHoles: Number,
        starType: {
            type: String,
            value: 'gray' // gray或yellow
        },
        gameid: {
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
    },


    methods: {
        _groupPlayersByGroupId(players, gameData) {

            if (!players || !Array.isArray(players)) {
                console.warn('⚠️ 玩家数据为空或不是数组');
                return [];
            }

            const groupMap = new Map();

            for (const player of players) {
                const groupid = player?.groupid;
                if (!groupid) {
                    console.warn('⚠️ 玩家缺少 groupid:', player);
                    continue;
                }

                if (!groupMap.has(groupid)) {
                    let groupName = '';

                    if (gameData.groups && Array.isArray(gameData.groups)) {
                        const groupInfo = gameData.groups.find(g =>
                            String(g.groupid) === String(groupid)
                        );
                        if (groupInfo) {
                            groupName = groupInfo.group_name || groupInfo.groupName || groupInfo.name;
                        }
                    }

                    if (!groupName && gameData.group_name && String(gameData.groupid) === String(groupid)) {
                        groupName = gameData.group_name;
                    }

                    if (!groupName) {
                        groupName = `第${groupMap.size + 1}组`;
                    }

                    console.log(`📝 分组 ${groupid} 名称: "${groupName}"`);

                    groupMap.set(groupid, {
                        groupid: String(groupid),
                        groupName: groupName,
                        players: []
                    });
                }

                groupMap.get(groupid).players.push(player);
            }

            const groupsArray = Array.from(groupMap.values());
            console.log('✅ 分组完成:', groupsArray);

            return groupsArray;
        },

        onMatchItemTap() {
            const { gameid, gameName, course, players } = this.properties;

            const processedGroups = this._groupPlayersByGroupId(players, this.properties);

            console.log('📊 处理后的分组数据:', processedGroups);

            // 引入导航助手
            const navigationHelper = require('@/utils/navigationHelper.js');

            if (!processedGroups || processedGroups.length === 0) {
                console.warn('⚠️ 游戏没有分组数据, 直接进入游戏详情');
                navigationHelper.navigateTo(`/pages/gameDetail/gameDetail?gameid=${gameid}`)
                    .catch(err => {
                        console.error('跳转游戏详情失败:', err);
                        wx.showToast({ title: '页面跳转失败', icon: 'none' });
                    });
                return;
            }

            if (processedGroups.length === 1) {
                const groupid = processedGroups[0]?.groupid;
                console.log('📍 单组游戏, 直接进入详情页面', { gameid, groupid });
                navigationHelper.navigateTo(`/pages/gameDetail/gameDetail?gameid=${gameid}&groupid=${groupid}`)
                    .catch(err => {
                        console.error('跳转游戏详情失败:', err);
                        wx.showToast({ title: '页面跳转失败', icon: 'none' });
                    });
            } else {
                console.log('📋 多组游戏, 进入分组列表页面', { gameid, groupsCount: processedGroups.length });

                const app = getApp();
                app.globalData = app.globalData || {};
                app.globalData.currentGameGroups = {
                    gameid,
                    gameName,
                    course,
                    groups: processedGroups
                };

                navigationHelper.navigateTo(`/pages/groupsList/groupsList?gameid=${gameid}`)
                    .catch(err => {
                        console.error('跳转分组列表失败:', err);
                        wx.showToast({ title: '页面跳转失败', icon: 'none' });
                    });
            }
        }
    }
})