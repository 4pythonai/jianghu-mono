import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../stores/gameStore';

Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        isVisible: false,
        activePlayerIndex: 0,
        holeInfo: null,
        localScores: [],
        players: [],
        playerItemHeight: 120
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameData', 'players', 'holes', 'scores'],
                actions: ['updateCellScore'],
            });
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        show({ holeIndex, playerIndex }) {
            console.log(`[ScoreInputPanel] Show triggered for Hole: ${holeIndex}, Player: ${playerIndex}`);

            const holeInfo = this.data.holes[holeIndex];
            const players = this.data.players;

            const localScores = players.map((player, pIndex) => {
                const scoreData = this.data.scores[pIndex][holeIndex];
                return {
                    userid: player.userid,
                    score: scoreData.score,
                    putt: scoreData.putt,
                    penalty: scoreData.penalty || 0,
                    sand: scoreData.sand || 0,
                };
            });

            localScores.forEach(score => {
                if (!score.score || score.score === 0) {
                    score.score = holeInfo.par || 0;
                    score.putt = 2;
                }
            });

            this.setData({
                isVisible: true,
                holeInfo: { ...holeInfo, originalIndex: holeIndex },
                players: players,
                localScores: localScores,
                activePlayerIndex: playerIndex,
            });
        },

        hide() {
            this.setData({
                isVisible: false,
                holeInfo: null,
                localScores: [],
            });
        },

        switchPlayer(e) {
            const index = e.currentTarget.dataset.index;
            this._updateScopingAreaPosition(index);
        },

        changeScore(e) {
            const { type, amount } = e.currentTarget.dataset;
            const index = this.data.activePlayerIndex;
            const currentScore = this.data.localScores[index][type] || 0;
            const newValue = currentScore + Number(amount);

            // 确保分数不小于0
            if (newValue < 0) {
                return;
            }

            this.setData({
                [`localScores[${index}].${type}`]: newValue
            });

            // 自动更新总成绩
            if (type !== 'score') {
                this._calculateTotalScore(index);
            }
        },

        _updateScopingAreaPosition(index) {
            this.setData({
                activePlayerIndex: index,
            });
        },

        _calculateTotalScore(playerIndex) {
            const playerScore = this.data.localScores[playerIndex];
            const par = this.data.holeInfo.par || 0;
            // 成绩 = PAR + 罚杆 + 沙坑进洞数(如果适用) + ... 这里暂时简化为 PAR + 罚杆
            // 实际的 "成绩" 应该是用户直接输入的总杆数，其他是辅助统计。
            // 这里我们让 "成绩" 跟随其他项变化
            const totalScore = (playerScore.putt || 0) + (playerScore.penalty || 0);
            // 这个逻辑需要根据产品需求细化，暂时以推杆+罚杆为例
            // this.setData({
            //     [`localScores[${playerIndex}].score`]: totalScore
            // });
        },

        async _saveChanges() {
            // 将 localScores 的改动同步回 mobx store
            console.log('📦 Saving changes to store:', this.data.localScores);
            const holeIndex = this.data.holeInfo.originalIndex; // 使用保存好的原始索引

            if (holeIndex === undefined) {
                console.error("无法获取到holeIndex，保存失败");
                return;
            }

            for (let i = 0; i < this.data.localScores.length; i++) {
                const playerScore = this.data.localScores[i];
                this.updateCellScore({
                    playerIndex: i,
                    holeIndex: holeIndex,
                    score: playerScore.score,
                    putt: playerScore.putt,
                    penalty: playerScore.penalty,
                    sand: playerScore.sand,
                });
            }
            // 这里可以加一个API调用来通知后端
            wx.showToast({ title: '已保存', icon: 'success', duration: 1500 });
        },

        async handleConfirm() {
            await this._saveChanges();
            const currentIndex = this.data.activePlayerIndex;
            const totalPlayers = this.data.players.length;

            if (currentIndex < totalPlayers - 1) {
                // 切换到下一位
                this._updateScopingAreaPosition(currentIndex + 1);
            } else {
                // 是最后一位，关闭面板
                this.hide();
            }
        },

        handleClear() {
            wx.showModal({
                title: '确认清除',
                content: '确定要清除本洞所有人的成绩吗？',
                success: async (res) => {
                    if (res.confirm) {
                        const clearedScores = this.data.localScores.map(item => ({
                            ...item,
                            score: 0,
                            putt: 0,
                            penalty: 0,
                            sand: 0,
                        }));
                        this.setData({ localScores: clearedScores });
                        await this._saveChanges();
                        this.hide();
                    }
                }
            });
        },

        async handleMaskClick() {
            await this._saveChanges();
            this.hide();
        },
    }
}) 