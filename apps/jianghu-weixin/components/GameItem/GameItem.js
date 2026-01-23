import { config } from '@/api/config';

Component({
    properties: {
        gameName: String,
        course: String,
        players: Array,
        watchersNumber: Number,
        gameStart: String,
        completedHoles: {
            type: Number,
            value: 0
        },
        holes: {
            type: Number,
            value: 18
        },
        if_star_game: {
            type: String,
            value: 'n' // y=已星标, n=未星标
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
        },
        game_type: {
            type: String,
            value: 'common'
        },
        private: {
            type: String,
            value: 'n'
        },
        has_gamble: {
            type: String,
            value: 'n'
        },
        privacy_password: {
            type: String,
            value: ''
        },
        extra_team_game_info: {
            type: Object,
            value: null
        }
    },

    data: {
        fullTeamAvatarUrl: ''
    },

    observers: {
        'extra_team_game_info': function (teamInfo) {
            if (teamInfo && teamInfo.team_avatar) {
                // 如果是相对路径（以 / 开头），拼接完整域名
                if (teamInfo.team_avatar.startsWith('/')) {
                    this.setData({
                        fullTeamAvatarUrl: config.staticURL + teamInfo.team_avatar
                    });
                    console.log('🔗 团队头像完整URL:', config.staticURL + teamInfo.team_avatar);
                } else {
                    // 如果已经是完整URL，直接使用
                    this.setData({
                        fullTeamAvatarUrl: teamInfo.team_avatar
                    });
                }
            }
        }
    },

    attached() {
        // 组件实例被放入页面节点树后执行
        console.log('🎮 GameItem 组件加载:', {
            game_type: this.properties.game_type,
            extra_team_game_info: this.properties.extra_team_game_info,
            gameName: this.properties.gameName
        });
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

                    // 后端 MDetailGame.getGroupsInfo 返回的分组信息使用 group_name 字段
                    if (gameData.groups && Array.isArray(gameData.groups)) {
                        const groupInfo = gameData.groups.find(g =>
                            String(g.groupid) === String(groupid)
                        );
                        if (groupInfo) {
                            groupName = groupInfo.group_name || '';
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
            const navigationHelper = require('@/utils/navigationHelper.js');

            if (this.properties.private === 'y') {
                navigationHelper.navigateTo(`/pages/private-access/private-access?gameid=${gameid}`);
                return;
            }

            const processedGroups = this._groupPlayersByGroupId(players, this.properties);

            console.log('📊 处理后的分组数据:', processedGroups);

            if (!processedGroups || processedGroups.length === 0) {
                console.warn('⚠️ 游戏没有分组数据, 直接进入游戏详情');
                navigationHelper.navigateTo(`/packageGame/gameDetail/score/score?gameid=${gameid}`)
                    .catch(err => {
                        console.error('跳转游戏详情失败:', err);
                        wx.showToast({ title: '页面跳转失败', icon: 'none' });
                    });
                return;
            }

            if (processedGroups.length === 1) {
                const groupid = processedGroups[0]?.groupid;
                console.log('📍 单组游戏, 直接进入详情页面', { gameid, groupid });
                navigationHelper.navigateTo(`/packageGame/gameDetail/score/score?gameid=${gameid}&groupid=${groupid}`)
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
