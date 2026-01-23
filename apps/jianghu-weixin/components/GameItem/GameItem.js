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
        onMatchItemTap() {
            const { gameid, groups, game_type } = this.properties;
            const navigationHelper = require('@/utils/navigationHelper.js');

            if (this.properties.private === 'y') {
                navigationHelper.navigateTo(`/pages/private-access/private-access?gameid=${gameid}`);
                return;
            }

            // 如果有2个或更多分组，进入 eventHubPanel
            if (groups && groups.length >= 2) {
                console.log('📋 多组游戏, 进入 eventHubPanel', { gameid, groupsCount: groups.length });
                navigationHelper.navigateTo(`/packageTeam/eventHubPanel/eventHubPanel?gameid=${gameid}&game_type=${game_type}`)
                    .catch(err => {
                        console.error('跳转 eventHubPanel 失败:', err);
                        wx.showToast({ title: '页面跳转失败', icon: 'none' });
                    });
            } else {
                // 单组或无分组，直接进入 score 页面
                const groupid = groups && groups.length === 1 ? groups[0]?.groupid : '';
                console.log('📍 单组游戏, 直接进入详情页面', { gameid, groupid });
                const url = groupid 
                    ? `/packageGame/gameDetail/score/score?gameid=${gameid}&groupid=${groupid}`
                    : `/packageGame/gameDetail/score/score?gameid=${gameid}`;
                navigationHelper.navigateTo(url)
                    .catch(err => {
                        console.error('跳转游戏详情失败:', err);
                        wx.showToast({ title: '页面跳转失败', icon: 'none' });
                    });
            }
        }
    }
})
