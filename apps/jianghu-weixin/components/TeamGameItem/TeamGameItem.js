Component({
    properties: {
        /** 赛事数据对象 */
        event: {
            type: Object,
            value: {}
        }
    },

    data: {
        coverType: 'default',  // 'single' | 'multiple' | 'default'
        singleCover: '',
        teamAvatars: []
    },

    observers: {
        'event.extra_team_game_info': function(teamInfo) {
            if (!teamInfo) {
                this.setData({
                    coverType: 'default',
                    singleCover: '',
                    teamAvatars: []
                });
                return;
            }

            const baseUrl = 'https://qiaoyincapital.com';

            // 优先使用 cover 属性
            if (teamInfo.cover) {
                const cover = teamInfo.cover.startsWith('/') 
                    ? baseUrl + teamInfo.cover 
                    : teamInfo.cover;
                this.setData({
                    coverType: 'single',
                    singleCover: cover,
                    teamAvatars: []
                });
                return;
            }

            // 队内赛：使用 team_avatar
            if (teamInfo.team_avatar) {
                const avatar = teamInfo.team_avatar.startsWith('/')
                    ? baseUrl + teamInfo.team_avatar
                    : teamInfo.team_avatar;
                this.setData({
                    coverType: 'single',
                    singleCover: avatar,
                    teamAvatars: []
                });
                return;
            }

            // 队际赛：使用 teams 里面的 team_avatar
            if (teamInfo.teams && Array.isArray(teamInfo.teams) && teamInfo.teams.length > 0) {
                const teamAvatars = teamInfo.teams.map(team => {
                    const avatar = team.team_avatar || '';
                    if (avatar && avatar.startsWith('/')) {
                        return baseUrl + avatar;
                    }
                    return avatar;
                }).filter(Boolean);

                this.setData({
                    coverType: teamAvatars.length > 1 ? 'multiple' : 'single',
                    singleCover: teamAvatars[0] || '',
                    teamAvatars: teamAvatars
                });
                return;
            }

            // 默认情况（不应该出现）
            this.setData({
                coverType: 'single',
                singleCover: baseUrl + '/avatar/team_default_avatar.png',
                teamAvatars: []
            });
        }
    },

    methods: {
        /**
         * 点击赛事卡片
         * 跳转到队内赛/队际赛详情页
         */
        onItemTap() {
            const event = this.properties.event;
            if (!event || !event.gameid) {
                console.warn('[TeamGameItem] 缺少赛事数据');
                return;
            }

            const gameid = event.gameid;
            const teamGameInfo = event.extra_team_game_info;
            
            if (!teamGameInfo || !teamGameInfo.game_type) {
                console.warn('[TeamGameItem] 缺少队赛信息');
                return;
            }

            const gameType = teamGameInfo.game_type; // 'single_team' 或 'cross_teams'
            
            // 将 event 数据存入缓存，供 TeamGameDetail 使用
            wx.setStorageSync('teamGameEventData', event);
            
            const navigationHelper = require('@/utils/navigationHelper.js');
            navigationHelper.navigateTo(`/packageTeam/team-game/TeamGameDetail?game_id=${gameid}&game_type=${gameType}`)
                .catch(err => {
                    console.error('[TeamGameItem] 跳转失败:', err);
                    wx.showToast({ title: '页面跳转失败', icon: 'none' });
                });
        }
    }
});

