import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../stores/gameStore';
import gameApi from '../../api/modules/game';

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
        playerItemHeight: 120,
        isSaving: false
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameid', 'gameData', 'players', 'holes', 'scores', 'isSaving'],
                actions: ['updateCellScore', 'setSaving', 'batchUpdateScoresForHole'],
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
        show({ holeIndex, playerIndex, unique_key }) {
            console.log(`[ScoreInputPanel] Show triggered for Hole: ${holeIndex}, Player: ${playerIndex}, UniqueKey: ${unique_key}`);

            // 类型检查和保护
            if (typeof unique_key !== 'string') {
                console.warn(`⚠️ [ScoreInputPanel] unique_key 不是字符串类型: ${typeof unique_key}, 值: ${unique_key}`);
                unique_key = String(unique_key || ''); // 强制转换为字符串
            }

            const holeInfo = this.data.holes[holeIndex];
            if (!holeInfo) {
                console.error(`❌ [ScoreInputPanel] 无法找到洞信息: holeIndex=${holeIndex}`);
                return;
            }

            // 确保 holeInfo.unique_key 也是字符串
            if (typeof holeInfo.unique_key !== 'string') {
                console.warn(`⚠️ [ScoreInputPanel] holeInfo.unique_key 不是字符串类型: ${typeof holeInfo.unique_key}, 值: ${holeInfo.unique_key}`);
                holeInfo.unique_key = String(holeInfo.unique_key || '');
            }

            const players = this.data.players;
            const gameData = this.data.gameData;

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
                holeInfo: { ...holeInfo, originalIndex: holeIndex, unique_key: unique_key },
                players: players,
                gameData: gameData,
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

            if (newValue < 0) return;

            this.setData({
                [`localScores[${index}].${type}`]: newValue
            });
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
            if (this.data.isSaving) {
                return; // 防止重复提交
            }
            const holeIndexForStore = this.data.holeInfo.originalIndex; // 用于更新store的数组索引
            const holeUniqueKeyForAPI = this.data.holeInfo.unique_key; // 用于发送给API的唯一键

            if (holeIndexForStore === undefined) {
                console.error("无法获取到holeIndex，保存失败");
                return;
            }

            // 1. 保存旧值，用于回滚
            const oldScores = this.data.players.map((_, pIndex) => {
                return { ...this.data.scores[pIndex][holeIndexForStore] };
            });

            // 2. 设置保存状态
            this.setSaving(true);

            // 3. 乐观更新
            for (let i = 0; i < this.data.localScores.length; i++) {
                const playerScore = this.data.localScores[i];
                this.updateCellScore({
                    playerIndex: i,
                    holeIndex: holeIndexForStore,
                    ...playerScore
                });
            }

            try {
                // 4. 调用API
                const apiData = {
                    gameId: this.data.gameid,
                    holeIndex: holeUniqueKeyForAPI, // <--- 使用 unique_key
                    scores: this.data.localScores,
                };
                await gameApi.saveGameScores(apiData);
                wx.showToast({ title: '已保存', icon: 'success', duration: 1500 });

            } catch (err) {
                // 5. 失败回滚
                wx.showToast({ title: '保存失败,已撤销', icon: 'error' });
                this.batchUpdateScoresForHole({
                    holeIndex: holeIndexForStore,
                    scoresToUpdate: oldScores,
                });

            } finally {
                // 6. 无论成功失败，都结束保存状态
                this.setSaving(false);
            }
        },

        async handleConfirm() {
            await this._saveChanges();
            if (this.data.isSaving) return; // 如果仍在保存中，则不切换
            const currentIndex = this.data.activePlayerIndex;
            const totalPlayers = this.data.players.length;

            if (currentIndex < totalPlayers - 1) {
                this._updateScopingAreaPosition(currentIndex + 1);
            } else {
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

        // 阻止事件冒泡的空方法
        preventBubble() {
            // 空方法，用于阻止事件冒泡
        },
    }
}) 