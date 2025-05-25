import { api } from '../../api/index'

Page({
    usingComponents: {
        'bbs': './bbs/bbs',
        'gamble': './gamble/gamble',
        'scoring': './scoring/scoring'
    },
    data: {
        currentTab: 0, // 当前激活的tab索引
        gameId: '',
        gameData: null // 原始比赛数据
    },

    onLoad(options) {
        this.setData({
            gameId: options.gameId || '未获取到gameId'
        });

        // 获取比赛详情
        if (options.gameId) {
            api.game.getGameDetail({ gameId: options.gameId })
                .then(res => {
                    console.log('比赛详情数据:', res.gameinfo)
                    this.setData({
                        gameData: res.gameinfo
                    })
                })
                .catch(err => {
                    console.error('获取比赛详情失败:', err)
                })
        }
    },

    // 切换tab页方法
    switchTab: function (e) {
        this.setData({
            currentTab: Number.parseInt(e.currentTarget.dataset.tab)
        });
    }
})