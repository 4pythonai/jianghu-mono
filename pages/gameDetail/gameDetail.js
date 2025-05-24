import { getGameDetail } from '../../api/modules/game'

Page({
    data: {
        currentTab: 0, // 当前激活的tab索引
        gameId: '',
        players: [],      // 球员列表
        holeList: [],     // 球洞列表
        playerScores: [], // 分数数据矩阵
        scrollSync: true, // 是否同步滚动
        scrollTop: 0      // 当前滚动位置
    },

    onLoad(options) {
        // 确保内容加载后滚动到最左侧
        setTimeout(() => {
            const query = wx.createSelectorQuery();
            query.select('#mainScroll').node().exec((res) => {
                if (res[0] && res[0].node) {
                    res[0].node.scrollTo({
                        left: 0,
                        behavior: 'auto'
                    });
                }
            });
        }, 300);
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

        // 3. 预处理分数数据
        const scoreMap = {};
        gameData.scores.forEach(score => {
            const key = `${score.userid}_${score.holeid}`;
            scoreMap[key] = {
                score: score.score,
                putt: score.putt
            };
        });

        // 4. 创建球员分数矩阵
        const playerScores = players.map(player => {
            return holeList.map(hole => {
                const key = `${player.userid}_${hole.holeid}`;
                return scoreMap[key] || { score: '', putt: '' };
            });
        });

        // 5. 计算每个球员的总分
        const playerTotals = players.map((player, index) => {
            console.log(`计算球员 ${player.userid} 的总分`);
            const scores = playerScores[index];
            if (!scores) {
                console.warn(`未找到球员 ${player.userid} 的分数数据`);
                return 0;
            }

            const total = scores.reduce((sum, hole) => {
                const score = parseInt(hole.score) || 0;
                console.log(`球洞 ${hole.holeid} 分数:`, score);
                return sum + score;
            }, 0);

            console.log(`球员 ${player.userid} 总分:`, total);
            return total;
        });

        // 6. 设置数据
        console.log('最终处理数据:', {
            players,
            holeList,
            playerScores,
            playerTotals
        });

        this.setData({
            players,
            holeList,
            playerScores,
            playerTotals  // 包含预先计算的总分
        }, () => {
            console.log('数据设置完成，滚动到最左侧');
            const query = wx.createSelectorQuery();
            query.select('#mainScroll').node().exec((res) => {
                if (res[0]?.node) {
                    res[0].node.scrollTo({ left: 0, behavior: 'auto' });
                }
            });
        });
    },

    // 计算球员总分
    calculateTotalScore(userId) {
        // 调试日志：检查传入的userId
        console.log('计算总分，球员ID:', userId);

        // 查找球员索引
        const playerIndex = this.data.players.findIndex(p => p.userid === userId);
        if (playerIndex === -1) {
            console.warn('未找到对应球员，ID:', userId);
            return 0;
        }

        // 调试日志：检查球员数据
        console.log('球员数据:', this.data.players[playerIndex]);

        // 确保playerScores存在
        if (!this.data.playerScores || !this.data.playerScores[playerIndex]) {
            console.error('缺少分数数据，球员索引:', playerIndex);
            return 0;
        }

        // 计算总分
        const total = this.data.playerScores[playerIndex].reduce((sum, holeScore) => {
            const score = parseInt(holeScore.score) || 0;
            console.log('球洞分数:', holeScore, '转换后:', score);
            return sum + score;
        }, 0);

        console.log('最终总分:', total);
        return total;
    },

    // 球员表格滚动事件
    onPlayerScroll(e) {
        if (!this.data.scrollSync) return;

        const scrollTop = e.detail.scrollTop;
        this.setData({ scrollTop });

        // 同步其他表格滚动位置
        this.syncScrollPosition('holesTable', scrollTop);
        this.syncScrollPosition('totalTable', scrollTop);
    },

    // 球洞表格滚动事件
    onHolesScroll(e) {
        if (!this.data.scrollSync) return;

        const scrollTop = e.detail.scrollTop;
        this.setData({ scrollTop });

        // 同步其他表格滚动位置
        this.syncScrollPosition('playerTable', scrollTop);
        this.syncScrollPosition('totalTable', scrollTop);
    },

    // 总分表格滚动事件
    onTotalScroll(e) {
        if (!this.data.scrollSync) return;

        const scrollTop = e.detail.scrollTop;
        this.setData({ scrollTop });

        // 同步其他表格滚动位置
        this.syncScrollPosition('playerTable', scrollTop);
        this.syncScrollPosition('holesTable', scrollTop);
    },

    // 同步滚动位置
    syncScrollPosition(tableId, scrollTop) {
        const query = wx.createSelectorQuery();
        query.select(`#${tableId}`).node().exec((res) => {
            if (res[0] && res[0].node) {
                res[0].node.scrollTop = scrollTop;
            }
        });
    }
})