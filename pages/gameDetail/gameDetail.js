import { getGameDetail } from '../../api/modules/game'

Page({
    usingComponents: {
        'bbs': './bbs/bbs',
        'gamble': './gamble/gamble',
        'scoring': './scoring/scoring'
    },
    data: {
        currentTab: 0, // 当前激活的tab索引
        gameId: '',
        players: [],      // 球员列表
        holeList: []      // 球洞列表
    },

    onLoad(options) {
        this.setData({
            gameId: options.gameId || '未获取到gameId'
        });

        // 获取比赛详情
        if (options.gameId) {
            getGameDetail({ gameId: options.gameId })
                .then(res => {
                    console.log('比赛详情数据:', res.gameinfo)
                    this.processGameData(res.gameinfo)
                })
                .catch(err => {
                    console.error('获取比赛详情失败:', err)
                })
        }
    },

    // 切换tab页方法
    switchTab: function (e) {
        this.setData({
            currentTab: parseInt(e.currentTarget.dataset.tab)
        });
    },

    processGameData(gameData) {
        console.log('原始游戏数据:', gameData);

        // 1. 处理球员数据
        const players = gameData.players.map((player, index) => ({
            userid: player.userid,
            avatar: player.avatar,
            tee: player.tee,
            nickname: player.nickname,
            index
        }));

        // 2. 处理球洞数据
        const holeList = gameData.holeList.map(hole => ({
            holeid: hole.holeid,
            holename: hole.holename,
            par: hole.par
        }));

        this.setData({
            players,
            holeList
        });
    }
})