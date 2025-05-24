Component({
    properties: {
        gameId: {
            type: String,
            value: ''
        },
        gameData: {
            type: Object,
            value: null,
            observer: function (newVal) {
                if (newVal) {
                    this.processGameData(newVal);
                }
            }
        }
    },

    data: {
        playerScores: [], // 分数数据矩阵
        scrollSync: true, // 是否同步滚动
        scrollTop: 0,     // 当前滚动位置
        playerTotals: []  // 球员总分
    },

    methods: {
        // 处理比赛数据
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
            for (const score of gameData.scores) {
                const key = `${score.userid}_${score.holeid}`;
                scoreMap[key] = {
                    score: score.score,
                    putt: score.putt,
                    diff: score.diff
                };
            }

            // 4. 创建球员分数矩阵
            const playerScores = players.map(player => {
                return holeList.map(hole => {
                    const key = `${player.userid}_${hole.holeid}`;
                    return scoreMap[key] || { score: '', putt: '', diff: '' };
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

            this.setData({
                players,
                holeList,
                playerScores,
                playerTotals
            }, () => {
                this.scrollToLeft();
            });
        },

        // 计算球员总分
        calculateTotalScore(userId) {
            console.log('计算总分，球员ID:', userId);
            const playerIndex = this.data.players.findIndex(p => p.userid === userId);
            if (playerIndex === -1) {
                console.warn('未找到对应球员，ID:', userId);
                return 0;
            }

            if (!this.data.playerScores || !this.data.playerScores[playerIndex]) {
                console.error('缺少分数数据，球员索引:', playerIndex);
                return 0;
            }

            return this.data.playerScores[playerIndex].reduce((sum, holeScore) => {
                const score = parseInt(holeScore.score) || 0;
                return sum + score;
            }, 0);
        },

        // 滚动到最左侧
        scrollToLeft() {
            const query = wx.createSelectorQuery().in(this);
            query.select('#mainScroll').node().exec((res) => {
                if (res[0]?.node) {
                    res[0].node.scrollTo({ left: 0, behavior: 'auto' });
                }
            });
        },

        // 球员表格滚动事件
        onPlayerScroll(e) {
            if (!this.data.scrollSync) return;
            const scrollTop = e.detail.scrollTop;
            this.setData({ scrollTop });
            this.syncScrollPosition('holesTable', scrollTop);
            this.syncScrollPosition('totalTable', scrollTop);
        },

        // 球洞表格滚动事件
        onHolesScroll(e) {
            if (!this.data.scrollSync) return;
            const scrollTop = e.detail.scrollTop;
            this.setData({ scrollTop });
            this.syncScrollPosition('playerTable', scrollTop);
            this.syncScrollPosition('totalTable', scrollTop);
        },

        // 总分表格滚动事件
        onTotalScroll(e) {
            if (!this.data.scrollSync) return;
            const scrollTop = e.detail.scrollTop;
            this.setData({ scrollTop });
            this.syncScrollPosition('playerTable', scrollTop);
            this.syncScrollPosition('holesTable', scrollTop);
        },

        // 同步滚动位置
        syncScrollPosition(tableId, scrollTop) {
            const query = wx.createSelectorQuery().in(this);
            query.select(`#${tableId}`).node().exec((res) => {
                if (res[0]?.node) {
                    res[0].node.scrollTop = scrollTop;
                }
            });
        }
    }
})