import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../stores/gameStore';

const app = getApp()
Component({
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

    observers: {
        'isSaving': function (newIsSaving) {
            console.log('🧪 [ScoreInputPanel] isSaving变化检测:', newIsSaving);
        }
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameid', 'groupId', 'gameData', 'players', 'holes', 'scores', 'isSaving'],
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
                    putts: scoreData.putts,
                    penalty_strokes: scoreData.penalty_strokes || 0,
                    sand_save: scoreData.sand_save || 0,
                };
            });

            for (const score of localScores) {
                if (!score.score || score.score === 0) {
                    score.score = holeInfo.par || 0;
                    score.putts = 2;
                }
            }

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
            console.log('🙈 执行 hide() 方法');
            this.setData({
                isVisible: false,
                holeInfo: null,
                localScores: [],
            });
            console.log('🙈 hide() 方法执行完成，isVisible:', this.data.isVisible);
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
            const totalScore = (playerScore.putts || 0) + (playerScore.penalty_strokes || 0);
            // 这个逻辑需要根据产品需求细化，暂时以推杆+罚杆为例
            // this.setData({
            //     [`localScores[${playerIndex}].score`]: totalScore
            // });
        },

        async _saveChanges() {
            if (this.data.isSaving) {
                console.log('⚠️ [ScoreInputPanel] 正在保存中，跳过本次保存');
                return; // 防止重复提交
            }
            const holeIndexForStore = this.data.holeInfo.originalIndex; // 用于更新store的数组索引
            const holeUniqueKeyForAPI = this.data.holeInfo.unique_key; // 用于发送给API的唯一键

            if (holeIndexForStore === undefined) {
                console.error("❌ [ScoreInputPanel] 无法获取到holeIndex，保存失败");
                return;
            }

            console.log('💾 [ScoreInputPanel] 开始保存流程:', {
                holeIndexForStore,
                holeUniqueKeyForAPI,
                localScores: this.data.localScores
            });

            // 1. 保存旧值，用于回滚
            const oldScores = this.data.players.map((_, pIndex) => {
                return { ...this.data.scores[pIndex][holeIndexForStore] };
            });
            console.log('💾 [ScoreInputPanel] 保存旧分数用于回滚:', oldScores);

            // 2. 设置保存状态
            console.log('💾 [ScoreInputPanel] 设置保存状态为true');
            this.setSaving(true);

            // 3. 乐观更新
            console.log('🔄 [ScoreInputPanel] ===== 开始乐观更新 =====');
            console.log('🔄 [ScoreInputPanel] 目标洞索引:', holeIndexForStore);
            console.log('🔄 [ScoreInputPanel] 玩家数量:', this.data.localScores.length);

            for (let i = 0; i < this.data.localScores.length; i++) {
                const playerScore = this.data.localScores[i];
                console.log(`🔄 [ScoreInputPanel] 更新玩家 ${i} 分数:`, playerScore);

                // 调用store的乐观更新
                this.updateCellScore({
                    playerIndex: i,
                    holeIndex: holeIndexForStore,
                    ...playerScore
                });
                console.log(`✅ [ScoreInputPanel] 玩家 ${i} 乐观更新完成`);
            }
            console.log('🔄 [ScoreInputPanel] ===== 乐观更新完成 =====');

            try {
                // 4. 调用API
                const apiData = {
                    gameId: this.data.gameid,
                    groupId: this.data.groupId, // 添加分组ID
                    holeUniqueKey: holeUniqueKeyForAPI, // 使用 unique_key 作为洞的唯一标识
                    scores: this.data.localScores,
                };

                console.log('📡 [ScoreInputPanel] 发送API请求:', apiData);
                await app.api.game.saveGameScore(apiData);  // 修复：使用正确的方法名
                console.log('✅ [ScoreInputPanel] API调用成功');
                wx.showToast({ title: '已保存', icon: 'success', duration: 1500 });

            } catch (err) {
                // 5. 失败回滚
                console.error('❌ [ScoreInputPanel] API调用失败，开始回滚:', err);
                wx.showToast({ title: '保存失败,已撤销', icon: 'error' });
                this.batchUpdateScoresForHole({
                    holeIndex: holeIndexForStore,
                    scoresToUpdate: oldScores,
                });
                console.log('🔄 [ScoreInputPanel] 回滚完成');

            } finally {
                // 6. 无论成功失败，都结束保存状态
                console.log('💾 [ScoreInputPanel] 重置保存状态为false');
                this.setSaving(false);
                console.log('💾 [ScoreInputPanel] 保存流程结束，isSaving 已重置为 false');

                // 7. 等待一个微任务周期，确保状态更新完成
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        },

        async handleConfirm() {
            console.log('🎯 handleConfirm 开始，当前 isSaving:', this.data.isSaving);
            await this._saveChanges();

            // 等待状态更新完成
            await new Promise(resolve => setTimeout(resolve, 10));
            console.log('🎯 _saveChanges 完成，当前 isSaving:', this.data.isSaving);

            // 移除这个检查，因为 _saveChanges 已经处理了保存状态
            // if (this.data.isSaving) {
            //     console.log('⚠️ 仍在保存中，不执行后续操作');
            //     return; // 如果仍在保存中，则不切换
            // }

            const currentIndex = this.data.activePlayerIndex;
            const totalPlayers = this.data.players.length;

            console.log('🎯 准备切换/隐藏，当前玩家:', currentIndex, '总玩家数:', totalPlayers);
            console.log('🎯 判断条件:', currentIndex, '<', totalPlayers - 1, '=', currentIndex < totalPlayers - 1);

            if (currentIndex < totalPlayers - 1) {
                console.log('🎯 切换到下一个玩家');
                this._updateScopingAreaPosition(currentIndex + 1);
            } else {
                console.log('🎯 隐藏 Panel');
                this.hide();
            }
            console.log('🎯 handleConfirm 结束');
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
                            putts: 0,
                            penalty_strokes: 0,
                            sand_save: 0,
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